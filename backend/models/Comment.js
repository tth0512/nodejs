import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },

  content: { type: String, required: true },
  likesCount: { type: Number, default: 0 }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;