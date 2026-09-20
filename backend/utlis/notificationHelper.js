// backend/utlis/notificationHelper.js
import Notification from '../models/Notification.js';

/**
 * Tạo bản ghi thông báo và phát qua Socket.IO tới room cá nhân của người nhận
 * @param {object} io - Socket.IO instance (req.app.get('io'))
 * @param {object} params
 * @param {string|object} params.recipient - ID người nhận thông báo
 * @param {string|object} params.sender - ID người tạo tương tác
 * @param {string} params.type - Loại thông báo ('post_like', 'post_comment', 'comment_reply', ...)
 * @param {string|object} params.targetId - ID bài viết hoặc đối tượng liên quan
 */
export async function createAndEmitNotification(io, { recipient, sender, type, targetId }) {
  try {
    if (!recipient || !sender) return null;

    const recipientId = (recipient?._id || recipient)?.toString();
    const senderId = (sender?._id || sender)?.toString();

    // Không tự gửi thông báo cho chính mình
    if (recipientId === senderId) {
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      targetId
    });

    const populated = await notification.populate('sender', 'username fullName avatarUrl');

    if (io) {
      io.to(recipientId).emit('new_notification', populated);
    }

    return populated;
  } catch (error) {
    console.error('Lỗi khi tạo và phát thông báo:', error);
    return null;
  }
}

/**
 * Xóa thông báo khi người dùng hủy tương tác (ví dụ: Unlike bài viết)
 */
export async function removeNotification({ recipient, sender, type, targetId }) {
  try {
    if (!recipient || !sender) return;

    const recipientId = (recipient?._id || recipient)?.toString();
    const senderId = (sender?._id || sender)?.toString();

    await Notification.deleteMany({
      recipient: recipientId,
      sender: senderId,
      type,
      targetId,
      isRead: false // Chỉ gỡ những thông báo chưa đọc
    });
  } catch (error) {
    console.error('Lỗi khi gỡ thông báo:', error);
  }
}
