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
  }
}, { timestamps: true }); // Tự động tạo createdAt, updatedAt

const User = mongoose.model('User', userSchema);
export default User;