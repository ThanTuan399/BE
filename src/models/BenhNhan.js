const mongoose = require('mongoose');

const benhNhanSchema = new mongoose.Schema({
  hoTen: { type: String, required: true },
  soDienThoai: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('BenhNhan', benhNhanSchema);