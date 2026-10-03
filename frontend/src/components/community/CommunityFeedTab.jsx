// frontend/src/components/community/CommunityFeedTab.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiImage, FiLock, FiX, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { createCommunityPost, joinCommunity } from '../../api/communityApi.js';
import PostActions from '../PostActions.jsx';
import CommentSection from '../CommentSection.jsx';
import PostImageGrid from '../PostImageGrid.jsx';
import './CommunityFeedTab.css';

/* ── Form Đăng Bài Riêng Cho Cộng Đồng ── */
function CommunityCreatePostBox({ community, currentUser, onPostCreated }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]); // File objects
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast.warning(`Ảnh "${f.name}" vượt quá 5MB.`);
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > 10) {
      toast.warning('Tối đa 10 ảnh cho mỗi bài viết.');
      return;
    }

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      toast.info('Vui lòng nhập nội dung hoặc đính kèm ảnh!');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('privacy', community?.privacy || 'public');

      images.forEach((img) => {
        formData.append('images', img);
      });

      const res = await createCommunityPost(community._id, formData);
      if (res.success && res.data) {
        toast.success('Đã đăng bài viết vào cộng đồng!');
        setContent('');
        setImages([]);
        setImagePreviews([]);
        onPostCreated?.(res.data);
      } else {
        toast.error(res.message || 'Không thể đăng bài viết.');
      }
    } catch (err) {
      console.error('Error creating community post:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comm-create-box">
      <div className="comm-create-top">
        <div className="comm-user-avatar">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="Avatar" />
          ) : (
            <span>{currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}</span>
          )}
        </div>
        <textarea
          className="comm-create-input"
          placeholder={`Chia sẻ suy nghĩ, tài liệu với cộng đồng ${community?.name}...`}
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* Preview ảnh đính kèm */}
      {imagePreviews.length > 0 && (
        <div className="comm-create-previews">
          {imagePreviews.map((url, idx) => (
            <div key={idx} className="comm-create-thumb-item">
              <img src={url} alt={`Preview ${idx + 1}`} />
              <button
                type="button"
                className="comm-thumb-remove"
                onClick={() => handleRemoveImage(idx)}
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer hành động */}
      <div className="comm-create-footer">
        <label className="comm-attach-btn" title="Thêm tối đa 10 ảnh">
          <FiImage size={18} />
          <span>Thêm ảnh ({images.length}/10)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: 'none' }}
            disabled={images.length >= 10 || isSubmitting}
          />
        </label>

        <button
          type="button"
          className="comm-submit-post-btn"
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && images.length === 0)}
        >
          {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
        </button>
      </div>
    </div>
  );
}

/* ── Feed Tab Chính ── */
export default function CommunityFeedTab({
  community,
  posts = [],
  isMember,
  currentUser,
  onPostCreated,
  onMembershipChange
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCommentPostIds, setOpenCommentPostIds] = useState(new Set());
  const [joining, setJoining] = useState(false);

  const toggleComments = (postId) => {
    setOpenCommentPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      const res = await joinCommunity(community._id);
      if (res.success) {
        onMembershipChange?.(true, res.memberCount);
      }
    } catch (err) {
      console.error('Error joining:', err);
    } finally {
      setJoining(false);
    }
  };

  // Nếu cộng đồng riêng tư và người dùng chưa tham gia -> Không hiển thị feed
  if (community?.privacy === 'private' && !isMember) {
    return (
      <div className="comm-private-locked-card">
        <div className="comm-locked-icon">
          <FiLock size={42} />
        </div>
        <h3>Cộng đồng riêng tư</h3>
        <p>
          Các bài viết và thảo luận trong cộng đồng <strong>{community?.name}</strong> chỉ dành cho các thành viên. Hãy tham gia để khám phá!
        </p>
        <button
          type="button"
          className="comm-btn-join-private"
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? 'Đang tham gia...' : 'Tham gia cộng đồng'}
        </button>
      </div>
    );
  }

  return (
    <div className="comm-feed-tab">
      {/* ── 1. Create Post Box (nếu đã là thành viên) ── */}
      {isMember ? (
        <CommunityCreatePostBox
          community={community}
          currentUser={currentUser}
          onPostCreated={onPostCreated}
        />
      ) : (
        <div className="comm-join-prompt-box">
          <p>Tham gia cộng đồng để đăng bài và tương tác cùng các thành viên.</p>
          <button type="button" className="comm-btn-join-sm" onClick={handleJoin} disabled={joining}>
            {joining ? 'Đang tham gia...' : 'Tham gia nhóm'}
          </button>
        </div>
      )}

      {/* ── 2. Danh Sách Bài Viết ── */}
      {posts.length === 0 ? (
        <div className="comm-feed-empty">
          <p>Chưa có bài viết nào trong cộng đồng này. Hãy là người đầu tiên chia sẻ!</p>
        </div>
      ) : (
        <div className="comm-posts-stream">
          {posts.map((post) => {
            const author = (post.authorId && typeof post.authorId === 'object')
              ? post.authorId
              : (post.author || {});
            const authorId = author._id || author.id;
            const timeAgo = post.createdAt
              ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })
              : 'Vừa xong';

            return (
              <div key={post._id} className="comm-post-card">
                {/* Header bài viết */}
                <div className="comm-post-header">
                  <div
                    className="comm-post-author-avatar"
                    onClick={() => authorId && navigate(`/users/${authorId}`)}
                  >
                    {author.avatarUrl ? (
                      <img src={author.avatarUrl} alt="Avatar" />
                    ) : (
                      <span>{author.username ? author.username.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div className="comm-post-author-meta">
                    <span
                      className="comm-post-author-name"
                      onClick={() => authorId && navigate(`/users/${authorId}`)}
                    >
                      {author.fullName || author.username || 'Thành viên'}
                    </span>
                    <span className="comm-post-time">
                      <FiClock size={12} /> {timeAgo}
                    </span>
                  </div>
                </div>

                {/* Nội dung bài viết */}
                <div className="comm-post-body">
                  {post.content && <p className="comm-post-text">{post.content}</p>}

                  {/* Lưới ảnh bài viết */}
                  <PostImageGrid
                    images={post.imageUrl}
                    alt={post.title || 'Community post'}
                    onImageClick={(idx, e) => {
                      e.stopPropagation();
                      navigate(`/photo/${post._id}`, {
                        state: {
                          backgroundLocation: location,
                          post,
                          initialIndex: idx
                        }
                      });
                    }}
                  />
                </div>

                {/* Footer tương tác */}
                <div className="comm-post-footer">
                  <PostActions
                    post={post}
                    currentUser={currentUser}
                    isOpenComment={openCommentPostIds.has(post._id)}
                    onCommentClick={() => toggleComments(post._id)}
                  />
                </div>

                {/* Phần bình luận */}
                {openCommentPostIds.has(post._id) && (
                  <div className="comm-post-comments-area">
                    <CommentSection
                      postId={post._id}
                      postAuthorId={author}
                      currentUser={currentUser}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
