// backend/controllers/postController.js
import Post from '../models/Post.js';

// 1. Lấy danh sách bài viết (Public)
export const getPosts = async (req, res) => {
  try {
    const query = req.query.author ? { author: req.query.author } : {};
    const posts = await Post.find(query).populate('author', 'username email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Tạo bài viết mới
export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ title và content!' });
    }

    const newPost = await Post.create({
      title,
      content,
      author: req.user.userId 
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Sửa bài viết (Chỉ tác giả)
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết!' });
    }

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền sửa bài viết của người khác!' 
      });
    }

    const { title, content } = req.body;
    post.title = title || post.title;
    post.content = content || post.content;

    const updatedPost = await post.save();
    res.status(200).json({ success: true, message: 'Cập nhật thành công!', data: updatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Xóa bài viết (Tác giả hoặc Moderator / System Admin)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết!' });
    }

    // Kiểm tra quyền: Phải là tác giả HOẶC có role quản trị hệ thống
    const isAuthor = post.author.toString() === req.user.userId;
    const hasAdminPrivilege = ['moderator', 'system_admin'].includes(req.user.role);

    if (!isAuthor && !hasAdminPrivilege) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền xóa bài viết này!' 
      });
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Đã xóa bài viết thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};