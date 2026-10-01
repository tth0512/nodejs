import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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
    enum: ['member', 'group_admin', 'moderator', 'system_admin'],
    default: 'member'
  },
  fullName: {
    type: String,
    default: ''
  },
  // Profile fields
  avatarUrl: { type: String, default: '' },
  coverUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  studentId: { type: String, default: '' },
  major: { type: String, default: '' },
  cohort: { type: String, default: '' },
  skills: { type: String, default: '' },
  interests: { type: String, default: '' },
  // Privacy settings
  privacyProfile: { type: String, enum: ['public', 'private'], default: 'public' },
  privacyContact: { type: String, enum: ['public', 'private'], default: 'public' },
  isPrivate: { type: Boolean, default: false },
  // Account status
  status: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  // Email verification
  isVerified: { type: Boolean, default: false },
  verificationOTP: { type: String },
  verificationOTPExpire: { type: Date },
  // Password reset
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpire: { type: Date },
  // Cached counters (denormalized for performance)
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;