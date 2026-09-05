const mongoose = require('mongoose');

const bacSiSchema = new mongoose.Schema({
  nguoiDungId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },
  hoTen: { type: String, required: true },
  soDienThoai: String
});

module.exports = mongoose.model('BacSi', bacSiSchema);