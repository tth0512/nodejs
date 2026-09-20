// frontend/src/components/PostActions.jsx
import { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { togglePostLike } from '../api/postApi.js';
import { useSocket } from '../context/SocketContext.jsx';

export default function PostActions({ post, currentUser, onCommentClick, isOpenComment }) {
  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [animating, setAnimating] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const socket = useSocket();
  const currentUserId = (currentUser?._id || currentUser?.userId || currentUser?.id)?.toString();

  // Đồng bộ lại state khi bài viết thay đổi
  useEffect(() => {
    setLiked(Boolean(post.isLiked));
  }, [post._id, post.isLiked]);

  useEffect(() => {
    setLikesCount(post.likesCount || 0);
  }, [post._id, post.likesCount]);

  useEffect(() => {
    setCommentsCount(post.commentsCount || 0);
  }, [post._id, post.commentsCount]);

  // Lắng nghe sự kiện socket real-time
  useEffect(() => {
    if (!socket) return;

    const handleLikeUpdated = (payload) => {
      if (payload.postId === post._id) {
        setLikesCount(payload.likesCount);
        if (payload.userId === currentUserId && payload.liked !== undefined) {
          setLiked(payload.liked);
        }
      }
    };

    const handleNewComment = (payload) => {
      if (payload.postId === post._id) {
        setCommentsCount((prev) => prev + 1);
      }
    };

    const handleNewReply = (payload) => {
      if (payload.postId === post._id) {
        setCommentsCount((prev) => prev + 1);
      }
    };

    const handleCommentDeleted = (payload) => {
      if (payload.postId === post._id) {
        const dec = payload.deletedCount || 1;
        setCommentsCount((prev) => Math.max(0, prev - dec));
      }
    };

    socket.on('postLikeUpdated', handleLikeUpdated);
    socket.on('newComment', handleNewComment);
    socket.on('newReply', handleNewReply);
    socket.on('commentDeleted', handleCommentDeleted);

    return () => {
      socket.off('postLikeUpdated', handleLikeUpdated);
      socket.off('newComment', handleNewComment);
      socket.off('newReply', handleNewReply);
      socket.off('commentDeleted', handleCommentDeleted);
    };
  }, [socket, post._id, currentUserId]);

  const handleToggleLike = async () => {
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để tương tác bài viết!');
      return;
    }

    if (isLiking) return;

    // Optimistic Update
    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setLikesCount(nextCount);
    if (nextLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 450);
    }

    setIsLiking(true);
    try {
      const res = await togglePostLike(post._id);
      if (res.success && res.data) {
        setLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
      }
    } catch (error) {
      // Revert optimistic update khi lỗi
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(error.response?.data?.message || 'Không thể thực hiện tương tác');
    } finally {
      setIsLiking(false);
    }
  };

  const hasStats = likesCount > 0 || commentsCount > 0;

  return (
    <div className="post-interaction-container">
      {/* Hàng thống kê Lượt thích & Bình luận */}
      {hasStats && (
        <div className="post-stats-row">
          <div className="stat-left">
            {likesCount > 0 && (
              <span className="likes-badge">
                <span className="heart-circle">
                  <FaHeart className="stat-heart-icon" />
                </span>
                <span className="stat-text">{likesCount}</span>
              </span>
            )}
          </div>
          <div className="stat-right">
            {commentsCount > 0 && (
              <button
                type="button"
                className="comments-count-btn"
                onClick={onCommentClick}
              >
                {commentsCount} bình luận
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thanh nút Like & Bình luận */}
      <div className="post-actions-bar">
        <button
          type="button"
          className={`action-button like-button ${liked ? 'is-liked' : ''} ${animating ? 'animate-bounce' : ''}`}
          style={liked ? { color: '#F0394F' } : undefined}
          onClick={handleToggleLike}
          aria-label={liked ? 'Bỏ thích' : 'Thích'}
        >
          {liked ? (
            <FaHeart className="btn-icon heart-filled" style={{ color: '#F0394F' }} />
          ) : (
            <FaRegHeart className="btn-icon heart-outlined" />
          )}
          <span className="btn-label" style={liked ? { color: '#F0394F' } : undefined}>Thích</span>
        </button>

        <button
          type="button"
          className={`action-button comment-button ${isOpenComment ? 'is-active' : ''}`}
          onClick={onCommentClick}
          aria-label="Bình luận"
        >
          <FiMessageSquare className="btn-icon" />
          <span className="btn-label">Bình luận</span>
        </button>
      </div>
    </div>
  );
}
