import mongoose from 'mongoose';

/**
 * Community Schema - Đại diện cho cộng đồng / nhóm học tập trong UniConnect
 * Áp dụng nguyên tắc CSDL tối ưu:
 * - Tránh embedding mảng thành viên (tránh vượt giới hạn 16MB của MongoDB khi nhóm có hàng ngàn sinh viên).
 * - Sử dụng trường denormalized `memberCount` để tối ưu đọc thống kê mà không cần countDocuments liên tục.
 */
const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên cộng đồng là bắt buộc!'],
      unique: true,
      trim: true,
      index: true,
      maxlength: [100, 'Tên cộng đồng tối đa 100 ký tự!']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Mô tả tối đa 1000 ký tự!']
    },
    avatar: {
      type: String,
      default: '' // Link ảnh đại diện Cloudinary
    },
    coverImage: {
      type: String,
      default: '' // Link ảnh bìa Cloudinary
    },
    privacy: {
      type: String,
      enum: {
        values: ['public', 'private'],
        message: 'Quyền riêng tư phải là public hoặc private!'
      },
      default: 'public',
      index: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo cộng đồng là bắt buộc!'],
      index: true
    },
    memberCount: {
      type: Number,
      default: 1,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Community = mongoose.model('Community', communitySchema);
export default Community;
