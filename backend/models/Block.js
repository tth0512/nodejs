import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  // The user who performs the block
  blockerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The user being blocked
  blockedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate block documents
blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const Block = mongoose.model('Block', blockSchema);
export default Block;
