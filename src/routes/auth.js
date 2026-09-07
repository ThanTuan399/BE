const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const NguoiDung = require('../models/NguoiDung');
const BacSi = require('../models/BacSi');

const JWT_SECRET = process.env.JWT_SECRET || 'BiMatPhongKham2026';

// 1. POST /api/auth/register - ĐĂNG KÝ
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

// 2. POST /api/auth/login - ĐĂNG NHẬP (MỚI BỔ SUNG)
router.post('/login', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body;

    if (!tenDangNhap || !matKhau) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!" });
    }

    // Kiểm tra tài khoản
    const user = await NguoiDung.findOne({ tenDangNhap });
    if (!user) {
      return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
    }

    // So sánh mật khẩu băm
    const isMatch = await bcrypt.compare(matKhau, user.matKhau);
    if (!isMatch) {
      return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
    }

    // Lấy ID Bác sĩ nếu tài khoản là BAC_SI
    let bacSiId = null;
    if (user.vaiTro === "BAC_SI") {
      const bacSi = await BacSi.findOne({ nguoiDungId: user._id });
      if (bacSi) {
        bacSiId = bacSi._id;
      }
    }

    // Tạo JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
        tenDangNhap: user.tenDangNhap,
        vaiTro: user.vaiTro,
        bacSiId: bacSiId
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: "Đăng nhập thành công!",
      token: token,
      user: {
        id: user._id,
        tenDangNhap: user.tenDangNhap,
        vaiTro: user.vaiTro,
        bacSiId: bacSiId
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi xử lý đăng nhập!" });
  }
});

module.exports = router;