// backend/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. REGISTER - Đăng ký
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin!' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email hoặc Username đã tồn tại!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. LOGIN - Đăng nhập & Đẩy Token vào Cookie
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu!' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Gắn Token vào HttpOnly Cookie
    res.cookie('token', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. LOGOUT - Đăng xuất
export const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Đã đăng xuất thành công!' });
};

// 4. GET ME - Lấy thông tin User hiện tại
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password'); 
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. UPDATE PROFILE - Cập nhật thông tin cá nhân
// Cập nhật thông tin Profile cá nhân
export const updateProfile = async (req, res) => {
  try {
    const {
      fullName, studentId, major, cohort, skills, interests,
      privacyProfile, privacyContact, avatarUrl, coverUrl, bio, isPrivate
    } = req.body;
    
    // Tìm và update User dựa trên ID lấy từ Token (ngăn không cho sửa tài khoản người khác)
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId, 
      {
        fullName, studentId, major, cohort, skills, interests,
        privacyProfile, privacyContact,
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(bio !== undefined && { bio }),
        ...(isPrivate !== undefined && { isPrivate })
      },
      { new: true, runValidators: true } // Trả về data mới sau khi update
    ).select('-password');

    res.status(200).json({ success: true, message: 'Cập nhật hồ sơ thành công', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. GET USER BY ID - Lấy thông tin public của người dùng khác
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. UPLOAD AVATAR - Tải ảnh đại diện lên Cloudinary
export const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh đại diện!' });
    }

    const avatarUrl = req.file.path; // Cloudinary URL

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { avatarUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công!',
      avatarUrl,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. UPLOAD COVER - Tải ảnh bìa lên Cloudinary
export const uploadCoverController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh bìa!' });
    }

    const coverUrl = req.file.path;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { coverUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh bìa thành công!',
      coverUrl,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};