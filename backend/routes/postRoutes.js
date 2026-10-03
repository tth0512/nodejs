import express from 'express';
import { getPosts, getPostById, createPost, updatePost, deletePost } from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadCloud } from '../utlis/cloudinaryConfig.js';

const router = express.Router();

// Route GET: Xem danh sách bài viết (Public nhưng giải mã token nếu có để check isLiked)
router.get('/', optionalAuth, getPosts);

// Route POST: Tạo bài viết (Bắt buộc đăng nhập, hỗ trợ upload tối đa 10 ảnh)
router.post(
  '/',
  protect,
  uploadCloud.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 }
  ]),
  createPost
);

// Route GET: Lấy chi tiết một bài viết theo ID
router.get('/:postId', optionalAuth, getPostById);

// Route PUT: Sửa bài viết (Bắt buộc đăng nhập)
router.put(
  '/:id',
  protect,
  uploadCloud.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 }
  ]),
  updatePost
);

// Route DELETE: Xóa bài viết (Bắt buộc đăng nhập)
router.delete('/:id', protect, deletePost);

export default router;