const express = require('express');
const mongoose = require('mongoose');
const app = express();

const authRoute = require('./src/routes/auth');

const publicRoute = require('./src/routes/public');

app.use(express.json());
app.use('/api/public', publicRoute);

// Kết nối CSDL MongoDB Local giống bạn của bạn
mongoose.connect('mongodb://127.0.0.1:27017/phongkham')
  .then(() => console.log('Đã kết nối MongoDB Local thành công!'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

app.use('/api/auth', authRoute);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server Backend đang chạy tại: http://localhost:${PORT}`);
});