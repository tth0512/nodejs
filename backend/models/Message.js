import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // String ID to group messages into a conversation thread
  // Using String for flexibility (e.g., "userId1_userId2" or Conversation ObjectId as string)
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
