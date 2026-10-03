// frontend/src/components/PhotoModal.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiArrowLeft, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

  // Normalize images array
  const images = Array.isArray(post?.imageUrl)
    ? post.imageUrl.filter(Boolean)
    : (post?.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim() ? [post.imageUrl.trim()] : []);

  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(Math.max(0, images.length - 1), Number(location.state?.initialIndex) || 0))
  );

  // Sync index if location.state changes
  useEffect(() => {
    if (location.state?.initialIndex !== undefined) {
      setCurrentIndex(Math.max(0, Math.min(Math.max(0, images.length - 1), Number(location.state.initialIndex) || 0)));
    }
  }, [location.state?.initialIndex, images.length]);

  // Close handler: navigate back to feed without page reload
  const handleClose = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (location.state?.backgroundLocation) {
      navigate(location.state.backgroundLocation);
    } else {
      navigate('/posts');
    }
  }, [location.state, navigate]);

  // Navigate images
  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Lock body scroll while modal is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard navigation: Escape to close, ArrowLeft / ArrowRight to switch photo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (images.length > 1) {
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handlePrev, handleNext, images.length]);

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

  const currentImageSrc = images[currentIndex] || images[0];

  return (
    <div
      className="photo-theater-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(e);
        }
      }}
    >
      {/* ── Left Column: Media Stage (Image view) ── */}
      <div
        className="photo-stage"
        onClick={(e) => {
          // If clicked directly on stage background, close modal
          if (e.target === e.currentTarget || e.target.classList.contains('photo-stage-img-wrap')) {
            handleClose(e);
          }
        }}
      >
        {/* Floating Back/Close button */}
        <button
          className="photo-stage-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleClose(e);
          }}
          title="Đóng (Esc)"
          aria-label="Đóng"
        >
          <FiArrowLeft />
        </button>

        {/* Counter badge */}
        {images.length > 1 && (
          <div className="photo-counter-badge">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Prev / Next buttons */}
        {images.length > 1 && (
          <>
            <button
              className="photo-nav-btn photo-nav-prev"
              onClick={handlePrev}
              title="Ảnh trước (←)"
              aria-label="Ảnh trước"
            >
              <FiChevronLeft />
            </button>
            <button
              className="photo-nav-btn photo-nav-next"
              onClick={handleNext}
              title="Ảnh tiếp theo (→)"
              aria-label="Ảnh tiếp theo"
            >
              <FiChevronRight />
            </button>
          </>
        )}

        {loading && !post && (
          <div className="photo-spinner" />
        )}

        {currentImageSrc ? (
          <div className="photo-stage-img-wrap">
            <img
              key={currentImageSrc}
              src={currentImageSrc}
              alt={post.title || `Photo ${currentIndex + 1}`}
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

        {/* Thumbnails bar */}
        {images.length > 1 && (
          <div className="photo-thumbs-bar" onClick={(e) => e.stopPropagation()}>
            {images.map((src, i) => (
              <div
                key={i}
                className={`photo-thumb-item ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                title={`Ảnh ${i + 1}`}
              >
                <img src={src} alt={`Thumbnail ${i + 1}`} />
              </div>
            ))}
          </div>
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
