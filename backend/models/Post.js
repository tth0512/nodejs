import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId, // Lưu ID của User
    ref: 'User', // Liên kết tới bảng User
    required: true
  },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
export default Post;