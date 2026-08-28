// backend/routes/authRoutes.js
import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route cho Đăng ký
router.post('/register', register);

// Route cho Đăng nhập
router.post('/login', login);

// Route cho Đăng xuất
router.post('/logout', logout);

// Route để Frontend kiểm tra lại Cookie mỗi khi load trang (cần đi qua cổng bảo vệ 'protect')
router.get('/me', protect, getMe);

export default router;