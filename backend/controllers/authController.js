// backend/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateOTP, sendVerificationEmail, sendResetPasswordEmail } from '../utlis/mailer.js';

// 1. REGISTER - Đăng ký tài khoản & gửi mã OTP xác thực
export const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin (username, email, password)!' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: trimmedEmail }, { username: trimmedUsername }]
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const rawOtp = generateOTP();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    let targetUser;

    if (existingUser) {
      // Nếu email đã tồn tại nhưng tài khoản CHƯA xác thực, cho phép cập nhật lại thông tin và gửi OTP mới
      if (existingUser.email === trimmedEmail && existingUser.isVerified === false) {
        // Kiểm tra xem username mới có bị trùng với người khác đã xác thực không
        const usernameTaken = await User.findOne({
          username: trimmedUsername,
          _id: { $ne: existingUser._id }
        });
        if (usernameTaken) {
          return res.status(400).json({ success: false, message: 'Tên người dùng (Username) đã được sử dụng bởi tài khoản khác!' });
        }

        existingUser.username = trimmedUsername;
        existingUser.password = hashedPassword;
        existingUser.fullName = fullName || trimmedUsername || '';
        existingUser.verificationOTP = hashedOtp;
        existingUser.verificationOTPExpire = otpExpire;
        targetUser = await existingUser.save();
      } else {
        return res.status(400).json({ success: false, message: 'Email hoặc Username đã tồn tại!' });
      }
    } else {
      targetUser = await User.create({
        username: trimmedUsername,
        email: trimmedEmail,
        password: hashedPassword,
        fullName: fullName || trimmedUsername || '',
        isVerified: false,
        verificationOTP: hashedOtp,
        verificationOTPExpire: otpExpire
      });
    }

    // Gửi email chứa mã OTP
    await sendVerificationEmail(trimmedEmail, rawOtp);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Vui lòng kiểm tra email để lấy mã xác thực.',
      email: targetUser.email,
      needVerification: true
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1.1 VERIFY EMAIL - Xác thực mã OTP đăng ký
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email và mã OTP!' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này!' });
    }

    if (user.isVerified) {
      return res.status(200).json({ success: true, message: 'Tài khoản của bạn đã được xác thực trước đó. Hãy đăng nhập!' });
    }

    if (!user.verificationOTP || !user.verificationOTPExpire || user.verificationOTPExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng bấm gửi lại mã!'
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.verificationOTP);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại!' });
    }

    // Kích hoạt tài khoản
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1.2 RESEND VERIFICATION OTP - Gửi lại mã xác thực
export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email!' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này!' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Tài khoản này đã được xác thực trước đó rồi!' });
    }

    const rawOtp = generateOTP();
    user.verificationOTP = await bcrypt.hash(rawOtp, 10);
    user.verificationOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(trimmedEmail, rawOtp);

    res.status(200).json({
      success: true,
      message: 'Mã xác thực mới đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1.3 FORGOT PASSWORD - Yêu cầu mã OTP khôi phục mật khẩu
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email!' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    // Để chống enumeration attack: dù email có tồn tại hay không, trả về thông báo chung
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Nếu địa chỉ email tồn tại trên hệ thống, mã xác nhận sẽ được gửi đến hộp thư của bạn.'
      });
    }

    const rawOtp = generateOTP();
    user.resetPasswordOTP = await bcrypt.hash(rawOtp, 10);
    user.resetPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    await sendResetPasswordEmail(trimmedEmail, rawOtp);

    res.status(200).json({
      success: true,
      message: 'Mã xác nhận đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.',
      email: trimmedEmail
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1.4 VERIFY RESET OTP - Kiểm tra mã OTP khôi phục mật khẩu trước khi cho đổi mật khẩu mới
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP!' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpire || user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn hoặc không hợp lệ!' });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.resetPasswordOTP);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác!' });
    }

    res.status(200).json({
      success: true,
      message: 'Mã OTP hợp lệ! Hãy thiết lập mật khẩu mới.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1.5 RESET PASSWORD - Đổi mật khẩu mới sau khi xác thực OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin yêu cầu!' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp!' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpire || user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn hoặc yêu cầu không hợp lệ!' });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.resetPasswordOTP);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác!' });
    }

    // Cập nhật mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
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

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Kiểm tra tài khoản đã xác thực email hay chưa
    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn chưa được xác thực email. Vui lòng xác thực trước khi đăng nhập!',
        needVerification: true,
        email: user.email
      });
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

    if (user.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa!' });
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
