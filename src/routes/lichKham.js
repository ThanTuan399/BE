const express = require('express');
const router = express.Router();

// API Đặt lịch khám: POST /api/lich-kham/dat-lich
router.post('/dat-lich', async (req, res) => {
  try {
    const { bacSiId, benhNhanId, thoiGianBatDau, thoiGianKetThuc } = req.body;

    const start = new Date(thoiGianBatDau);
    const end = new Date(thoiGianKetThuc);

    // BƯỚC 1 & 2: Kiểm tra lịch bác sĩ và trùng lịch
    // Điều kiện trùng giờ: (BatDauCu < KetThucMoi) AND (KetThucCu > BatDauMoi)
    const lichTrung = await prisma.lichKham.findFirst({
      where: {
        bacSiId: bacSiId,
        trangThai: { not: "Đã hủy" },
        AND: [
          { thoiGianBatDau: { lt: end } },
          { thoiGianKetThuc: { gt: start } }
        ]
      }
    });

    if (lichTrung) {
      return res.status(400).json({
        message: "Bác sĩ đã có lịch hẹn trong khung giờ này. Vui lòng chọn giờ khác!"
      });
    }

    // BƯỚC 3: Tạo lịch khám mới với trạng thái mặc định "Chờ khám"
    const lichKhamMoi = await prisma.lichKham.create({
      data: {
        bacSiId,
        benhNhanId,
        thoiGianBatDau: start,
        thoiGianKetThuc: end,
        trangThai: "Chờ khám"
      }
    });

    return res.status(201).json({
      message: "Đặt lịch khám thành công!",
      data: lichKhamMoi
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi xử lý đặt lịch!" });
  }
});

module.exports = router;