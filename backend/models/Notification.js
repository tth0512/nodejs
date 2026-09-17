import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // The user who receives the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The user who triggered the notification
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Notification type: 'follow', 'follow_request', 'follow_accept', 'post_like', etc.
  type: {
    type: String,
    required: true
  },
  // ID of the related entity (post, group, user, etc.)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
