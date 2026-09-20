// backend/routes/commentRoutes.js
import express from 'express';
import {
  getComments,
  createComment,
  replyComment,
  getReplies,
  deleteComment
} from '../controllers/commentController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Lấy danh sách bình luận của bài viết
router.get('/:postId/comments', optionalAuth, getComments);

// Tạo bình luận mới cho bài viết
router.post('/:postId/comments', protect, createComment);

// Trả lời bình luận
router.post('/:postId/comments/:commentId/reply', protect, replyComment);

// Lấy danh sách câu trả lời của 1 bình luận
router.get('/:postId/comments/:commentId/replies', optionalAuth, getReplies);

// Xóa bình luận hoặc câu trả lời
router.delete('/:postId/comments/:commentId', protect, deleteComment);

export default router;
