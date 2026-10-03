// backend/routes/communityRoutes.js
import express from 'express';
import {
  getCommunityFeed,
  getCommunityById,
  getCommunityPost,
  createCommunity,
  getCommunities,
  getUserCommunities,
  joinCommunity,
  leaveCommunity,
  createCommunityPost
} from '../controllers/communityController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadCloud, uploadAvatar } from '../utlis/cloudinaryConfig.js';

const router = express.Router();

// 1. GET /api/communities/feed - Bảng tin bài viết từ các cộng đồng đã tham gia
router.get('/feed', protect, getCommunityFeed);

// 2. GET /api/communities/my-communities - Danh sách cộng đồng user đã tham gia
router.get('/my-communities', protect, getUserCommunities);

// 3. GET /api/communities - Danh sách tất cả cộng đồng (kèm search ?search=)
router.get('/', optionalAuth, getCommunities);

// 4. POST /api/communities/create - Tạo cộng đồng mới
router.post('/create', protect, uploadAvatar.single('avatar'), createCommunity);

// 5. POST /api/communities/:communityId/join - Tham gia cộng đồng
router.post('/:communityId/join', protect, joinCommunity);

// 6. POST /api/communities/:communityId/leave - Rời khỏi cộng đồng
router.post('/:communityId/leave', protect, leaveCommunity);

// 7. POST /api/communities/:communityId/posts - Đăng bài viết vào cộng đồng
router.post('/:communityId/posts', protect, uploadCloud.single('image'), createCommunityPost);

// 8. GET /api/communities/:communityId - Xem chi tiết cộng đồng & bài viết
router.get('/:communityId', optionalAuth, getCommunityById);

// 9. GET /api/communities/:communityId/:postId - Xem bài viết cụ thể
router.get('/:communityId/:postId', optionalAuth, getCommunityPost);

export default router;
