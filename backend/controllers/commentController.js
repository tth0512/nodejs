// backend/controllers/commentController.js
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Like from '../models/Like.js';
import { createAndEmitNotification } from '../utlis/notificationHelper.js';

// ── 1. Lấy danh sách bình luận gốc của bài viết ─────────────────────────
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 5);
    const skip = (page - 1) * limit;

    const userId = (req.user?.userId || req.user?.id)?.toString();

    const [comments, total] = await Promise.all([
      Comment.find({ postId, parentCommentId: null })
        .populate('authorId', 'username fullName avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ postId, parentCommentId: null })
    ]);

    const commentIds = comments.map(c => c._id);

    // Đếm số lượng câu trả lời cho từng comment gốc
    const replyCountAgg = await Comment.aggregate([
      { $match: { parentCommentId: { $in: commentIds } } },
      { $group: { _id: '$parentCommentId', count: { $sum: 1 } } }
    ]);
    const replyCountMap = {};
    replyCountAgg.forEach(item => {
      replyCountMap[item._id.toString()] = item.count;
    });

    // Kiểm tra like của user hiện tại (nếu đã đăng nhập)
    let likedCommentIds = new Set();
    if (userId && commentIds.length > 0) {
      const userLikes = await Like.find({
        userId,
        targetId: { $in: commentIds },
        targetType: 'Comment'
      }).select('targetId');
      likedCommentIds = new Set(userLikes.map(l => l.targetId.toString()));
    }

    const formattedComments = comments.map(c => ({
      ...c,
      repliesCount: replyCountMap[c._id.toString()] || 0,
      isLiked: likedCommentIds.has(c._id.toString())
    }));

    res.status(200).json({
      success: true,
      data: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Error in getComments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 2. Tạo bình luận gốc mới ──────────────────────────────────────────────
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const comment = await Comment.create({
      authorId: userId,
      postId,
      parentCommentId: null,
      content: content.trim()
    });

    // Tăng số lượng bình luận bài viết
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate('authorId', 'username fullName avatarUrl')
      .lean();

    const formatted = {
      ...populated,
      repliesCount: 0,
      isLiked: false
    };

    // Emit Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('newComment', { postId, comment: formatted });

      // Phát thông báo cá nhân cho tác giả bài viết
      await createAndEmitNotification(io, {
        recipient: post.authorId,
        sender: userId,
        type: 'post_comment',
        targetId: post._id
      });
    }

    res.status(201).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error in createComment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 3. Trả lời bình luận (Reply 1 level) ──────────────────────────────────
export const replyComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung trả lời không được để trống' });
    }

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận gốc' });
    }

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    // Luôn gắn vào comment gốc cao nhất (1 level nesting)
    const targetParentId = parentComment.parentCommentId || parentComment._id;

    const reply = await Comment.create({
      authorId: userId,
      postId,
      parentCommentId: targetParentId,
      content: content.trim()
    });

    const populated = await Comment.findById(reply._id)
      .populate('authorId', 'username fullName avatarUrl')
      .lean();

    const formatted = {
      ...populated,
      isLiked: false
    };


    // Emit Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('newReply', { postId, parentCommentId: targetParentId.toString(), reply: formatted });

      // Phát thông báo cá nhân cho người viết bình luận gốc
      await createAndEmitNotification(io, {
        recipient: parentComment.authorId,
        sender: userId,
        type: 'comment_reply',
        targetId: postId
      });
    }

    res.status(201).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error in replyComment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 4. Lấy danh sách câu trả lời của 1 bình luận ──────────────────────────
export const getReplies = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    const replies = await Comment.find({ postId, parentCommentId: commentId })
      .populate('authorId', 'username fullName avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    const replyIds = replies.map(r => r._id);

    let likedReplyIds = new Set();
    if (userId && replyIds.length > 0) {
      const userLikes = await Like.find({
        userId,
        targetId: { $in: replyIds },
        targetType: 'Comment'
      }).select('targetId');
      likedReplyIds = new Set(userLikes.map(l => l.targetId.toString()));
    }

    const formattedReplies = replies.map(r => ({
      ...r,
      isLiked: likedReplyIds.has(r._id.toString())
    }));

    res.status(200).json({ success: true, data: formattedReplies });
  } catch (error) {
    console.error('Error in getReplies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 5. Xóa bình luận ──────────────────────────────────────────────────────
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = (req.user?.userId || req.user?.id)?.toString();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const post = await Post.findById(postId);

    const isAuthor = comment.authorId.toString() === userId;
    const isPostAuthor = post && post.authorId.toString() === userId;
    const isAdmin = ['moderator', 'system_admin'].includes(req.user?.role);

    if (!isAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    const isTopLevel = !comment.parentCommentId;
    let deletedCount = 1;

    if (isTopLevel) {
      // Tìm các reply để xóa kèm like
      const replies = await Comment.find({ parentCommentId: commentId }).select('_id');
      const allIds = [commentId, ...replies.map(r => r._id)];
      deletedCount = allIds.length;

      await Promise.all([
        Comment.deleteMany({ _id: { $in: allIds } }),
        Like.deleteMany({ targetId: { $in: allIds }, targetType: 'Comment' }),
        Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -deletedCount } })
      ]);
    } else {
      await Promise.all([
        comment.deleteOne(),
        Like.deleteMany({ targetId: commentId, targetType: 'Comment' }),
        Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } })
      ]);
    }

    // Emit Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('commentDeleted', {
        postId,
        commentId,
        parentCommentId: comment.parentCommentId ? comment.parentCommentId.toString() : null,
        deletedCount
      });
    }

    res.status(200).json({ success: true, message: 'Đã xóa bình luận thành công' });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
