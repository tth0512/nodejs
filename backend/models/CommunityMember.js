import mongoose from 'mongoose';

/**
 * CommunityMember Schema - Bảng trung gian (Junction Collection)
 * Áp dụng nguyên tắc CSDL tối ưu:
 * - Thay thế Unbound Array (mảng thành viên vô hạn nhúng trong Community) bằng bảng trung gian (Referencing pattern).
 * - Compound Unique Index (community, user): Đảm bảo mức Database một user không thể tham gia trùng 1 nhóm.
 * - Single Index (user): Tối ưu truy vấn "Lấy danh sách các nhóm user đã tham gia" để load feed với tốc độ O(log N).
 */
const communityMemberSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'ID cộng đồng là bắt buộc!']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID người dùng là bắt buộc!']
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'moderator', 'member'],
        message: 'Vai trò phải là admin, moderator hoặc member!'
      },
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// 1. Compound Unique Index: Ngăn chặn 1 user join 1 community nhiều hơn 1 lần
communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });

// 2. Secondary Index: Tối ưu truy vấn lấy danh sách cộng đồng mà 1 user đã tham gia (dùng cho /api/groups/feed, /api/communities/feed)
communityMemberSchema.index({ user: 1 });

const CommunityMember = mongoose.model('CommunityMember', communityMemberSchema);
export default CommunityMember;
