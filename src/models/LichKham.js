const mongoose = require('mongoose');

const lichKhamSchema = new mongoose.Schema({
  bacSiId: { type: mongoose.Schema.Types.ObjectId, ref: 'BacSi', required: true },
  benhNhanId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenhNhan', required: true },
  thoiGianBatDau: { type: Date, required: true },
  thoiGianKetThuc: { type: Date, required: true },
  trangThai: { type: String, default: 'Chờ khám' }
});

module.exports = mongoose.model('LichKham', lichKhamSchema);