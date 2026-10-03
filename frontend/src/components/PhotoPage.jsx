// frontend/src/components/PhotoPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getPostById } from '../api/postApi.js';
import { useAuth } from '../context/utils/useAuth.js';
import PostActions from './PostActions.jsx';
import CommentSection from './CommentSection.jsx';
import './PhotoPage.css';

export default function PhotoPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images array
  const images = Array.isArray(post?.imageUrl)
    ? post.imageUrl.filter(Boolean)
    : (post?.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim() ? [post.imageUrl.trim()] : []);

  useEffect(() => {
    let isMounted = true;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await getPostById(postId);
        if (isMounted && res.success && res.data) {
          setPost(res.data);
        } else if (isMounted) {
          setError('Không tìm thấy bài viết');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không thể tải bài viết');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPost();
    return () => { isMounted = false; };
  }, [postId]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (images.length > 1) {
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, images.length]);

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

  if (loading) {
    return (
      <div className="photo-page-loading">
        <div className="photo-spinner" />
        <span>Đang tải hình ảnh bài viết...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="photo-page-error">
        <h2>{error || 'Không tìm thấy bài viết'}</h2>
        <button
          type="button"
          className="photo-page-nav-back"
          style={{ position: 'static' }}
          onClick={() => navigate('/posts')}
        >
          <FiArrowLeft /> Về bảng tin
        </button>
      </div>
    );
  }

  return (
    <div className="photo-page-container">
      {/* ── Media Stage ── */}
      <div className="photo-page-stage">
        <button
          type="button"
          className="photo-page-nav-back"
          onClick={() => navigate('/posts')}
        >
          <FiArrowLeft /> Về bảng tin
        </button>

        {/* Counter badge */}
        {images.length > 1 && (
          <div className="photo-page-counter-badge">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              className="photo-page-nav-btn photo-page-nav-prev"
              onClick={handlePrev}
              title="Ảnh trước (←)"
              aria-label="Ảnh trước"
            >
              <FiChevronLeft />
            </button>
            <button
              className="photo-page-nav-btn photo-page-nav-next"
              onClick={handleNext}
              title="Ảnh tiếp theo (→)"
              aria-label="Ảnh tiếp theo"
            >
              <FiChevronRight />
            </button>
          </>
        )}

        {currentImageSrc ? (
          <div className="photo-page-img-wrap">
            <img
              key={currentImageSrc}
              src={currentImageSrc}
              alt={post.title || `Post image ${currentIndex + 1}`}
              className="photo-page-image"
            />
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '15px' }}>
            Bài viết không có hình ảnh đính kèm
          </div>
        )}

        {/* Thumbnails bar */}
        {images.length > 1 && (
          <div className="photo-page-thumbs-bar">
            {images.map((src, i) => (
              <div
                key={i}
                className={`photo-page-thumb-item ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                title={`Ảnh ${i + 1}`}
              >
                <img src={src} alt={`Thumbnail ${i + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <div className="photo-page-sidebar">
        <div className="photo-page-header">
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
                {formatTime(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="photo-page-scroll">
          {(post.title || post.content) && (
            <div className="photo-post-content">
              {post.title && <h2 className="photo-post-title">{post.title}</h2>}
              {post.content && <p className="photo-post-text">{post.content}</p>}
            </div>
          )}

          <div className="photo-actions-wrap">
            <PostActions
              post={post}
              currentUser={currentUser}
              isOpenComment={showComments}
              onCommentClick={() => setShowComments((v) => !v)}
            />
          </div>

          {showComments && (
            <div className="photo-comments-container">
              <CommentSection
                postId={post._id}
                postAuthorId={post.authorId || post.author}
                currentUser={currentUser}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
