// backend/controllers/followController.js
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import Notification from '../models/Notification.js';

// ─── Helper: Create and emit a notification ───────────────────────────────────
async function createNotification(io, { recipient, sender, type, targetId }) {
  const notification = await Notification.create({ recipient, sender, type, targetId });
  const populated = await notification.populate('sender', 'username avatarUrl');
  io.to(recipient.toString()).emit('new_notification', populated);
  return notification;
}

// ─── POST /api/follow/:targetId — Follow or send follow request ───────────────
export const followUser = async (req, res) => {
  try {
    const io = req.app.get('io');
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    if (currentUserId === targetId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự follow chính mình.' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    // Check if blocked by either side
    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: targetId, blockedId: currentUserId },
        { blockerId: currentUserId, blockedId: targetId }
      ]
    });
    if (isBlocked) {
      return res.status(403).json({ success: false, message: 'Không thể follow người dùng này.' });
    }

    // Check if follow document already exists
    const existingFollow = await Follow.findOne({ followerId: currentUserId, followingId: targetId });
    if (existingFollow) {
      if (existingFollow.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Bạn đã follow người dùng này rồi.' });
      }
      if (existingFollow.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Bạn đã gửi yêu cầu follow rồi.' });
      }
    }

    if (targetUser.isPrivate) {
      // Private account → create pending follow request
      await Follow.create({ followerId: currentUserId, followingId: targetId, status: 'pending' });
      await createNotification(io, {
        recipient: targetId,
        sender: currentUserId,
        type: 'follow_request',
        targetId: currentUserId
      });
      return res.status(200).json({ success: true, status: 'requested', message: 'Đã gửi yêu cầu follow.' });
    }

    // Public account → follow immediately, increment cached counters
    await Follow.create({ followerId: currentUserId, followingId: targetId, status: 'accepted' });
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(targetId,      { $inc: { followersCount: 1 } })
    ]);

    await createNotification(io, {
      recipient: targetId,
      sender: currentUserId,
      type: 'follow',
      targetId: currentUserId
    });
    return res.status(200).json({ success: true, status: 'following', message: 'Đã follow thành công.' });
  } catch (error) {
    // Duplicate key error from unique index
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bạn đã follow hoặc gửi yêu cầu rồi.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/follow/:targetId — Unfollow ──────────────────────────────────
export const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    const follow = await Follow.findOneAndDelete({ followerId: currentUserId, followingId: targetId });

    // Only decrement counts if it was an accepted follow
    if (follow && follow.status === 'accepted') {
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } }),
        User.findByIdAndUpdate(targetId,      { $inc: { followersCount: -1 } })
      ]);
    }

    res.status(200).json({ success: true, message: 'Đã unfollow thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/follow/:userId/followers ────────────────────────────────────────
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    const follows = await Follow.find({ followingId: req.params.userId, status: 'accepted' })
      .populate('followerId', 'username fullName avatarUrl isPrivate followersCount followingCount');

    const followers = follows.map(f => f.followerId);
    res.status(200).json({ success: true, followers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/follow/:userId/following ────────────────────────────────────────
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    const follows = await Follow.find({ followerId: req.params.userId, status: 'accepted' })
      .populate('followingId', 'username fullName avatarUrl isPrivate followersCount followingCount');

    const following = follows.map(f => f.followingId);
    res.status(200).json({ success: true, following });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/follow/requests/:requesterId/accept — Accept follow request ────
export const acceptFollowRequest = async (req, res) => {
  try {
    const io = req.app.get('io');
    const currentUserId = req.user.userId;
    const { requesterId } = req.params;

    const follow = await Follow.findOneAndUpdate(
      { followerId: requesterId, followingId: currentUserId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );

    if (!follow) {
      return res.status(400).json({ success: false, message: 'Không có yêu cầu follow từ người dùng này.' });
    }

    // Increment cached counters
    await Promise.all([
      User.findByIdAndUpdate(requesterId,   { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(currentUserId, { $inc: { followersCount: 1 } })
    ]);

    await createNotification(io, {
      recipient: requesterId,
      sender: currentUserId,
      type: 'follow_accept',
      targetId: currentUserId
    });
    res.status(200).json({ success: true, message: 'Đã chấp nhận yêu cầu follow.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/follow/requests/:requesterId/reject — Reject follow request ──
export const rejectFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { requesterId } = req.params;

    await Follow.findOneAndDelete({ followerId: requesterId, followingId: currentUserId, status: 'pending' });
    res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu follow.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/follow/requests — Get pending follow requests ───────────────────
export const getFollowRequests = async (req, res) => {
  try {
    const follows = await Follow.find({ followingId: req.user.userId, status: 'pending' })
      .populate('followerId', 'username fullName avatarUrl');

    const requests = follows.map(f => f.followerId);
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/follow/:userId/status — Get follow status between two users ─────
export const getFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId } = req.params;

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    const [blockByMe, blockByThem, followDoc, followedByDoc] = await Promise.all([
      Block.findOne({ blockerId: currentUserId, blockedId: userId }),
      Block.findOne({ blockerId: userId,        blockedId: currentUserId }),
      Follow.findOne({ followerId: currentUserId, followingId: userId }),
      Follow.findOne({ followerId: userId, followingId: currentUserId, status: 'accepted' })
    ]);

    res.status(200).json({
      success: true,
      isBlocked:    !!(blockByMe || blockByThem),
      isFollowing:  followDoc?.status === 'accepted',
      isRequested:  followDoc?.status === 'pending',
      isFollowedBy: !!followedByDoc,
      isPrivate:    targetUser.isPrivate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/block/:targetId — Block a user ─────────────────────────────────
export const blockUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    if (currentUserId === targetId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự block chính mình.' });
    }

    // Remove follow relationships in both directions and any pending requests
    const [followMe, followThem] = await Promise.all([
      Follow.findOneAndDelete({ followerId: currentUserId, followingId: targetId }),
      Follow.findOneAndDelete({ followerId: targetId,      followingId: currentUserId })
    ]);

    // Adjust counters for accepted follows that are now removed
    const countOps = [];
    if (followMe?.status === 'accepted') {
      countOps.push(User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } }));
      countOps.push(User.findByIdAndUpdate(targetId,      { $inc: { followersCount: -1 } }));
    }
    if (followThem?.status === 'accepted') {
      countOps.push(User.findByIdAndUpdate(targetId,      { $inc: { followingCount: -1 } }));
      countOps.push(User.findByIdAndUpdate(currentUserId, { $inc: { followersCount: -1 } }));
    }
    await Promise.all(countOps);

    // Create the block document (ignore if already blocked)
    await Block.findOneAndUpdate(
      { blockerId: currentUserId, blockedId: targetId },
      { blockerId: currentUserId, blockedId: targetId },
      { upsert: true }
    );

    res.status(200).json({ success: true, message: 'Đã block người dùng.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/block/:targetId — Unblock a user ────────────────────────────
export const unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { targetId } = req.params;

    await Block.findOneAndDelete({ blockerId: currentUserId, blockedId: targetId });
    res.status(200).json({ success: true, message: 'Đã bỏ block người dùng.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/block/list — Get current user's blocked list ───────────────────
export const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await Block.find({ blockerId: req.user.userId })
      .populate('blockedId', 'username fullName avatarUrl');

    const blockedUsers = blocks.map(b => b.blockedId);
    res.status(200).json({ success: true, blockedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
