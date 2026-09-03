// backend/routes/followRoutes.js
import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowRequests,
  blockUser,
  unblockUser,
  getBlockedUsers
} from '../controllers/followController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Follow / Unfollow
router.post('/:targetId', protect, followUser);
router.delete('/:targetId', protect, unfollowUser);

// Followers / Following lists (public)
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Follow status (requires auth)
router.get('/:userId/status', protect, getFollowStatus);

// Follow Requests (private accounts)
router.get('/requests/list', protect, getFollowRequests);
router.post('/requests/:requesterId/accept', protect, acceptFollowRequest);
router.delete('/requests/:requesterId/reject', protect, rejectFollowRequest);

export default router;
