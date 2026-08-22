import express from 'express';
import Post from '../models/Post.js';
import { protect } from '../middleware/authMiddleware.js'; // Import middleware

const router = express.Router();

// 1. Các route GET xem danh sách (ai cũng xem được, không cần token)
router.get('/', async (req, res) => {
  const posts = await Post.find().populate('author', 'username email').sort({ createdAt: -1 });
  res.json({ success: true, data: posts });
});

// 2. Route CREATE POST (Được bảo vệ bằng middleware protect)
router.post('/', protect, async (req, res) => {
  try {
    const { title, content } = req.body; // Client CHỈ CẦN gửi title và content

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ title và content!' });
    }

    // Tự động lấy tác giả từ req.user do middleware giải mã Token
    const newPost = await Post.create({
      title,
      content,
      author: req.user.userId 
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. PUT - Sửa bài viết (CHỈ TÁC GIẢ MỚI ĐƯỢC SỬA)
router.put('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết!' });
    }

    // So sánh ID người tạo bài viết với ID người gửi request
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
});

// 4. DELETE - Xóa bài viết (TÁC GIẢ HOẶC ADMIN ĐƯỢC XÓA)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết!' });
    }

    // Điều kiện: Phải là tác giả HOẶC có role admin
    const isAuthor = post.author.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
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
});

export default router;