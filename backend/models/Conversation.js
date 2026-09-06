import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: ['accepted', 'pending'], 
    default: 'accepted' 
  },
  lastMessage: {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String },
    createdAt: { type: Date }
  }
}, { timestamps: true });

// Ensure fast querying for inbox by participants
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
