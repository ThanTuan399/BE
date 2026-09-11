const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSMongoose = require('@adminjs/mongoose');

const authRoute = require('./src/routes/auth');
const publicRoute = require('./src/routes/public');
const bacSiRoute = require('./src/routes/bacSi');
const adminRoute = require('./src/routes/admin');

// Middleware
app.use(cors());
app.use(express.json());

// Routes API Backend
app.use('/api/bac-si', bacSiRoute);
app.use('/api/public', publicRoute);
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);

// Cấu hình AdminJS
AdminJS.registerAdapter(AdminJSMongoose);

const adminJs = new AdminJS({
  resources: [
    require('./src/models/NguoiDung'), // Thêm model NguoiDung
    require('./src/models/BacSi'),
    require('./src/models/BenhNhan'),
    require('./src/models/LichKham'),
    require('./src/models/HoSoKham'),
    require('./src/models/DonThuoc')
  ],
  rootPath: '/admin-ui',
});

const router = AdminJSExpress.buildRouter(adminJs);
app.use(adminJs.options.rootPath, router);

// Kết nối CSDL MongoDB Local
mongoose.connect('mongodb://127.0.0.1:27017/phongkham')
  .then(() => console.log('Đã kết nối MongoDB Local thành công!'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server Backend đang chạy tại: http://localhost:${PORT}`);
  console.log(`Giao diện AdminJS sẵn sàng tại: http://localhost:${PORT}/admin-ui`);
});