// frontend/src/components/PhotoModal.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiArrowLeft, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getPostById } from '../api/postApi.js';
import { useAuth } from '../context/utils/useAuth.js';
import PostActions from './PostActions.jsx';
import CommentSection from './CommentSection.jsx';
import './PhotoModal.css';

export default function PhotoModal({ post: initialPostProp }) {
  const { postId: paramPostId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const postId = initialPostProp?._id || paramPostId || location.state?.post?._id;
  const initialPost = initialPostProp || location.state?.post || null;

  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState(true);

  // Close handler: navigate back to feed without page reload
  const handleClose = useCallback(() => {
    if (location.state?.backgroundLocation) {
      navigate(-1);
    } else {
      navigate('/posts');
    }
  }, [location.state, navigate]);

  // Lock body scroll while modal is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Fetch post details if not provided or to ensure fresh data
  useEffect(() => {
    if (!postId) return;
    let isMounted = true;

    const fetchPost = async () => {
      try {
        const res = await getPostById(postId);
        if (isMounted && res.success && res.data) {
          setPost(res.data);
        }
      } catch (err) {
        if (isMounted && !post) {
          setError(err.response?.data?.message || 'Không thể tải ảnh bài viết');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPost();
    return () => { isMounted = false; };
  }, [postId]);

  const author = (post?.authorId && typeof post?.authorId === 'object')
    ? post.authorId
    : (post?.author || {});
  const authorId = author?._id || author?.id;
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const isOwnPost = Boolean(currentUserId && authorId && currentUserId === authorId.toString());

  const formatTime = (d) => {
    if (!d) return 'Vừa xong';
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true, locale: vi });
    } catch {
      return 'Vừa xong';
    }
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (isOwnPost) navigate('/profile');
    else if (authorId) navigate(`/users/${authorId}`);
  };

  return (
    <div className="photo-theater-overlay" onClick={handleClose}>
      {/* ── Left Column: Media Stage (Image view) ── */}
      <div
        className="photo-stage"
        onClick={(e) => {
          // If clicked directly on the stage background (outside the image), close modal
          if (e.target === e.currentTarget || e.target.classList.contains('photo-stage-img-wrap')) {
            handleClose();
          }
        }}
      >
        {/* Floating Back/Close button */}
        <button
          className="photo-stage-btn"
          onClick={handleClose}
          title="Đóng (Esc)"
          aria-label="Đóng"
        >
          <FiArrowLeft />
        </button>

        {loading && !post && (
          <div className="photo-spinner" />
        )}

        {post?.imageUrl ? (
          <div className="photo-stage-img-wrap">
            <img
              src={post.imageUrl}
              alt={post.title || 'Post image'}
              className="photo-stage-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          !loading && (
            <div style={{ color: '#94a3b8', fontSize: '15px' }}>
              Bài viết không có ảnh đính kèm
            </div>
          )
        )}
      </div>

      {/* ── Right Column: Sidebar (Author info + Post + Comments) ── */}
      <div
        className="photo-sidebar"
        onClick={(e) => e.stopPropagation()} /* Ngăn click vào panel làm đóng modal */
      >
        {/* Sidebar Header */}
        <div className="photo-sidebar-header">
          <div className="photo-author-row" onClick={handleAuthorClick}>
            <div className="photo-author-avatar">
              {(() => {
                const avatar = isOwnPost
                  ? (currentUser?.avatarUrl || author?.avatarUrl)
                  : author?.avatarUrl;
                return avatar
                  ? <img src={avatar} alt="avatar" />
                  : (author?.username ? author.username.charAt(0).toUpperCase() : 'U');
              })()}
            </div>
            <div className="photo-author-meta">
              <span className="photo-author-name">
                {isOwnPost ? 'Bạn' : (author?.username || 'Ẩn danh')}
              </span>
              <span className="photo-author-time">
                <FiClock size={11} />
                {formatTime(post?.createdAt)}
              </span>
            </div>
          </div>

          <button
            className="photo-close-btn"
            onClick={handleClose}
            title="Đóng"
            aria-label="Đóng"
          >
            <FiX />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="photo-sidebar-scroll">
          {error && !post ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#ef4444' }}>
              <p>{error}</p>
              <button
                type="button"
                onClick={handleClose}
                style={{ marginTop: '12px', padding: '6px 16px', background: '#F0394F', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Quay lại
              </button>
            </div>
          ) : post ? (
            <>
              {/* Post Title & Content */}
              {(post.title || post.content) && (
                <div className="photo-post-content">
                  {post.title && <h2 className="photo-post-title">{post.title}</h2>}
                  {post.content && <p className="photo-post-text">{post.content}</p>}
                </div>
              )}

              {/* Interaction Bar (Like & Comment) */}
              <div className="photo-actions-wrap">
                <PostActions
                  post={post}
                  currentUser={currentUser}
                  isOpenComment={showComments}
                  onCommentClick={() => setShowComments((prev) => !prev)}
                />
              </div>

              {/* Comment Section */}
              {showComments && (
                <div className="photo-comments-container">
                  <CommentSection
                    postId={post._id}
                    postAuthorId={post.authorId || post.author}
                    currentUser={currentUser}
                  />
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
