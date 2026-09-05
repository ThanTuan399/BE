const mongoose = require('mongoose');

const nguoiDungSchema = new mongoose.Schema({
  tenDangNhap: { type: String, required: true, unique: true },
  matKhau: { type: String, required: true },
  vaiTro: { type: String, enum: ['BAC_SI', 'ADMIN'], required: true }
});

module.exports = mongoose.model('NguoiDung', nguoiDungSchema);