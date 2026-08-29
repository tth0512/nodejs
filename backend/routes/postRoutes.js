// backend/routes/postRoutes.js
import express from 'express';
import { getPosts, createPost, updatePost, deletePost } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadCloud } from '../utils/cloudinaryConfig.js';

const router = express.Router();

// Route GET: Xem danh sách bài viết (Ai cũng xem được)
router.get('/', getPosts);

// Route POST: Tạo bài viết (Bắt buộc đăng nhập)
// router.post('/', protect, createPost);

router.post('/', protect, uploadCloud.single('image'), createPost);

// Route PUT: Sửa bài viết (Bắt buộc đăng nhập)
router.put('/:id', protect, updatePost);

// Route DELETE: Xóa bài viết (Bắt buộc đăng nhập)
router.delete('/:id', protect, deletePost);

export default router;