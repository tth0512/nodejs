import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Không cho trùng username
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    // enum: ['user', 'admin'], // Chỉ cho phép 2 giá trị: user hoặc admin
    enum: [
      'member',
      'group_admin',
      'moderator',
      'system_admin'
    ],
    default: 'member' // Mặc định là member
  },
  // Thêm các trường này vào dưới trường role trong file User.js
  fullName: { type: String, default: '' },
  studentId: { type: String, default: '' },
  major: { type: String, default: '' },
  cohort: { type: String, default: '' },
  skills: { type: String, default: '' },
  interests: { type: String, default: '' },
  privacyProfile: { type: String, enum: ['public', 'members', 'private'], default: 'public' },
  privacyContact: { type: String, enum: ['public', 'members', 'private'], default: 'members' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true }); // Tự động tạo createdAt, updatedAt

const User = mongoose.model('User', userSchema);
export default User;