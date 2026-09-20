// backend/routes/likeRoutes.js
import express from 'express';
import { togglePostLike, toggleCommentLike } from '../controllers/likeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Toggle like / unlike bài viết
router.post('/:postId/like', protect, togglePostLike);

// Toggle like / unlike bình luận
router.post('/:postId/comments/:commentId/like', protect, toggleCommentLike);

export default router;
