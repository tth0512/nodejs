// src/components/PostList.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiClock, FiHeart, FiMessageSquare, FiImage, FiMoreVertical, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useAuth } from '../context/utils/useAuth.js';
import axiosClient from '../api/axiosClient.js';
import socket from '../api/socketClient.js';
import './PostList.css';

function CreatePostBox({ onPostCreated }) {
  const { currentUser } = useAuth();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ảnh tối đa 5MB. Vui lòng chọn hình nhỏ hơn.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.warning('Vui lòng nhập đủ tiêu đề và nội dung!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/posts', {
        title: newTitle,
        content: newContent,
        imageUrl
      });

      onPostCreated(res.data.data);

      setNewTitle('');
      setNewContent('');
      setImageUrl('');
      toast.success('Đăng bài thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="post-card create-post-box">
      <div className="create-post-top">
        <div className="author-avatar">
          {currentUser.username.charAt(0).toUpperCase()}
        </div>
        <div className="create-post-inputs">
          <input
            type="text"
            className="create-input-title"
            placeholder="Tiêu đề bài viết..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="create-input-content"
            placeholder={`${currentUser.username} ơi, bạn đang nghĩ gì thế?`}
            rows="3"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          ></textarea>

          {imageUrl && (
            <div className="image-preview-container">
              <img src={imageUrl} alt="Preview" className="image-preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={() => setImageUrl('')}
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="create-post-bottom">
        <input
          id="post-image-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
        <label htmlFor="post-image-upload" className="attach-btn" title="Tải ảnh lên">
          <FiImage /> Ảnh/Video
        </label>
        <button
          className="submit-post-btn"
          onClick={handleCreatePost}
          disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
        >
          {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
        </button>
      </div>
    </div>
  );
}

function PostList({ refreshTrigger }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [postState, setPostState] = useState({
    data: [],
    loading: true,
  });
  const [openMenuId, setOpenMenuId] = useState(null);

  // Inline editing state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editFileInputRef = useRef(null);

  const handlePostCreated = (newPost) => {
    const normalizedPost = {
      ...newPost,
      author: newPost?.author?.username
        ? newPost.author
        : {
            _id: currentUser?._id || currentUser?.id,
            username: currentUser?.username || 'You',
            email: currentUser?.email || ''
          },
      createdAt: newPost?.createdAt || new Date().toISOString()
    };

    setPostState((prev) => ({
      ...prev,
      data: [normalizedPost, ...prev.data]
    }));
  };

  useEffect(() => {
    let ignore = false;

    // Initial fetch
    axiosClient.get('/posts')
      .then((res) => {
        if (!ignore) {
          setPostState({ data: res.data.data, loading: false });
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải bài viết:', err);
        if (!ignore) {
          setPostState((prev) => ({ ...prev, loading: false }));
        }
      });

    // Socket.IO listeners for real-time updates
    const handleNewPost = (data) => {
      if (!ignore) {
        const newPost = data.post;
        setPostState((prev) => ({
          ...prev,
          data: [newPost, ...prev.data]
        }));
        console.log('✅ New post received via Socket.IO:', newPost._id);
      }
    };

    const handlePostUpdated = (data) => {
      if (!ignore) {
        const updatedPost = data.post;
        // Remove the old post and prepend updated post to the top of feed
        setPostState((prev) => ({
          ...prev,
          data: [updatedPost, ...prev.data.filter((p) => p._id !== updatedPost._id)]
        }));
        console.log('✅ Post updated via Socket.IO — moved to top:', updatedPost._id);
      }
    };

    const handlePostDeleted = (data) => {
      if (!ignore) {
        const postId = data.postId;
        setPostState((prev) => ({
          ...prev,
          data: prev.data.filter((p) => p._id !== postId)
        }));
        console.log('✅ Post deleted via Socket.IO:', postId);
      }
    };

    // Attach listeners
    socket.on('newPost', handleNewPost);
    socket.on('postUpdated', handlePostUpdated);
    socket.on('postDeleted', handlePostDeleted);

    return () => {
      ignore = true;
      // Clean up socket listeners
      socket.off('newPost', handleNewPost);
      socket.off('postUpdated', handlePostUpdated);
      socket.off('postDeleted', handlePostDeleted);
    };
  }, [refreshTrigger]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await axiosClient.delete(`/posts/${postId}`);
      setPostState((prev) => ({
        ...prev,
        data: prev.data.filter((p) => p._id !== postId),
      }));
      toast.success('Đã xóa bài viết!');
      setOpenMenuId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết');
    }
  };

  // Open inline editor for a post
  const handleEdit = (post) => {
    setEditingPostId(post._id);
    setEditTitle(post.title || '');
    setEditContent(post.content || '');
    setEditImageUrl(post.imageUrl || '');
    setOpenMenuId(null);
  };

  // Cancel inline editing
  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditImageUrl('');
  };

  // Handle image change in inline editor
  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ảnh tối đa 5MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setEditImageUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // Submit inline edit
  const handleSaveEdit = async (postId) => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.warning('Vui lòng nhập đủ tiêu đề và nội dung!');
      return;
    }
    setEditSubmitting(true);
    try {
      await axiosClient.put(`/posts/${postId}`, {
        title: editTitle,
        content: editContent,
        imageUrl: editImageUrl
      });
      toast.success('Cập nhật bài viết thành công!');
      // Close editor — socket event will update + move post to top
      handleCancelEdit();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật bài viết');
    } finally {
      setEditSubmitting(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Vừa xong';
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return 'Vừa xong';
    }
  };

  // A post is considered edited if updatedAt is more than 2s after createdAt
  const isPostEdited = (post) => {
    if (!post.updatedAt || !post.createdAt) return false;
    return new Date(post.updatedAt) - new Date(post.createdAt) > 2000;
  };

  if (postState.loading) return <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>Đang tải bảng tin...</div>;
  if (postState.data.length === 0) return <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!</div>;

  return (
    <div className="post-list">
      <CreatePostBox onPostCreated={handlePostCreated} />

      {postState.data.map((post) => {
        const canEdit = currentUser &&
          (currentUser._id || currentUser.id) === (post.author?._id || post.author?.id);
        const canDelete = currentUser && (
          canEdit ||
          ['moderator', 'system_admin'].includes(currentUser.role)
        );
        const isEditing = editingPostId === post._id;

        return (
          <div key={post._id} className={`post-card${isEditing ? ' post-card--editing' : ''}`}>

            {/* 1. HEADER: Thông tin tác giả và nút Dropdown Menu */}
            <div className="post-header">
              <div className="post-author-info">
                <div
                  className="author-avatar"
                  style={{ cursor: 'pointer' }}
                  title={`Xem hồ sơ của ${post.author?.username || 'người dùng'}`}
                  onClick={() => {
                    const authorId = post.author?._id || post.author?.id;
                    const myId = currentUser?._id || currentUser?.id;
                    if (authorId && myId && authorId === myId) navigate('/profile');
                    else if (authorId) navigate(`/users/${authorId}`);
                  }}
                >
                  {post.author?.username ? post.author.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="author-meta">
                  <div>
                    <span
                      className="author-name"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const authorId = post.author?._id || post.author?.id;
                        const myId = currentUser?._id || currentUser?.id;
                        if (authorId && myId && authorId === myId) navigate('/profile');
                        else if (authorId) navigate(`/users/${authorId}`);
                      }}
                    >
                      {currentUser && (currentUser._id || currentUser.id) === (post.author?._id || post.author?.id)
                        ? 'You'
                        : (post.author?.username || 'Ẩn danh')}
                    </span>
                    <span className="community-name"> &gt; Cộng đồng chung</span>
                  </div>
                  {/* Hiển thị thời gian (x phút trước) */}
                  <span
                    style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={isPostEdited(post)
                      ? `Đăng: ${new Date(post.createdAt).toLocaleString('vi-VN')} · Chỉnh sửa: ${new Date(post.updatedAt).toLocaleString('vi-VN')}`
                      : new Date(post.createdAt).toLocaleString('vi-VN')}
                  >
                    <FiClock /> {isPostEdited(post) ? formatTime(post.updatedAt) : formatTime(post.createdAt)}
                    {isPostEdited(post) && !isEditing && (
                      <span className="edited-badge" title={`Chỉnh sửa ${formatTime(post.updatedAt)}`}>
                        · Đã chỉnh sửa
                      </span>
                    )}
                    {isEditing && <span className="editing-badge">Đang chỉnh sửa...</span>}
                  </span>
                </div>
              </div>

              {/* Dropdown Menu Button — hidden while editing */}
              {canDelete && !isEditing && (
                <div className="post-menu-container">
                  <button 
                    className="post-menu-btn" 
                    onClick={() => setOpenMenuId(openMenuId === post._id ? null : post._id)}
                    title="Tùy chọn"
                  >
                    <FiMoreVertical />
                  </button>
                  
                  {openMenuId === post._id && (
                    <div className="post-dropdown-menu">
                      {canEdit && (
                        <button 
                          className="menu-item edit"
                          onClick={() => handleEdit(post)}
                        >
                          <FiEdit2 className="menu-icon" />
                          Chỉnh sửa
                        </button>
                      )}
                      <button 
                        className="menu-item delete"
                        onClick={() => handleDelete(post._id)}
                      >
                        <FiTrash2 className="menu-icon" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INLINE EDIT FORM */}
            {isEditing ? (
              <div className="inline-edit-form">
                <input
                  type="text"
                  className="inline-edit-title"
                  placeholder="Tiêu đề bài viết..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  className="inline-edit-content"
                  placeholder="Nội dung bài viết..."
                  rows="5"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />

                {/* Image controls */}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleEditImageChange}
                />
                <div className="inline-edit-image-toolbar">
                  <button
                    type="button"
                    className="attach-btn"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <FiImage /> {editImageUrl ? 'Thay ảnh' : 'Thêm ảnh'}
                  </button>
                  {editImageUrl && (
                    <button
                      type="button"
                      className="inline-edit-remove-img-btn"
                      onClick={() => setEditImageUrl('')}
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {editImageUrl && (
                  <div className="image-preview-container">
                    <img src={editImageUrl} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => setEditImageUrl('')}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="inline-edit-actions">
                  <button
                    type="button"
                    className="inline-cancel-btn"
                    onClick={handleCancelEdit}
                    disabled={editSubmitting}
                  >
                    <FiX /> Hủy
                  </button>
                  <button
                    type="button"
                    className="inline-save-btn"
                    onClick={() => handleSaveEdit(post._id)}
                    disabled={editSubmitting || !editTitle.trim() || !editContent.trim()}
                  >
                    <FiCheck /> {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 2. BODY: Nội dung chữ và Ảnh đính kèm */}
                <div className="post-body">
                  {post.title && <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1a1a1a' }}>{post.title}</h3>}
                  <p className="post-content">{post.content}</p>
                  {post.imageUrl && (
                    <div className="post-image-placeholder">
                      <img src={post.imageUrl} alt="Post Cover" className="post-cover" />
                    </div>
                  )}
                </div>

                {/* 3. FOOTER: Các nút tương tác */}
                <div className="post-actions">
                  <button className="action-btn">
                    <FiHeart className="icon" />
                    <span>Thích</span>
                  </button>
                  <button className="action-btn">
                    <FiMessageSquare className="icon" />
                    <span>Bình luận</span>
                  </button>
                </div>

                {/* 4. COMMENTS: Mockup hiển thị bình luận */}
                <div className="post-comments-section">
                  <span className="comments-title">Comments:</span>
                  <div className="comment-item">
                    <div className="comment-avatar">E</div>
                    <div className="comment-bubble">
                      <h5 className="comment-author">Elon Musk</h5>
                      <p className="comment-text">Tuyệt vời! Ý tưởng rất hay.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        );
      })}
    </div>
  );
}

export default PostList;