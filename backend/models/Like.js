import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },

  targetType: {
    type: String,
    required: true,
    enum: ['Post', 'Comment']
  }
}, { timestamps: true });

likeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
export default Like;