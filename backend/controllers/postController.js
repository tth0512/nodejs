// backend/controllers/postController.js
import Post from '../models/Post.js';
import Like from '../models/Like.js';

// 1. Lấy danh sách bài viết (Public / Optional Auth)
export const getPosts = async (req, res) => {
  try {
    const query = req.query.author ? { authorId: req.query.author } : {};
    const posts = await Post.find(query)
      .populate('authorId', 'username email avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    const userId = (req.user?.userId || req.user?.id)?.toString();

    let likedPostIds = new Set();
    if (userId && posts.length > 0) {
      const postIds = posts.map(p => p._id);
      const userLikes = await Like.find({
        userId,
        targetId: { $in: postIds },
        targetType: 'Post'
      }).select('targetId');
      likedPostIds = new Set(userLikes.map(l => l.targetId.toString()));
    }

    const postsWithLiked = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post._id.toString())
    }));

    res.status(200).json({ success: true, data: postsWithLiked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Tạo bài viết mới
export const createPost = async (req, res) => {
  try {
    const { topic, content, imageUrl, communityId, privacy } = req.body;
    const authorId = req.user?.userId || req.user?.id;

    if (!authorId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc phiên hết hạn!' });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền nội dung bài viết!' });
    }

    // Support both Cloudinary uploaded file and direct URL
    const finalImageUrl = (req.file && req.file.path) ? req.file.path : (imageUrl || '');

    const newPost = await Post.create({
      authorId,
      communityId: communityId || null,
      topic: topic || '',
      content,
      imageUrl: finalImageUrl,
      privacy: privacy || 'public'
    });

    const populatedPost = await Post.findById(newPost._id)
      .populate('authorId', 'username email avatarUrl fullName')
      .populate('communityId', 'name avatar coverImage privacy');

    // Emit Socket.IO event to broadcast new post to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('newPost', { post: populatedPost });
    }

    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Sửa bài viết (Chỉ tác giả)
export const updatePost = async (req, res) => {
  try {
    const userId = (req.user?.userId || req.user?.id)?.toString();
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết!' });
    }

    if (post.authorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa bài viết của người khác!'
      });
    }

    const { topic, content, imageUrl, privacy } = req.body;
    if (topic !== undefined) post.topic = topic;
    if (content !== undefined) post.content = content;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;
    if (privacy !== undefined) post.privacy = privacy;

    const updatedPost = await post.save();

    const populatedPost = await Post.findById(updatedPost._id)
      .populate('authorId', 'username email avatarUrl');

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('postUpdated', { post: populatedPost });
    }

    res.status(200).json({ success: true, message: 'Cập nhật thành công!', data: populatedPost });
  } catch (error) {
    console.error('Error in updatePost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Xóa bài viết (Tác giả hoặc Moderator / System Admin)
export const deletePost = async (req, res) => {
  try {
    const userId = (req.user?.userId || req.user?.id)?.toString();
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết!' });
    }

    // Kiểm tra quyền: phải là tác giả HOẶC có role quản trị hệ thống
    const isAuthor = post.authorId.toString() === userId;
    const hasAdminPrivilege = ['moderator', 'system_admin'].includes(req.user?.role);

    if (!isAuthor && !hasAdminPrivilege) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bài viết này!'
      });
    }

    const postId = post._id.toString();
    await post.deleteOne();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('postDeleted', { postId });
    }

    res.status(200).json({ success: true, message: 'Đã xóa bài viết thành công!' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};