import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  // The user who initiates the follow action
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The user being followed
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 'pending' = follow request sent (private account), 'accepted' = actively following
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'accepted'
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate follow documents
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = mongoose.model('Follow', followSchema);
export default Follow;
