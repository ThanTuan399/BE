const express = require('express');
const mongoose = require('mongoose');
const app = express();


const authRoute = require('./src/routes/auth');
const publicRoute = require('./src/routes/public');
const bacSiRoute = require('./src/routes/bacSi');
const adminRoute = require('./src/routes/admin');

app.use(express.json());

app.use('/api/bac-si', bacSiRoute);
app.use('/api/public', publicRoute);
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);

// Kết nối CSDL MongoDB Local giống bạn của bạn
mongoose.connect('mongodb://127.0.0.1:27017/phongkham')
  .then(() => console.log('Đã kết nối MongoDB Local thành công!'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server Backend đang chạy tại: http://localhost:${PORT}`);
});