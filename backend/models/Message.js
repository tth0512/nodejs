import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'seen'], 
    default: 'sent' 
  }
}, { timestamps: true });

// Ensure fast querying for messages by conversationId
messageSchema.index({ conversationId: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
