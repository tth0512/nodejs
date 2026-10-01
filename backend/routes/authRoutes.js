import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  getUserById,
  uploadAvatarController,
  uploadCoverController,
  verifyEmail,
  resendVerificationOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar, uploadCover } from '../utlis/cloudinaryConfig.js';

const router = express.Router();

// Route cho Đăng ký & Xác thực Email
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendVerificationOTP);

// Route cho Quên mật khẩu & Đặt lại mật khẩu
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Route cho Đăng nhập
router.post('/login', login);

// Route cho Đăng xuất
router.post('/logout', logout);

// Route để Frontend kiểm tra lại Cookie mỗi khi load trang (cần đi qua cổng bảo vệ 'protect')
router.get('/me', protect, getMe);

// Route PUT để cập nhật profile (Yêu cầu phải đăng nhập nên có protect)
router.put('/profile', protect, updateProfile);

// Route POST để upload avatar lên Cloudinary
router.post('/avatar', protect, uploadAvatar.single('avatar'), uploadAvatarController);

// Route POST để upload ảnh bìa lên Cloudinary
router.post('/cover', protect, uploadCover.single('cover'), uploadCoverController);

// Route GET lấy thông tin public của một user (không cần đăng nhập)
router.get('/users/:userId', getUserById);

export default router;