// backend/routes/authRoutes.js
import express from 'express';
import { register, login, logout, getMe, updateProfile, getUserById } from '../controllers/authController.js';
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

// Route PUT để cập nhật profile (Yêu cầu phải đăng nhập nên có protect)
router.put('/profile', protect, updateProfile);

// Route GET lấy thông tin public của một user (không cần đăng nhập)
router.get('/users/:userId', getUserById);

export default router;