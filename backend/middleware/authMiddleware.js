// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

// 1. Authentication Middleware: Kiểm tra đăng nhập (Sửa lại để đọc từ Cookie)
export const protect = (req, res, next) => {
  // Lấy token từ cookie ngầm do trình duyệt gửi lên (yêu cầu phải có cookie-parser ở server.js)
  const token = req.cookies?.token;

  // Nếu không tìm thấy token trong cookie
  if (!token) {
    return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập! Không có quyền truy cập.' });
  }

  try {
    // Giải mã token bằng mã khóa bí mật
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán payload { userId, role, id } vào req.user để các controller phía sau dùng thống nhất
    req.user = { ...decoded, id: decoded.userId || decoded.id, userId: decoded.userId || decoded.id };

    // Cho phép đi tiếp vào route chính
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
  }
};

// 2. Middleware Phân quyền (Authorization) - Kiểm tra vai trò linh hoạt
// Dùng Rest parameters (...roles) để nhận vào một mảng các vai trò được phép
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user.role đã được giải mã từ token ở bước protect
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Truy cập bị từ chối! Vai trò '${req.user.role}' không có quyền thực hiện hành động này.` 
      });
    }
    next(); // Có quyền -> Đi tiếp
  };
};