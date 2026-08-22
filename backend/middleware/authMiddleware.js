import jwt from 'jsonwebtoken';

// 1. Authentication Middleware: Kiểm tra đăng nhập
export const protect = (req, res, next) => {
  let token;

  // Client gửi token qua Header theo quy chuẩn: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Tách lấy chuỗi token

      // Giải mã token bằng mã khóa bí mật
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Gán payload { userId, username } vào req.user để các controller phía sau dùng
      req.user = decoded;

      // Cho phép đi tiếp vào route chính
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
  }

  // Nếu không tìm thấy token trong header
  if (!token) {
    return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập! Không có quyền truy cập.' });
  }
};

// 2. Authorization Middleware: Chỉ cho phép Admin đi tiếp
export const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Truy cập bị từ chối! Hành động này chỉ dành cho Admin.' 
    });
  }
};