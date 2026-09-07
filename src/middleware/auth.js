const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'BiMatPhongKham2026';

exports.xacThucToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Vui lòng đăng nhập để thực hiện thao tác này!" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Chứa userId, vaiTro, bacSiId
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};