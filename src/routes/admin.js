const express = require('express');
const router = express.Router();
const NguoiDung = require('../models/NguoiDung');
const BacSi = require('../models/BacSi');
const BenhNhan = require('../models/BenhNhan');
const LichKham = require('../models/LichKham');
const { xacThucToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Middleware kiểm tra quyền ADMIN
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.vaiTro === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ message: "Quyền truy cập bị từ chối! Chỉ Admin mới có thể thực hiện thao tác này." });
  }
};

// Áp dụng gác cổng Token & Quyền Admin cho toàn bộ Route
router.use(xacThucToken, checkAdmin);

// 1. DSN SÁCH TÀI KHOẢN & NGƯỜI DÙNG: GET /api/admin/nguoi-dung
router.get('/nguoi-dung', async (req, res) => {
  try {
    const dsBacSi = await BacSi.find().populate('nguoiDungId', 'tenDangNhap vaiTro');
    const dsBenhNhan = await BenhNhan.find();

    return res.json({
      message: "Lấy danh sách người dùng thành công!",
      data: { bacSi: dsBacSi, benhNhan: dsBenhNhan }
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng!" });
  }
});

// 2. ĐIỀU PHỐI / XEM TOÀN BỘ LỊCH KHÁM: GET /api/admin/lich-kham
router.get('/lich-kham', async (req, res) => {
  try {
    const dsLichKham = await LichKham.find()
      .populate('bacSiId', 'hoTen soDienThoai')
      .populate('benhNhanId', 'hoTen soDienThoai')
      .sort({ thoiGianBatDau: -1 });

    return res.json({
      message: "Lấy toàn bộ lịch khám thành công!",
      data: dsLichKham
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi lấy danh sách lịch khám!" });
  }
});

// 3. CAN THIỆP HỦY / ĐỔI TRẠNG THÁI LỊCH KHÁM: PATCH /api/admin/dieu-phoi-lich/:id
router.patch('/dieu-phoi-lich/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai } = req.body; // "Đã hủy", "Chờ khám", "Hoàn thành"

    if (!trangThai) {
      return res.status(400).json({ message: "Vui lòng cung cấp trạng thái mới!" });
    }

    const lichKham = await LichKham.findById(id);
    if (!lichKham) {
      return res.status(404).json({ message: "Không tìm thấy lịch khám!" });
    }

    lichKham.trangThai = trangThai;
    await lichKham.save();

    return res.json({ message: "Điều phối trạng thái lịch khám thành công!", data: lichKham });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi điều phối lịch khám!" });
  }
});

// 4. THỐNG KÊ BÁO CÁO TOÀN HỆ THỐNG: GET /api/admin/thong-ke
router.get('/thong-ke', async (req, res) => {
  try {
    // 1. Thống kê tổng số lượng nhân sự & khách hàng
    const tongSoBacSi = await BacSi.countDocuments();
    const tongSoBenhNhan = await BenhNhan.countDocuments();

    // 2. Thống kê tổng quan lượt khám
    const tongSoLuotKham = await LichKham.countDocuments();
    const soCaChoKham = await LichKham.countDocuments({ trangThai: "Chờ khám" });
    const soCaHoanThanh = await LichKham.countDocuments({ trangThai: "Hoàn thành" });
    const soCaDaHuy = await LichKham.countDocuments({ trangThai: "Đã hủy" });

    // 3. Thống kê hiệu suất làm việc của từng Bác sĩ (Số ca khám hoàn thành)
    const hieuSuatBacSi = await LichKham.aggregate([
      { $match: { trangThai: "Hoàn thành" } },
      { $group: { _id: "$bacSiId", soCaHoanThanh: { $sum: 1 } } },
      { $lookup: { from: "bacsis", localField: "_id", foreignField: "_id", as: "thongTinBacSi" } },
      { $unwind: "$thongTinBacSi" },
      { $project: { _id: 1, hoTen: "$thongTinBacSi.hoTen", soDienThoai: "$thongTinBacSi.soDienThoai", soCaHoanThanh: 1 } }
    ]);

    // 4. Thống kê Bệnh nhân đặt lịch nhiều nhất (Top bệnh nhân)
    const topBenhNhan = await LichKham.aggregate([
      { $group: { _id: "$benhNhanId", soLuotKham: { $sum: 1 } } },
      { $sort: { soLuotKham: -1 } },
      { $limit: 5 },
      { $lookup: { from: "benhnhans", localField: "_id", foreignField: "_id", as: "thongTinBenhNhan" } },
      { $unwind: "$thongTinBenhNhan" },
      { $project: { _id: 1, hoTen: "$thongTinBenhNhan.hoTen", soDienThoai: "$thongTinBenhNhan.soDienThoai", soLuotKham: 1 } }
    ]);

    return res.json({
      message: "Lấy dữ liệu thống kê thành công!",
      data: {
        tongQuan: {
          tongSoBacSi,
          tongSoBenhNhan,
          tongSoLuotKham,
          choKham: soCaChoKham,
          hoanThanh: soCaHoanThanh,
          daHuy: soCaDaHuy
        },
        hieuSuatBacSi,
        topBenhNhan
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi tổng hợp thống kê!" });
  }
});

router.post('/bac-si', async (req, res) => {
  try {
    const { tenDangNhap, matKhau, hoTen, soDienThoai } = req.body;

    if (!tenDangNhap || !matKhau || !hoTen) {
      return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập, mật khẩu và họ tên Bác sĩ!" });
    }

    const userTonTai = await NguoiDung.findOne({ tenDangNhap });
    if (userTonTai) {
      return res.status(400).json({ message: "Tên đăng nhập này đã được sử dụng!" });
    }

    const hashedPassword = await bcrypt.hash(matKhau, 10);
    const userMoi = await NguoiDung.create({
      tenDangNhap,
      matKhau: hashedPassword,
      vaiTro: 'BAC_SI'
    });

    const bacSiMoi = await BacSi.create({
      nguoiDungId: userMoi._id,
      hoTen,
      soDienThoai: soDienThoai || null
    });

    return res.status(201).json({
      message: "Thêm Bác sĩ mới thành công!",
      data: bacSiMoi
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi thêm Bác sĩ!" });
  }
});

router.put('/bac-si/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hoTen, soDienThoai } = req.body;

    const bacSi = await BacSi.findByIdAndUpdate(
      id,
      { hoTen, soDienThoai },
      { new: true, runValidators: true }
    );

    if (!bacSi) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ Bác sĩ!" });
    }

    return res.json({
      message: "Cập nhật thông tin Bác sĩ thành công!",
      data: bacSi
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi cập nhật Bác sĩ!" });
  }
});

router.delete('/bac-si/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const bacSi = await BacSi.findByIdAndDelete(id);
    if (!bacSi) {
      return res.status(404).json({ message: "Không tìm thấy Bác sĩ để xóa!" });
    }

    // Tự động xóa tài khoản NguoiDung liên quan
    if (bacSi.nguoiDungId) {
      await NguoiDung.findByIdAndDelete(bacSi.nguoiDungId);
    }

    return res.json({ message: "Đã xóa thành công Bác sĩ và tài khoản liên quan!" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi xóa Bác sĩ!" });
  }
});

router.delete('/lich-kham/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lichKham = await LichKham.findByIdAndDelete(id);
    if (!lichKham) {
      return res.status(404).json({ message: "Không tìm thấy lịch khám để xóa!" });
    }

    return res.json({ message: "Đã xóa lịch khám khỏi hệ thống thành công!" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi xóa lịch khám!" });
  }
});

router.put('/bac-si/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hoTen, soDienThoai } = req.body;

    // Validate định dạng ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Mã ID Bác sĩ không đúng định dạng!" });
    }

    const bacSi = await BacSi.findByIdAndUpdate(
      id,
      { hoTen, soDienThoai },
      { new: true, runValidators: true }
    );

    if (!bacSi) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ Bác sĩ!" });
    }

    return res.json({
      message: "Cập nhật thông tin Bác sĩ thành công!",
      data: bacSi
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật Bác sĩ!" });
  }
});

module.exports = router;