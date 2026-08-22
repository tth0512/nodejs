import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// 1. REGISTER - Đăng ký tài khoản
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate dữ liệu
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin!' });
    }

    // Kiểm tra trùng username hoặc email
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email hoặc Username đã tồn tại!' });
    }

    // Hash mật khẩu với độ an toàn 10 rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu User mới vào Database
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. LOGIN - Đăng nhập & Cấp JWT Token
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu!' });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    // So sánh mật khẩu người dùng gửi lên với mật khẩu đã hash trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Tạo JWT Token có hạn trong 7 ngày
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token: token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;