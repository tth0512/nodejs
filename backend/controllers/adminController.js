// backend/controllers/adminController.js
import User from '../models/User.js';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';

// 1. Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      lockedUsers,
      totalPosts,
      hiddenPosts,
      recentUsers,
      recentPosts
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'locked' }),
      Post.countDocuments(),
      Post.countDocuments({ status: 'hidden' }),
      User.find().sort({ createdAt: -1 }).limit(5)
        .select('username email fullName role status avatarUrl createdAt'),
      Post.find().sort({ createdAt: -1 }).limit(5)
        .populate('authorId', 'username avatarUrl')
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers: totalUsers - lockedUsers,
        lockedUsers,
        totalPosts,
        activePosts: totalPosts - hiddenPosts,
        hiddenPosts,
        recentUsers,
        recentPosts
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Users — Search, Filter, Paginate
export const getUsers = async (req, res) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { username: { $regex: search.trim(), $options: 'i' } },
        { email:    { $regex: search.trim(), $options: 'i' } },
        { fullName: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (role)   filter.role   = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(Number(limit)).select('-password'),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Block / Unblock User
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentAdminId = (req.user?.userId || req.user?.id)?.toString();

    if (!['active', 'locked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    if (id === currentAdminId) {
      return res.status(400).json({ success: false, message: 'Không thể tự khóa tài khoản của chính mình!' });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    res.status(200).json({
      success: true,
      message: status === 'locked' ? 'Đã khóa tài khoản thành công' : 'Đã mở khóa tài khoản thành công',
      data: user
    });
  } catch (error) {
    console.error('Error in updateUserStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update User Role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentAdminId = (req.user?.userId || req.user?.id)?.toString();

    const allowedRoles = ['member', 'system_admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ (chỉ chấp nhận member hoặc system_admin)' });
    }
    if (id === currentAdminId && role !== 'system_admin') {
      return res.status(400).json({ success: false, message: 'Không thể tự hạ quyền của chính mình!' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    res.status(200).json({ success: true, message: `Đã cập nhật vai trò thành '${role}'`, data: user });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. User Action History
export const getUserActionHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const [recentPosts, recentFollows] = await Promise.all([
      Post.find({ authorId: id }).sort({ createdAt: -1 }).limit(10),
      Follow.find({ followerId: id }).sort({ createdAt: -1 }).limit(10)
        .populate('followingId', 'username fullName avatarUrl')
    ]);

    res.status(200).json({
      success: true,
      data: { user, recentPosts, recentFollows }
    });
  } catch (error) {
    console.error('Error in getUserActionHistory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Posts — Search, Filter, Paginate
export const getPosts = async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 10, topic = '' } = req.query;

    const filter = {};
    if (search.trim()) filter.content = { $regex: search.trim(), $options: 'i' };
    if (status) filter.status = status;
    if (topic)  filter.topic  = topic;

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('authorId', 'username fullName email avatarUrl'),
      Post.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: { posts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Update Post Status (active / hidden)
export const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const post = await Post.findByIdAndUpdate(id, { status }, { new: true })
      .populate('authorId', 'username fullName email avatarUrl');
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    res.status(200).json({ success: true, message: `Đã chuyển trạng thái thành ${status}`, data: post });
  } catch (error) {
    console.error('Error in updatePostStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Delete Post (Admin)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    const io = req.app.get('io');
    if (io) io.emit('postDeleted', { postId: id });

    res.status(200).json({ success: true, message: 'Đã xóa bài viết thành công' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
