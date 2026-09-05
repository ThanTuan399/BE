const express = require('express');
const router = express.Router();
const BenhNhan = require('../models/BenhNhan');
const LichKham = require('../models/LichKham');

// 1. API BỆNH NHÂN ĐẶT LỊCH: POST /api/public/dat-lich
router.post('/dat-lich', async (req, res) => {
  try {
    const { hoTen, soDienThoai, bacSiId, thoiGianBatDau, thoiGianKetThuc } = req.body;

    if (!hoTen || !soDienThoai || !bacSiId || !thoiGianBatDau || !thoiGianKetThuc) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin đặt lịch!" });
    }

    const start = new Date(thoiGianBatDau);
    const end = new Date(thoiGianKetThuc);

    // Bước A: Tìm hoặc Tạo bệnh nhân tự động theo SĐT
    let benhNhan = await BenhNhan.findOne({ soDienThoai });
    if (!benhNhan) {
      benhNhan = await BenhNhan.create({ hoTen, soDienThoai });
    }

    // Bước B: Kiểm tra trùng lịch bác sĩ
    const lichTrung = await LichKham.findOne({
      bacSiId,
      trangThai: { $ne: "Đã hủy" },
      $and: [
        { thoiGianBatDau: { $lt: end } },
        { thoiGianKetThuc: { $gt: start } }
      ]
    });

    if (lichTrung) {
      return res.status(400).json({ message: "Bác sĩ đã có lịch hẹn trong khung giờ này!" });
    }

    // Bước C: Tạo lịch khám mới
    const lichKhamMoi = await LichKham.create({
      bacSiId,
      benhNhanId: benhNhan._id,
      thoiGianBatDau: start,
      thoiGianKetThuc: end,
      trangThai: "Chờ khám"
    });

    return res.status(201).json({
      message: "Đặt lịch khám thành công!",
      data: lichKhamMoi
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi đặt lịch!" });
  }
});

// 2. API TRA CỨU LỊCH THEO SĐT: GET /api/public/tra-cuu/:soDienThoai
router.get('/tra-cuu/:soDienThoai', async (req, res) => {
  try {
    const { soDienThoai } = req.params;

    const benhNhan = await BenhNhan.findOne({ soDienThoai });
    if (!benhNhan) {
      return res.status(404).json({ message: "Không tìm thấy thông tin bệnh nhân với SĐT này!" });
    }

    const danhSachLich = await LichKham.find({ benhNhanId: benhNhan._id })
      .populate('bacSiId', 'hoTen soDienThoai')
      .sort({ thoiGianBatDau: -1 });

    return res.json({
      benhNhan,
      danhSachLich
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi tra cứu!" });
  }
});

module.exports = router;