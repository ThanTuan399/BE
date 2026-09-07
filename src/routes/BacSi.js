const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const LichKham = require('../models/LichKham');
const HoSoKham = require('../models/HoSoKham');
const DonThuoc = require('../models/DonThuoc');
const { xacThucToken } = require('../middleware/auth');

// Bắt buộc xác thực Token JWT cho toàn bộ API Bác sĩ
router.use(xacThucToken);

// 1. API XEM DANH SÁCH CA KHÁM CỦA BÁC SĨ ĐANG ĐĂNG NHẬP
// GET /api/bac-si/lich-kham
router.get('/lich-kham', async (req, res) => {
  try {
    const { bacSiId } = req.user;
    if (!bacSiId) {
      return res.status(400).json({ message: "Tài khoản hiện tại không gắn với hồ sơ Bác sĩ!" });
    }

    const dsLichKham = await LichKham.find({ bacSiId })
      .populate('benhNhanId', 'hoTen soDienThoai')
      .sort({ thoiGianBatDau: 1 });

    return res.json({
      message: "Lấy danh sách ca khám thành công!",
      data: dsLichKham
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi lấy lịch khám!" });
  }
});

// 2. API HOÀN THÀNH KHÁM (HỒ SƠ + KÊ ĐƠN + ĐỔI TRẠNG THÁI)
// POST /api/bac-si/hoan-thanh-kham
router.post('/hoan-thanh-kham', async (req, res) => {
  try {
    const { lichKhamId, trieuChung, chanDoan, chiTietThuoc } = req.body;

    // A. Kiểm tra dữ liệu đầu vào (Body Validation)
    if (!lichKhamId || !trieuChung || !chanDoan || !chiTietThuoc) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin khám và đơn thuốc!" });
    }

    // B. Kiểm tra định dạng ObjectId
    if (!mongoose.isValidObjectId(lichKhamId)) {
      return res.status(400).json({ message: "Mã lịch khám không đúng định dạng!" });
    }

    // C. Tìm lịch khám trong CSDL
    const lichKham = await LichKham.findById(lichKhamId);
    if (!lichKham) {
      return res.status(404).json({ message: "Không tìm thấy lịch khám!" });
    }

    // D. Edge Case 1: Kiểm tra chính chủ (Bác sĩ A không được khám ca của Bác sĩ B)
    if (!req.user.bacSiId || lichKham.bacSiId.toString() !== req.user.bacSiId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xử lý ca khám của bác sĩ khác!" });
    }

    // E. Edge Case 2: Kiểm tra trạng thái ca khám
    if (lichKham.trangThai === "Hoàn thành") {
      return res.status(400).json({ message: "Ca khám này đã được hoàn thành trước đó!" });
    }
    if (lichKham.trangThai === "Đã hủy") {
      return res.status(400).json({ message: "Không thể xử lý ca khám đã bị hủy!" });
    }

    // F. Thực thi lưu dữ liệu
    // 1. Tạo Hồ sơ khám
    const hoSoMoi = await HoSoKham.create({
      lichKhamId,
      trieuChung: String(trieuChung).trim(),
      chanDoan: String(chanDoan).trim()
    });

    // 2. Kê Đơn thuốc
    const donThuocMoi = await DonThuoc.create({
      hoSoKhamId: hoSoMoi._id,
      chiTietThuoc: String(chiTietThuoc).trim()
    });

    // 3. Cập nhật trạng thái Lịch khám
    lichKham.trangThai = "Hoàn thành";
    await lichKham.save();

    return res.status(201).json({
      message: "Hoàn thành ca khám và kê đơn thành công!",
      data: {
        lichKham,
        hoSoKham: hoSoMoi,
        donThuoc: donThuocMoi
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi xử lý hoàn thành khám!" });
  }
});

module.exports = router;