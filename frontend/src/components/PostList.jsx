// src/components/PostList.jsx
import { useEffect, useState } from 'react';
import { FiTrash2, FiClock, FiHeart, FiMessageSquare, FiImage } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient.js';
import './PostList.css'; // Đảm bảo bạn đã đưa CSS vào file này hoặc App.css

function CreatePostBox({ currentUser, onPostCreated }) {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.warning('Vui lòng nhập đủ tiêu đề và nội dung!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/posts', { 
        title: newTitle, 
        content: newContent 
      });
      
      // Gọi hàm callback từ component cha truyền xuống để đẩy bài mới lên top
      onPostCreated(res.data.data);

      setNewTitle('');
      setNewContent('');
      toast.success('Đăng bài thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khách chưa đăng nhập thì không render khung này
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
        </div>
      </div>
      <div className="create-post-bottom">
        <button className="attach-btn" title="Chức năng đang phát triển">
          <FiImage /> Ảnh/Video
        </button>
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

function PostList({ currentUser, refreshTrigger }) {
  const [postState, setPostState] = useState({
    data: [],
    loading: true,
  });

  const handlePostCreated = (newPost) => {
    setPostState((prev) => ({
      ...prev,
      data: [newPost, ...prev.data]
    }));
  };

  useEffect(() => {
    let ignore = false;

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

    return () => { ignore = true; };
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết');
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

  if (postState.loading) return <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>Đang tải bảng tin...</div>;
  if (postState.data.length === 0) return <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!</div>;

  return (
    <div className="post-list">
      <CreatePostBox 
        currentUser={currentUser} 
        onPostCreated={handlePostCreated} 
      />

      {postState.data.map((post) => {
        const canDelete = currentUser && (
          (currentUser._id || currentUser.id) === (post.author?._id || post.author?.id) ||
          ['moderator', 'system_admin'].includes(currentUser.role)
        );

        return (
          <div key={post._id} className="post-card">
            
            {/* 1. HEADER: Thông tin tác giả và nút Xóa */}
            <div className="post-header">
              <div className="post-author-info">
                <div className="author-avatar">
                  {post.author?.username ? post.author.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="author-meta">
                  <div>
                    <span className="author-name">
                      {currentUser && (currentUser._id || currentUser.id) === (post.author?._id || post.author?.id)
                        ? 'You' 
                        : (post.author?.username || 'Ẩn danh')}
                    </span>
                    <span className="community-name"> &gt; Cộng đồng chung</span>
                  </div>
                  {/* Hiển thị thời gian (x phút trước) */}
                  <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }} title={post.createdAt}>
                    <FiClock /> {formatTime(post.createdAt)}
                  </span>
                </div>
              </div>

              {canDelete && (
                <button onClick={() => handleDelete(post._id)} className="delete-btn" title="Xóa bài viết">
                  <FiTrash2 />
                </button>
              )}
            </div>

            {/* 2. BODY: Nội dung chữ và Ảnh đính kèm */}
            <div className="post-body">
              {/* Giữ lại hiển thị Tiêu đề bài viết */}
              {post.title && <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1a1a1a' }}>{post.title}</h3>}
              
              <p className="post-content">{post.content}</p>
              
              {/* Placeholder cho ảnh bìa */}
              <div className="post-image-placeholder">
                <img 
                  src={`https://picsum.photos/seed/${post._id}/800/400`} 
                  alt="Post Cover" 
                  className="post-cover"
                />
              </div>
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

          </div>
        );
      })}
    </div>
  );
}

export default PostList;