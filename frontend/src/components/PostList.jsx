import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiTrash2, FiClock, FiHeart, FiMessageSquare, FiImage, FiMoreVertical, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useAuth } from '../context/utils/useAuth.js';
import { useSocket } from '../context/SocketContext.jsx';
import axiosClient from '../api/axiosClient.js';
import PostActions from './PostActions.jsx';
import CommentSection from './CommentSection.jsx';
import PostImageGrid from './PostImageGrid.jsx';
import CommunityAvatar from './community/CommunityAvatar.jsx';
import './PostList.css';

function CreatePostBox({ onPostCreated }) {
  const { currentUser } = useAuth();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast.warning(`Ảnh "${f.name}" vượt quá 5MB.`);
        return false;
      }
      return true;
    });

    if (imageUrls.length + validFiles.length > 10) {
      toast.warning('Tối đa 10 ảnh cho mỗi bài viết.');
    }

    const availableSlots = 10 - imageUrls.length;
    const filesToRead = validFiles.slice(0, Math.max(0, availableSlots));

    Promise.all(
      filesToRead.map((file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      }))
    ).then((newUrls) => {
      setImageUrls((prev) => [...prev, ...newUrls].slice(0, 10));
    });

    event.target.value = '';
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
        imageUrl: imageUrls
      });

      onPostCreated(res.data.data);

      setNewTitle('');
      setNewContent('');
      setImageUrls([]);
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

          {/* Multiple Image Previews */}
          {imageUrls.length > 0 && (
            <div className="multi-preview-strip">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="preview-thumb-wrap">
                  <img src={url} alt={`Preview ${idx + 1}`} className="preview-thumb" />
                  <button
                    type="button"
                    className="remove-thumb-btn"
                    onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove image"
                    title="Xóa ảnh này"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="create-post-bottom">
        <input
          id="post-image-upload"
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
        <label htmlFor="post-image-upload" className="attach-btn" title="Tải ảnh lên">
          <FiImage /> {imageUrls.length > 0 ? `Thêm ảnh (${imageUrls.length})` : 'Ảnh/Video'}
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
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [postState, setPostState] = useState({
    data: [],
    loading: true,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCommentPostIds, setOpenCommentPostIds] = useState(new Set());

  const toggleComments = (postId) => {
    setOpenCommentPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // Inline editing state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrls, setEditImageUrls] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editFileInputRef = useRef(null);

  const handlePostCreated = (newPost) => {
    const authorData = (newPost?.authorId && typeof newPost.authorId === 'object')
      ? newPost.authorId
      : (newPost?.author || {
        _id: currentUser?._id || currentUser?.id,
        username: currentUser?.username || 'You',
        email: currentUser?.email || '',
        avatarUrl: currentUser?.avatarUrl || ''
      });

    const normalizedPost = {
      ...newPost,
      author: authorData,
      authorId: authorData,
      createdAt: newPost?.createdAt || new Date().toISOString()
    };

    setPostState((prev) => {
      if (prev.data.some((p) => p._id === normalizedPost._id)) {
        return prev;
      }
      return {
        ...prev,
        data: [normalizedPost, ...prev.data]
      };
    });
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

    if (!socket) return () => { ignore = true; };

    // Socket.IO listeners for real-time updates
    const handleNewPost = (data) => {
      if (!ignore && data?.post) {
        const rawPost = data.post;
        const authorData = (rawPost?.authorId && typeof rawPost.authorId === 'object')
          ? rawPost.authorId
          : (rawPost?.author || {});
        const newPost = {
          ...rawPost,
          author: authorData,
          authorId: authorData
        };
        setPostState((prev) => {
          if (prev.data.some((p) => p._id === newPost._id)) return prev;
          return {
            ...prev,
            data: [newPost, ...prev.data]
          };
        });

        // Show toast notification when someone else creates a post
        const myId = currentUser?._id || currentUser?.id;
        const authorId = authorData?._id || authorData?.id;
        if (authorId && myId && authorId.toString() !== myId.toString()) {
          toast.info(`Bài viết mới từ ${authorData?.username || 'người dùng'}: "${(newPost.title || '').slice(0, 30)}..."`);
        }
        console.log('✅ New post received via Socket.IO:', newPost._id);
      }
    };

    const handlePostUpdated = (data) => {
      if (!ignore && data?.post) {
        const updatedPost = data.post;
        // Remove old post and prepend updated post to top of feed
        setPostState((prev) => ({
          ...prev,
          data: [updatedPost, ...prev.data.filter((p) => p._id !== updatedPost._id)]
        }));
        console.log('✅ Post updated via Socket.IO — moved to top:', updatedPost._id);
      }
    };

    const handlePostDeleted = (data) => {
      if (!ignore && data?.postId) {
        const postId = data.postId;
        setPostState((prev) => ({
          ...prev,
          data: prev.data.filter((p) => p._id !== postId)
        }));
        console.log('✅ Post deleted via Socket.IO:', postId);
      }
    };

    const handlePostLikeUpdated = (data) => {
      if (!ignore && data?.postId) {
        const myId = (currentUser?._id || currentUser?.userId || currentUser?.id)?.toString();
        const isMe = data.userId && myId && data.userId.toString() === myId;
        setPostState((prev) => ({
          ...prev,
          data: prev.data.map((p) =>
            p._id === data.postId
              ? {
                  ...p,
                  likesCount: data.likesCount,
                  ...(isMe && data.liked !== undefined ? { isLiked: data.liked } : {})
                }
              : p
          )
        }));
      }
    };

    const handleNewComment = (data) => {
      if (!ignore && data?.postId) {
        setPostState((prev) => ({
          ...prev,
          data: prev.data.map((p) =>
            p._id === data.postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
          )
        }));
      }
    };

    const handleNewReply = (data) => {
      if (!ignore && data?.postId) {
        setPostState((prev) => ({
          ...prev,
          data: prev.data.map((p) =>
            p._id === data.postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
          )
        }));
      }
    };

    const handleCommentDeleted = (data) => {
      if (!ignore && data?.postId) {
        const dec = data.deletedCount || 1;
        setPostState((prev) => ({
          ...prev,
          data: prev.data.map((p) =>
            p._id === data.postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || dec) - dec) } : p
          )
        }));
      }
    };

    // Attach listeners
    socket.on('newPost', handleNewPost);
    socket.on('postUpdated', handlePostUpdated);
    socket.on('postDeleted', handlePostDeleted);
    socket.on('postLikeUpdated', handlePostLikeUpdated);
    socket.on('newComment', handleNewComment);
    socket.on('newReply', handleNewReply);
    socket.on('commentDeleted', handleCommentDeleted);

    return () => {
      ignore = true;
      socket.off('newPost', handleNewPost);
      socket.off('postUpdated', handlePostUpdated);
      socket.off('postDeleted', handlePostDeleted);
      socket.off('postLikeUpdated', handlePostLikeUpdated);
      socket.off('newComment', handleNewComment);
      socket.off('newReply', handleNewReply);
      socket.off('commentDeleted', handleCommentDeleted);
    };
  }, [refreshTrigger, socket, currentUser]);

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
    const imgs = Array.isArray(post.imageUrl)
      ? post.imageUrl.filter(Boolean)
      : (post.imageUrl ? [post.imageUrl] : []);
    setEditImageUrls(imgs);
    setOpenMenuId(null);
  };

  // Cancel inline editing
  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditImageUrls([]);
  };

  // Handle image change in inline editor
  const handleEditImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast.warning(`Ảnh "${f.name}" tối đa 5MB.`);
        return false;
      }
      return true;
    });

    const availableSlots = 10 - editImageUrls.length;
    const filesToRead = validFiles.slice(0, Math.max(0, availableSlots));

    Promise.all(
      filesToRead.map((file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      }))
    ).then((newUrls) => {
      setEditImageUrls((prev) => [...prev, ...newUrls].slice(0, 10));
    });

    event.target.value = '';
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
        imageUrl: editImageUrls
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


  return (
    <div>
      <div className="post-list">
        <CreatePostBox onPostCreated={handlePostCreated} />

        {postState.data.map((post) => {
          const author = (post.authorId && typeof post.authorId === 'object')
            ? post.authorId
            : (post.author || {});
          const authorId = author?._id || author?.id;
          const myId = currentUser?._id || currentUser?.id;
          const isOwnPost = Boolean(currentUser && myId && authorId && myId.toString() === authorId.toString());

          const canEdit = isOwnPost;
          const canDelete = currentUser && (
            canEdit ||
            ['moderator', 'system_admin'].includes(currentUser.role)
          );
          const isEditing = editingPostId === post._id;

          return (
            <div
              key={post._id}
              className={`post-card${isEditing ? ' post-card--editing' : ''}`}
              onClick={() => {
                if (!isEditing) {
                  navigate(`/posts/${post._id}`, {
                    state: { backgroundLocation: location, post }
                  });
                }
              }}
            >

              {/* 1. HEADER: Thông tin tác giả và nút Dropdown Menu */}
              <div className="post-header">
                {(() => {
                  const comm = (post.communityId && typeof post.communityId === 'object') ? post.communityId : null;
                  const commName = comm?.name;
                  const commId = comm?._id || post.communityId;
                  const authorDisplayName = isOwnPost ? 'Bạn' : (author?.fullName || author?.username || 'Ẩn danh');

                  return (
                    <div className="post-author-info">
                      {/* Avatar: nếu là bài viết cộng đồng thì hiển thị avatar cộng đồng, ngược lại hiển thị avatar tác giả */}
                      {commName ? (
                        <div
                          style={{ cursor: 'pointer' }}
                          title={`Cộng đồng: ${commName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/communities/${commId}`);
                          }}
                        >
                          <CommunityAvatar
                            avatarUrl={comm.avatar}
                            name={commName}
                            size="md"
                            style={{ borderRadius: '10px' }}
                          />
                        </div>
                      ) : (
                        <div
                          className="author-avatar"
                          style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
                          title={`Xem hồ sơ của ${authorDisplayName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOwnPost) navigate('/profile');
                            else if (authorId) navigate(`/users/${authorId}`);
                          }}
                        >
                          {(() => {
                            const avatarUrl = isOwnPost
                              ? (currentUser?.avatarUrl || author?.avatarUrl)
                              : author?.avatarUrl;
                            return avatarUrl
                              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : (author?.username ? author.username.charAt(0).toUpperCase() : 'U');
                          })()}
                        </div>
                      )}

                      {/* Meta thông tin: Nếu là bài viết thuộc cộng đồng:
                          - Dòng trên: Tên cộng đồng
                          - Dòng bên dưới: Chữ bé hơn là tên tác giả bài viết + thời gian
                      */}
                      {commName ? (
                        <div className="post-comm-meta-wrap">
                          {/* Dòng trên: Tên cộng đồng */}
                          <span
                            className="post-comm-name-top"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/communities/${commId}`);
                            }}
                            title={`Xem cộng đồng ${commName}`}
                          >
                            {commName}
                          </span>

                          {/* Dòng bên dưới: Chữ bé hơn là tác giả bài viết + thời gian */}
                          <div className="post-comm-author-sub">
                            <span
                              className="post-comm-author-sub-name"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isOwnPost) navigate('/profile');
                                else if (authorId) navigate(`/users/${authorId}`);
                              }}
                              title={`Tác giả: ${authorDisplayName}`}
                            >
                              {authorDisplayName}
                            </span>
                            <span className="post-comm-dot">•</span>
                            <span
                              className="post-comm-time"
                              title={isPostEdited(post)
                                ? `Đăng: ${new Date(post.createdAt).toLocaleString('vi-VN')} · Chỉnh sửa: ${new Date(post.updatedAt).toLocaleString('vi-VN')}`
                                : new Date(post.createdAt).toLocaleString('vi-VN')}
                            >
                              <FiClock size={11} /> {isPostEdited(post) ? formatTime(post.updatedAt) : formatTime(post.createdAt)}
                            </span>
                            {isPostEdited(post) && !isEditing && (
                              <span className="edited-badge" title={`Chỉnh sửa ${formatTime(post.updatedAt)}`}>
                                · Đã chỉnh sửa
                              </span>
                            )}
                            {isEditing && <span className="editing-badge">Đang chỉnh sửa...</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="author-meta">
                          <div>
                            <span
                              className="author-name"
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isOwnPost) navigate('/profile');
                                else if (authorId) navigate(`/users/${authorId}`);
                              }}
                            >
                              {authorDisplayName}
                            </span>
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
                      )}
                    </div>
                  );
                })()}

                {/* Dropdown Menu Button — hidden while editing */}
                {canDelete && !isEditing && (
                  <div className="post-menu-container" onClick={(e) => e.stopPropagation()}>
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
                <div className="inline-edit-form" onClick={(e) => e.stopPropagation()}>
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
                    multiple
                    hidden
                    onChange={handleEditImageChange}
                  />
                  <div className="inline-edit-image-toolbar">
                    <button
                      type="button"
                      className="attach-btn"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <FiImage /> {editImageUrls.length > 0 ? `Thêm ảnh (${editImageUrls.length})` : 'Thêm ảnh'}
                    </button>
                    {editImageUrls.length > 0 && (
                      <button
                        type="button"
                        className="inline-edit-remove-img-btn"
                        onClick={() => setEditImageUrls([])}
                      >
                        Xóa tất cả ảnh
                      </button>
                    )}
                  </div>

                  {editImageUrls.length > 0 && (
                    <div className="multi-preview-strip">
                      {editImageUrls.map((url, idx) => (
                        <div key={idx} className="preview-thumb-wrap">
                          <img src={url} alt={`Preview ${idx + 1}`} className="preview-thumb" />
                          <button
                            type="button"
                            className="remove-thumb-btn"
                            onClick={() => setEditImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label="Remove image"
                            title="Xóa ảnh này"
                          >
                            ×
                          </button>
                        </div>
                      ))}
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
                    <PostImageGrid
                      images={post.imageUrl}
                      alt={post.title || 'Post Cover'}
                      onImageClick={(idx, e) => {
                        e.stopPropagation();
                        navigate(`/photo/${post._id}`, {
                          state: { backgroundLocation: location, post, initialIndex: idx }
                        });
                      }}
                    />
                  </div>

                  {/* 3. FOOTER: Các nút tương tác */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <PostActions
                      post={post}
                      currentUser={currentUser}
                      isOpenComment={openCommentPostIds.has(post._id)}
                      onCommentClick={() => toggleComments(post._id)}
                    />
                  </div>

                  {/* 4. COMMENTS: Khu vực hiển thị bình luận */}
                  {openCommentPostIds.has(post._id) && (
                    <div onClick={(e) => e.stopPropagation()}>
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
          );
        })}
      </div>
      {postState.data.length === 0 && <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!</div>}
    </div>
  );
}

export default PostList;