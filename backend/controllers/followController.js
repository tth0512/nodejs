// backend/controllers/followController.js
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Helper: create and emit a notification
async function createNotification(io, { recipient, sender, type }) {
  const notification = await Notification.create({ recipient, sender, type });
  const populated = await notification.populate('sender', 'username avatarUrl');
  io.to(recipient.toString()).emit('new_notification', populated);
  return notification;
}

// POST /api/follow/:targetId — Follow or send follow request
export const followUser = async (req, res) => {
  try {
    const io = req.app.get('io');
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    if (currentUserId === targetId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự follow chính mình.' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetId)
    ]);

    if (!targetUser) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    // Check if blocked
    if (targetUser.blockedUsers.includes(currentUserId) || currentUser.blockedUsers.includes(targetId)) {
      return res.status(403).json({ success: false, message: 'Không thể follow người dùng này.' });
    }

    // Already following
    if (currentUser.following.includes(targetId)) {
      return res.status(400).json({ success: false, message: 'Bạn đã follow người dùng này rồi.' });
    }

    if (targetUser.isPrivate) {
      // Send follow request if not already requested
      if (targetUser.followRequests.includes(currentUserId)) {
        return res.status(400).json({ success: false, message: 'Bạn đã gửi yêu cầu follow rồi.' });
      }
      await User.findByIdAndUpdate(targetId, { $addToSet: { followRequests: currentUserId } });
      await createNotification(io, { recipient: targetId, sender: currentUserId, type: 'follow_request' });
      return res.status(200).json({ success: true, status: 'requested', message: 'Đã gửi yêu cầu follow.' });
    }

    // Public account — follow immediately
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUserId } })
    ]);

    await createNotification(io, { recipient: targetId, sender: currentUserId, type: 'follow' });
    return res.status(200).json({ success: true, status: 'following', message: 'Đã follow thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/follow/:targetId — Unfollow
export const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } }),
      // Also cancel any pending follow request
      User.findByIdAndUpdate(targetId, { $pull: { followRequests: currentUserId } })
    ]);

    res.status(200).json({ success: true, message: 'Đã unfollow thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/follow/:userId/followers
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username fullName avatarUrl isPrivate followers following');
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    res.status(200).json({ success: true, followers: user.followers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/follow/:userId/following
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username fullName avatarUrl isPrivate followers following');
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    res.status(200).json({ success: true, following: user.following });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/follow/requests/:requesterId/accept — Accept follow request
export const acceptFollowRequest = async (req, res) => {
  try {
    const io = req.app.get('io');
    const currentUserId = req.user.userId;
    const { requesterId } = req.params;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser.followRequests.includes(requesterId)) {
      return res.status(400).json({ success: false, message: 'Không có yêu cầu follow từ người dùng này.' });
    }

    await Promise.all([
      // Remove from requests, add to followers
      User.findByIdAndUpdate(currentUserId, {
        $pull: { followRequests: requesterId },
        $addToSet: { followers: requesterId }
      }),
      // Add to requester's following
      User.findByIdAndUpdate(requesterId, { $addToSet: { following: currentUserId } })
    ]);

    await createNotification(io, { recipient: requesterId, sender: currentUserId, type: 'follow_accept' });
    res.status(200).json({ success: true, message: 'Đã chấp nhận yêu cầu follow.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/follow/requests/:requesterId/reject — Reject follow request
export const rejectFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { requesterId } = req.params;

    await User.findByIdAndUpdate(currentUserId, { $pull: { followRequests: requesterId } });
    res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu follow.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/follow/requests — Get pending follow requests (for private account owner)
export const getFollowRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('followRequests', 'username fullName avatarUrl');
    res.status(200).json({ success: true, requests: user.followRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/follow/:userId/status — Get follow status between current user and target
export const getFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId } = req.params;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!targetUser) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    const isBlocked = currentUser.blockedUsers.includes(userId) || targetUser.blockedUsers.includes(currentUserId);
    const isFollowing = currentUser.following.includes(userId);
    const isRequested = targetUser.followRequests.includes(currentUserId);
    const isFollowedBy = currentUser.followers.includes(userId);

    res.status(200).json({
      success: true,
      isBlocked,
      isFollowing,
      isRequested,
      isFollowedBy,
      isPrivate: targetUser.isPrivate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/block/:targetId — Block a user
export const blockUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    if (currentUserId === targetId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự block chính mình.' });
    }

    // Add to blocked, remove from followers/following on both sides, remove any pending requests
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: targetId },
        $pull: { followers: targetId, following: targetId, followRequests: targetId }
      }),
      User.findByIdAndUpdate(targetId, {
        $pull: { followers: currentUserId, following: currentUserId, followRequests: currentUserId }
      })
    ]);

    res.status(200).json({ success: true, message: 'Đã block người dùng.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/block/:targetId — Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    await User.findByIdAndUpdate(currentUserId, { $pull: { blockedUsers: targetId } });
    res.status(200).json({ success: true, message: 'Đã bỏ block người dùng.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/block/list — Get current user's blocked list
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('blockedUsers', 'username fullName avatarUrl');
    res.status(200).json({ success: true, blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
