// backend/controllers/likeController.js
import Like from '../models/Like.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { createAndEmitNotification, removeNotification } from '../utlis/notificationHelper.js';

// ── 1. Toggle Like / Unlike bài viết ──────────────────────────────────────
export const togglePostLike = async (req, res) => {
  try {
    const userId  = (req.user?.userId || req.user?.id)?.toString();
    const postId  = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const existing = await Like.findOne({ userId, targetId: postId, targetType: 'Post' });

    let liked;
    if (existing) {
      // Đã like → unlike
      await existing.deleteOne();
      // Giảm likesCount, không để âm
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
      liked = false;
    } else {
      // Chưa like → like
      await Like.create({ userId, targetId: postId, targetType: 'Post' });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
      liked = true;
    }

    const updatedPost = await Post.findById(postId).select('likesCount');
    const likesCount  = updatedPost?.likesCount ?? 0;

    // Phát sự kiện real-time cho tất cả client
    const io = req.app.get('io');
    if (io) {
      io.emit('postLikeUpdated', { postId, likesCount, userId, liked });

      // Phát thông báo cá nhân cho chủ bài viết
      if (liked) {
        await createAndEmitNotification(io, {
          recipient: post.authorId,
          sender: userId,
          type: 'post_like',
          targetId: post._id
        });
      } else {
        await removeNotification({
          recipient: post.authorId,
          sender: userId,
          type: 'post_like',
          targetId: post._id
        });
      }
    }

    res.status(200).json({ success: true, data: { liked, likesCount } });
  } catch (error) {
    console.error('Error in togglePostLike:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 2. Toggle Like / Unlike bình luận ─────────────────────────────────────
export const toggleCommentLike = async (req, res) => {
  try {
    const userId    = (req.user?.userId || req.user?.id)?.toString();
    const { postId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const existing = await Like.findOne({ userId, targetId: commentId, targetType: 'Comment' });

    let liked;
    if (existing) {
      await existing.deleteOne();
      await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
      liked = false;
    } else {
      await Like.create({ userId, targetId: commentId, targetType: 'Comment' });
      await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
      liked = true;
    }

    const updatedComment = await Comment.findById(commentId).select('likesCount');
    const likesCount     = updatedComment?.likesCount ?? 0;

    res.status(200).json({ success: true, data: { liked, likesCount } });
  } catch (error) {
    console.error('Error in toggleCommentLike:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
