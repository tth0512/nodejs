// backend/controllers/postController.js
import Post from '../models/Post.js';
import Like from '../models/Like.js';

// Helper: Đảm bảo imageUrl luôn là mảng cho cả bài viết cũ và mới
export const ensureArrayImageUrl = (post) => {
  if (!post) return post;
  if (!post.imageUrl) return { ...post, imageUrl: [] };
  if (Array.isArray(post.imageUrl)) return post;
  if (typeof post.imageUrl === 'string') {
    return { ...post, imageUrl: post.imageUrl.trim() ? [post.imageUrl.trim()] : [] };
  }
  return { ...post, imageUrl: [] };
};

// Helper: Trích xuất danh sách URL ảnh từ request (hỗ trợ Multer uploadCloud và URL / base64)
export const extractImageUrls = (req) => {
  let urls = [];

  // 1. Từ Multer uploadCloud (req.files hoặc req.file)
  if (req.files) {
    if (Array.isArray(req.files)) {
      urls = urls.concat(req.files.map(f => f.path).filter(Boolean));
    } else if (typeof req.files === 'object') {
      Object.values(req.files).forEach((arr) => {
        if (Array.isArray(arr)) {
          urls = urls.concat(arr.map(f => f.path).filter(Boolean));
        }
      });
    }
  }
  if (req.file && req.file.path) {
    urls.push(req.file.path);
  }

  // 2. Từ req.body (hỗ trợ imageUrl, imageUrls, images)
  const rawBodyImages = req.body.imageUrl ?? req.body.imageUrls ?? req.body.images;
  if (rawBodyImages) {
    if (Array.isArray(rawBodyImages)) {
      urls = urls.concat(rawBodyImages.filter(Boolean));
    } else if (typeof rawBodyImages === 'string') {
      try {
        const parsed = JSON.parse(rawBodyImages);
        if (Array.isArray(parsed)) {
          urls = urls.concat(parsed.filter(Boolean));
        } else if (typeof parsed === 'string' && parsed.trim()) {
          urls.push(parsed.trim());
        } else {
          urls.push(rawBodyImages.trim());
        }
      } catch {
        if (rawBodyImages.trim()) urls.push(rawBodyImages.trim());
      }
    }
  }

  return [...new Set(urls.filter(Boolean))];
};

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

    const postsWithLiked = posts.map(post => {
      const p = ensureArrayImageUrl(post);
      return {
        ...p,
        isLiked: likedPostIds.has(p._id.toString())
      };
    });

    res.status(200).json({ success: true, data: postsWithLiked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy chi tiết một bài viết (Public / Optional Auth)
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('authorId', 'username email avatarUrl')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết!' });
    }

    const userId = (req.user?.userId || req.user?.id)?.toString();
    let isLiked = false;
    if (userId) {
      const like = await Like.findOne({ userId, targetId: post._id, targetType: 'Post' });
      isLiked = Boolean(like);
    }

    const p = ensureArrayImageUrl(post);
    res.status(200).json({ success: true, data: { ...p, isLiked } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Tạo bài viết mới
export const createPost = async (req, res) => {
  try {
    const { topic, content, communityId, privacy } = req.body;
    const authorId = req.user?.userId || req.user?.id;

    if (!authorId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc phiên hết hạn!' });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền nội dung bài viết!' });
    }

    // Support both Cloudinary uploaded files and direct URLs / base64 array
    const finalImageUrls = extractImageUrls(req);

    const newPost = await Post.create({
      authorId,
      communityId: communityId || null,
      topic: topic || '',
      content,
      imageUrl: finalImageUrls,
      privacy: privacy || 'public'
    });

    const populatedPost = await Post.findById(newPost._id)
      .populate('authorId', 'username email avatarUrl fullName')
      .populate('communityId', 'name avatar coverImage privacy');

    const formattedPost = ensureArrayImageUrl(populatedPost.toObject ? populatedPost.toObject() : populatedPost);

    // Emit Socket.IO event to broadcast new post to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('newPost', { post: formattedPost });
    }

    res.status(201).json({ success: true, data: formattedPost });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Sửa bài viết (Chỉ tác giả)
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

    const { topic, content, privacy } = req.body;
    if (topic !== undefined) post.topic = topic;
    if (content !== undefined) post.content = content;
    if (privacy !== undefined) post.privacy = privacy;

    // Cập nhật ảnh nếu có truyền mới hoặc upload mới
    const uploadedUrls = extractImageUrls(req);
    if (req.body.imageUrl !== undefined || req.body.imageUrls !== undefined || req.body.images !== undefined || uploadedUrls.length > 0) {
      post.imageUrl = uploadedUrls;
    }

    const updatedPost = await post.save();

    const populatedPost = await Post.findById(updatedPost._id)
      .populate('authorId', 'username email avatarUrl');

    const formattedPost = ensureArrayImageUrl(populatedPost.toObject ? populatedPost.toObject() : populatedPost);

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('postUpdated', { post: formattedPost });
    }

    res.status(200).json({ success: true, message: 'Cập nhật thành công!', data: formattedPost });
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