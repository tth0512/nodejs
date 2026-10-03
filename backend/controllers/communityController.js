// backend/controllers/communityController.js
import mongoose from 'mongoose';
import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';
import Post from '../models/Post.js';
import Like from '../models/Like.js';

// 1. GET /api/communities/feed - Lấy toàn bộ bài viết từ các cộng đồng mà người dùng đã tham gia
export const getCommunityFeed = async (req, res) => {
  try {
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem bảng tin cộng đồng!' });
    }

    // Tối ưu truy vấn: Sử dụng Secondary Index trên trường user trong CommunityMember
    const memberships = await CommunityMember.find({ user: userId }).select('community');
    const communityIds = memberships.map((m) => m.community);

    if (communityIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'Bạn chưa tham gia cộng đồng nào. Hãy khám phá và tham gia các cộng đồng để xem bài viết!'
      });
    }

    // Lấy bài viết thuộc các cộng đồng này
    const posts = await Post.find({
      communityId: { $in: communityIds },
      status: 'active'
    })
      .populate('authorId', 'username fullName avatarUrl role')
      .populate('communityId', 'name avatar coverImage privacy')
      .sort({ createdAt: -1 })
      .lean();

    // Tính trạng thái isLiked của user hiện tại
    let likedPostIds = new Set();
    if (posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const userLikes = await Like.find({
        userId,
        targetId: { $in: postIds },
        targetType: 'Post'
      }).select('targetId');
      likedPostIds = new Set(userLikes.map((l) => l.targetId.toString()));
    }

    const postsWithLiked = posts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post._id.toString())
    }));

    res.status(200).json({
      success: true,
      count: postsWithLiked.length,
      data: postsWithLiked
    });
  } catch (error) {
    console.error('Error in getCommunityFeed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET /api/communities/:communityId - Xem chi tiết cộng đồng & danh sách bài viết
export const getCommunityById = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ success: false, message: 'Mã cộng đồng không hợp lệ!' });
    }

    const community = await Community.findById(communityId)
      .populate('creator', 'username fullName avatarUrl');

    if (!community) {
      return res.status(404).json({ success: false, message: 'Cộng đồng không tồn tại!' });
    }

    // Kiểm tra vai trò & trạng thái thành viên thông qua bảng trung gian CommunityMember
    let isMember = false;
    let memberRole = null;

    if (userId) {
      const membership = await CommunityMember.findOne({ community: community._id, user: userId });
      if (membership) {
        isMember = true;
        memberRole = membership.role;
      }
    }

    const isCreator = community.creator?._id?.toString() === userId;
    const isAdmin = isCreator || memberRole === 'admin';
    const isModerator = isAdmin || memberRole === 'moderator';

    // Nếu cộng đồng riêng tư và người dùng chưa tham gia -> Không hiển thị bài viết
    if (community.privacy === 'private' && !isMember) {
      return res.status(200).json({
        success: true,
        data: {
          _id: community._id,
          name: community.name,
          description: community.description,
          avatar: community.avatar,
          coverImage: community.coverImage,
          privacy: community.privacy,
          creator: community.creator,
          memberCount: community.memberCount,
          isMember: false,
          isAdmin: false,
          role: null,
          posts: []
        },
        message: 'Đây là cộng đồng riêng tư. Hãy tham gia để xem các bài viết.'
      });
    }

    // Cộng đồng công khai hoặc đã tham gia -> Lấy bài viết
    const posts = await Post.find({
      communityId: community._id,
      status: 'active'
    })
      .populate('authorId', 'username fullName avatarUrl role')
      .populate('communityId', 'name avatar coverImage privacy')
      .sort({ createdAt: -1 })
      .lean();

    let likedPostIds = new Set();
    if (userId && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const userLikes = await Like.find({
        userId,
        targetId: { $in: postIds },
        targetType: 'Post'
      }).select('targetId');
      likedPostIds = new Set(userLikes.map((l) => l.targetId.toString()));
    }

    const postsWithLiked = posts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post._id.toString())
    }));

    res.status(200).json({
      success: true,
      data: {
        ...community.toObject(),
        isMember,
        isAdmin,
        isModerator,
        role: memberRole,
        posts: postsWithLiked
      }
    });
  } catch (error) {
    console.error('Error in getCommunityById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET /api/communities/:communityId/:postId - Xem bài viết cụ thể trong cộng đồng
export const getCommunityPost = async (req, res) => {
  try {
    const { communityId, postId } = req.params;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'ID cộng đồng hoặc ID bài viết không hợp lệ!' });
    }

    const post = await Post.findOne({
      _id: postId,
      communityId,
      status: 'active'
    })
      .populate('authorId', 'username fullName avatarUrl role')
      .populate('communityId', 'name avatar coverImage privacy')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại trong cộng đồng này!' });
    }

    // Kiểm tra quyền riêng tư của cộng đồng
    if (post.communityId?.privacy === 'private') {
      if (!userId) {
        return res.status(403).json({ success: false, message: 'Bài viết thuộc cộng đồng riêng tư. Vui lòng đăng nhập!' });
      }

      const isMember = await CommunityMember.exists({ community: communityId, user: userId });
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Bài viết thuộc cộng đồng riêng tư. Bạn cần tham gia để xem!'
        });
      }
    }

    // Kiểm tra trạng thái Like
    let isLiked = false;
    if (userId) {
      const like = await Like.findOne({
        userId,
        targetId: post._id,
        targetType: 'Post'
      });
      isLiked = !!like;
    }

    res.status(200).json({
      success: true,
      data: {
        ...post,
        isLiked
      }
    });
  } catch (error) {
    console.error('Error in getCommunityPost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. POST /api/communities - Tạo cộng đồng mới
export const createCommunity = async (req, res) => {
  try {
    const userId = (req.user?.userId || req.user?.id)?.toString();
    const { name, description, privacy, avatar, coverImage } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên cộng đồng không được để trống!' });
    }

    const existingCommunity = await Community.findOne({ name: name.trim() });
    if (existingCommunity) {
      return res.status(400).json({ success: false, message: 'Tên cộng đồng này đã tồn tại!' });
    }

    // 1. Tạo Community với memberCount mặc định là 1 (người tạo)
    const newCommunity = await Community.create({
      name: name.trim(),
      description: description?.trim() || '',
      privacy: privacy === 'private' ? 'private' : 'public',
      avatar: avatar || '',
      coverImage: coverImage || '',
      creator: userId,
      memberCount: 1
    });

    // 2. Tạo bản ghi CommunityMember cho người tạo với vai trò admin
    await CommunityMember.create({
      community: newCommunity._id,
      user: userId,
      role: 'admin'
    });

    const populatedCommunity = await Community.findById(newCommunity._id)
      .populate('creator', 'username fullName avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Tạo cộng đồng thành công!',
      data: {
        ...populatedCommunity.toObject(),
        isMember: true,
        isAdmin: true,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error in createCommunity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET /api/communities - Lấy danh sách tất cả các cộng đồng
export const getCommunities = async (req, res) => {
  try {
    const userId = (req.user?.userId || req.user?.id)?.toString();
    const { search } = req.query;

    const query = {};
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const communities = await Community.find(query)
      .populate('creator', 'username fullName avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    let joinedCommunityIds = new Set();
    if (userId) {
      const userMemberships = await CommunityMember.find({ user: userId }).select('community');
      joinedCommunityIds = new Set(userMemberships.map((m) => m.community.toString()));
    }

    const data = communities.map((comm) => ({
      ...comm,
      isMember: joinedCommunityIds.has(comm._id.toString())
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error in getCommunities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. GET /api/communities/my-communities - Lấy danh sách cộng đồng mà user đã tham gia
export const getUserCommunities = async (req, res) => {
  try {
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    const memberships = await CommunityMember.find({ user: userId })
      .populate({
        path: 'community',
        populate: { path: 'creator', select: 'username fullName avatarUrl' }
      })
      .sort({ createdAt: -1 })
      .lean();

    const data = memberships
      .filter((m) => m.community)
      .map((m) => ({
        ...m.community,
        role: m.role,
        joinedAt: m.joinedAt,
        isMember: true
      }));

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error in getUserCommunities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. POST /api/communities/:communityId/join - Tham gia cộng đồng
export const joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ success: false, message: 'Mã cộng đồng không hợp lệ!' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Cộng đồng không tồn tại!' });
    }

    // Tạo bản ghi trong CommunityMember, tận dụng Compound Unique Index để chống duplicate
    try {
      await CommunityMember.create({
        community: community._id,
        user: userId,
        role: 'member'
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Bạn đã là thành viên của cộng đồng này rồi!' });
      }
      throw err;
    }

    // Tăng trường memberCount một cách nguyên tử
    const updated = await Community.findByIdAndUpdate(
      community._id,
      { $inc: { memberCount: 1 } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Tham gia cộng đồng thành công!',
      memberCount: updated.memberCount,
      isMember: true,
      role: 'member'
    });
  } catch (error) {
    console.error('Error in joinCommunity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. POST /api/communities/:communityId/leave - Rời khỏi cộng đồng
export const leaveCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ success: false, message: 'Mã cộng đồng không hợp lệ!' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Cộng đồng không tồn tại!' });
    }

    const membership = await CommunityMember.findOne({ community: community._id, user: userId });
    if (!membership) {
      return res.status(400).json({ success: false, message: 'Bạn chưa tham gia cộng đồng này!' });
    }

    // Xử lý chuyển quyền người tạo nếu người tạo rời nhóm và vẫn còn thành viên khác
    if (community.creator?.toString() === userId) {
      const nextMember = await CommunityMember.findOne({
        community: community._id,
        user: { $ne: userId }
      }).sort({ role: 1, createdAt: 1 }); // ưu tiên admin trước

      if (nextMember) {
        community.creator = nextMember.user;
        nextMember.role = 'admin';
        await Promise.all([community.save(), nextMember.save()]);
      }
    }

    // Xóa khỏi bảng trung gian
    await CommunityMember.deleteOne({ _id: membership._id });

    // Giảm memberCount một cách an toàn
    const updated = await Community.findByIdAndUpdate(
      community._id,
      { $inc: { memberCount: -1 } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Đã rời khỏi cộng đồng thành công!',
      memberCount: Math.max(0, updated.memberCount),
      isMember: false
    });
  } catch (error) {
    console.error('Error in leaveCommunity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. POST /api/communities/:communityId/posts - Đăng bài viết vào cộng đồng
export const createCommunityPost = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = (req.user?.userId || req.user?.id)?.toString();
    const { content, imageUrl, topic, privacy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ success: false, message: 'Mã cộng đồng không hợp lệ!' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền nội dung bài viết!' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Cộng đồng không tồn tại!' });
    }

    // Kiểm tra xem người dùng có phải là thành viên hay không qua CommunityMember
    const isMember = await CommunityMember.exists({ community: community._id, user: userId });
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bạn phải tham gia cộng đồng trước khi đăng bài viết!'
      });
    }

    const finalImageUrl = (req.file && req.file.path) ? req.file.path : (imageUrl || '');

    const newPost = await Post.create({
      authorId: userId,
      communityId: community._id,
      topic: topic?.trim() || '',
      content: content.trim(),
      imageUrl: finalImageUrl,
      privacy: privacy || 'public',
      status: 'active'
    });

    const populatedPost = await Post.findById(newPost._id)
      .populate('authorId', 'username fullName avatarUrl role')
      .populate('communityId', 'name avatar coverImage privacy');

    // Broadcast realtime qua Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('newPost', { post: populatedPost });
      io.to(`community_${communityId}`).emit('newCommunityPost', { post: populatedPost });
    }

    res.status(201).json({
      success: true,
      message: 'Đăng bài vào cộng đồng thành công!',
      data: populatedPost
    });
  } catch (error) {
    console.error('Error in createCommunityPost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
