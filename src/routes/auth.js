const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const NguoiDung = require('../models/NguoiDung');
const BacSi = require('../models/BacSi');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { tenDangNhap, matKhau, vaiTro, hoTen, soDienThoai } = req.body;

    if (!tenDangNhap || !matKhau || !vaiTro) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tenDangNhap, matKhau và vaiTro!" });
    }

    // 1. Kiểm tra tài khoản tồn tại
    const userTonTai = await NguoiDung.findOne({ tenDangNhap });
    if (userTonTai) {
      return res.status(400).json({ message: "Tên đăng nhập này đã được sử dụng!" });
    }

    // 2. Băm mật khẩu
    const hashedPassword = await bcrypt.hash(matKhau, 10);

    // 3. Tạo tài khoản
    if (vaiTro === "BAC_SI") {
      if (!hoTen) return res.status(400).json({ message: "Bác sĩ bắt buộc phải nhập họ tên!" });

      const newUser = await NguoiDung.create({
        tenDangNhap,
        matKhau: hashedPassword,
        vaiTro: "BAC_SI"
      });

      const newBacSi = await BacSi.create({
        nguoiDungId: newUser._id,
        hoTen,
        soDienThoai: soDienThoai || null
      });

      return res.status(201).json({
        message: "Đăng ký Bác sĩ thành công!",
        data: { id: newUser._id, tenDangNhap: newUser.tenDangNhap, bacSi: newBacSi }
      });

    } else if (vaiTro === "ADMIN") {
      const newUser = await NguoiDung.create({
        tenDangNhap,
        matKhau: hashedPassword,
        vaiTro: "ADMIN"
      });

      return res.status(201).json({
        message: "Đăng ký Admin thành công!",
        data: { id: newUser._id, tenDangNhap: newUser.tenDangNhap }
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi đăng ký!" });
  }
});

module.exports = router;