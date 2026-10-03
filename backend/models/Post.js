import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  // Author of the post (renamed from 'author' for consistency)
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // null = posted on personal profile, ObjectId = posted in a community
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
    index: true
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
  },

  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 }

}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
export default Post;