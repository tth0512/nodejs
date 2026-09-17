import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  // Author of the post (renamed from 'author' for consistency)
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // null = posted on personal profile, ObjectId = posted in a group
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  // Optional topic/tag for the post
  topic: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'public'
  },
  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active'
  }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
export default Post;