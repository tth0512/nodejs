// backend/controllers/notificationController.js
import Notification from '../models/Notification.js';

// GET /api/notifications — Get notifications for current user (latest 30)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'username fullName avatarUrl');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false
    });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/:id/read — Mark single notification as read
export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'Đã đánh dấu đã đọc.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/read-all — Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
