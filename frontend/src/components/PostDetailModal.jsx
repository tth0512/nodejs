// src/components/PostDetailModal.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiX, FiClock, FiExternalLink } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { togglePostLike, getPostById } from '../api/postApi.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/utils/useAuth.js';
import CommentSection from './CommentSection.jsx';
import PostImageGrid from './PostImageGrid.jsx';
import './PostDetailModal.css';

export default function PostDetailModal({ post: initialPostProp, onClose: onCloseProp }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const params    = useParams();
  const { currentUser } = useAuth();
  const socket = useSocket();

  const postId = initialPostProp?._id || params.postId || location.state?.post?._id;
  const initialPost = initialPostProp || location.state?.post || null;

  const [post, setPost]                   = useState(initialPost);
  const [loading, setLoading]             = useState(!initialPost);
  const [error, setError]                 = useState(null);
  const [liked, setLiked]                 = useState(Boolean(initialPost?.isLiked));
  const [likesCount, setLikesCount]       = useState(initialPost?.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(initialPost?.commentsCount || 0);
  const [animating, setAnimating]         = useState(false);
  const [isLiking, setIsLiking]           = useState(false);
  const [showComments, setShowComments]   = useState(true);

  const handleClose = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (onCloseProp) {
      onCloseProp();
    } else if (location.state?.backgroundLocation) {
      navigate(location.state.backgroundLocation);
    } else {
      navigate('/posts');
    }
  }, [onCloseProp, location.state, navigate]);

  // Fetch post if not available or to sync fresh state
  useEffect(() => {
    if (!postId) return;
    let isMounted = true;

    const fetchPost = async () => {
      try {
        const res = await getPostById(postId);
        if (isMounted && res.success && res.data) {
          setPost(res.data);
          setLiked(Boolean(res.data.isLiked));
          setLikesCount(res.data.likesCount || 0);
          setCommentsCount(res.data.commentsCount || 0);
        }
      } catch (err) {
        if (isMounted && !post) {
          setError(err.response?.data?.message || 'Không thể tải bài viết');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPost();
    return () => { isMounted = false; };
  }, [postId]);

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  const author = (post?.authorId && typeof post?.authorId === 'object')
    ? post.authorId
    : (post?.author || {});
  const authorId = author?._id || author?.id;

  // ── Scroll lock ──────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Escape key ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // ── Real-time socket sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !post?._id) return;

    const handleLike = (payload) => {
      if (payload.postId !== post._id) return;
      setLikesCount(payload.likesCount);
      if (payload.userId === currentUserId && payload.liked !== undefined) {
        setLiked(payload.liked);
      }
    };

    const handleNewComment = (payload) => {
      if (payload.postId === post._id) setCommentsCount(c => c + 1);
    };
    const handleNewReply = (payload) => {
      if (payload.postId === post._id) setCommentsCount(c => c + 1);
    };
    const handleCommentDeleted = (payload) => {
      if (payload.postId === post._id) {
        setCommentsCount(c => Math.max(0, c - (payload.deletedCount || 1)));
      }
    };

    socket.on('postLikeUpdated', handleLike);
    socket.on('newComment', handleNewComment);
    socket.on('newReply', handleNewReply);
    socket.on('commentDeleted', handleCommentDeleted);
    return () => {
      socket.off('postLikeUpdated', handleLike);
      socket.off('newComment', handleNewComment);
      socket.off('newReply', handleNewReply);
      socket.off('commentDeleted', handleCommentDeleted);
    };
  }, [socket, post?._id, currentUserId]);

  // ── Like handler ─────────────────────────────────────────────────────────
  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) { toast.info('Vui lòng đăng nhập!'); return; }
    if (isLiking || !post?._id) return;

    const prev = { liked, likesCount };
    const next  = !liked;
    setLiked(next);
    setLikesCount(c => Math.max(0, c + (next ? 1 : -1)));
    if (next) { setAnimating(true); setTimeout(() => setAnimating(false), 450); }

    setIsLiking(true);
    try {
      const res = await togglePostLike(post._id);
      if (res.success && res.data) {
        setLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
      }
    } catch {
      setLiked(prev.liked);
      setLikesCount(prev.likesCount);
      toast.error('Không thể thực hiện tương tác');
    } finally {
      setIsLiking(false);
    }
  };

  const images = Array.isArray(post?.imageUrl)
    ? post.imageUrl.filter(Boolean)
    : (post?.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim() ? [post.imageUrl.trim()] : []);

  // ── Navigate to theater (photo) mode ─────────────────────────────────────
  const goToPhotoView = (index = 0, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/photo/${post._id}`, {
      state: {
        backgroundLocation: location.state?.backgroundLocation || { pathname: '/posts' },
        post,
        initialIndex: typeof index === 'number' ? index : 0
      }
    });
  };

  // ── Navigate to author profile ────────────────────────────────────────────
  const goToAuthor = (e) => {
    e.stopPropagation();
    const isOwnPost = currentUser && (currentUser._id || currentUser.id)?.toString() === authorId?.toString();
    if (isOwnPost) navigate('/profile');
    else if (authorId) navigate(`/users/${authorId}`);
  };

  const formatTime = (d) => {
    if (!d) return 'Vừa xong';
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: vi }); }
    catch { return 'Vừa xong'; }
  };

  const isOwnPost = currentUser &&
    (currentUser._id || currentUser.id)?.toString() === authorId?.toString();

  return (
    <div
      className="pdm-overlay"
      onClick={handleClose}          /* click backdrop → đóng, không reload */
    >
      <div
        className="pdm-sheet"
        onClick={(e) => e.stopPropagation()} /* ngăn bubble lên overlay */
      >
        {/* ── Header ── */}
        <div className="pdm-header">
          <span className="pdm-header-title">
            {post?.title || (loading ? 'Đang tải bài viết...' : 'Chi tiết bài viết')}
          </span>
          <button
            className="pdm-close-btn"
            onClick={handleClose}
            aria-label="Đóng"
          >
            <FiX />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="pdm-body">
          {loading && !post && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <div className="pdm-spinner" style={{ margin: '0 auto 12px', width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#F0394F', borderRadius: '50%', animation: 'pdm-spin 0.8s linear infinite' }} />
              Đang tải nội dung...
            </div>
          )}

          {error && !post && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
              <p>{error}</p>
              <button
                type="button"
                onClick={handleClose}
                style={{ marginTop: '12px', padding: '6px 16px', background: '#F0394F', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Quay lại
              </button>
            </div>
          )}

          {post && (
            <>
              {/* Author */}
              <div className="pdm-author-bar">
            <div className="pdm-avatar" onClick={goToAuthor} title="Xem hồ sơ">
              {(() => {
                const url = isOwnPost
                  ? (currentUser?.avatarUrl || author?.avatarUrl)
                  : author?.avatarUrl;
                return url
                  ? <img src={url} alt="avatar" />
                  : (author?.username?.charAt(0).toUpperCase() || 'U');
              })()}
            </div>
            <div>
              <span className="pdm-author-name" onClick={goToAuthor}>
                {isOwnPost ? 'Bạn' : (author?.username || 'Ẩn danh')}
              </span>
              <span className="pdm-author-time">
                <FiClock size={11} />
                {formatTime(post.createdAt)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="pdm-content-area">
            {post.title && <h3 className="pdm-post-title">{post.title}</h3>}
            <p className="pdm-post-text">{post.content}</p>
          </div>

          {/* Images — only if exists */}
          {images.length > 0 && (
            <div style={{ padding: '0 16px', marginBottom: '12px' }}>
              <PostImageGrid
                images={images}
                onImageClick={(idx, e) => goToPhotoView(idx, e)}
                alt={post.title || 'Post image'}
              />
            </div>
          )}

          {/* Stats row */}
          {(likesCount > 0 || commentsCount > 0) && (
            <div className="pdm-stats-row">
              <div className="pdm-likes-badge">
                {likesCount > 0 && (
                  <>
                    <span className="pdm-heart-circle">
                      <FaHeart size={9} />
                    </span>
                    <span>{likesCount}</span>
                  </>
                )}
              </div>
              {commentsCount > 0 && (
                <button
                  className="pdm-comments-count-btn"
                  onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                >
                  {commentsCount} bình luận
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pdm-actions-bar">
            {/* Like */}
            <button
              className={`pdm-action-btn ${liked ? 'is-liked' : ''} ${animating ? 'animate-bounce' : ''}`}
              onClick={handleToggleLike}
              aria-label={liked ? 'Bỏ thích' : 'Thích'}
            >
              {liked
                ? <FaHeart size={16} style={{ color: '#F0394F' }} />
                : <FaRegHeart size={16} />}
              <span style={liked ? { color: '#F0394F' } : undefined}>Thích</span>
            </button>

            {/* Comment */}
            <button
              className={`pdm-action-btn ${showComments ? 'is-liked' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowComments(v => !v); }}
              aria-label="Bình luận"
            >
              <FiMessageSquare size={16} />
              <span>Bình luận</span>
            </button>

            {/* Open photo view */}
            {images.length > 0 && (
              <button
                className="pdm-action-btn"
                onClick={(e) => goToPhotoView(0, e)}
                aria-label="Xem ảnh đầy đủ"
                title="Xem ảnh đầy đủ (Theater Mode)"
              >
                <FiExternalLink size={15} />
                <span>Xem ảnh {images.length > 1 ? `(${images.length})` : ''}</span>
              </button>
            )}
          </div>

          {/* Comments */}
          {showComments && (
            <div className="pdm-comments-wrap" onClick={(e) => e.stopPropagation()}>
              <CommentSection
                postId={post._id}
                postAuthorId={post.authorId || post.author}
                currentUser={currentUser}
              />
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

