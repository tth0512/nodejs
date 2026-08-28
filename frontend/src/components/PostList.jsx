// src/components/PostList.jsx
import { useEffect, useState } from 'react';
import { FiTrash2, FiUser, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale'; // Hỗ trợ định dạng tiếng Việt
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient.js';
import './PostList.css';

function PostList({ currentUser, refreshTrigger }) {
  const [postState, setPostState] = useState({
    data: [],
    loading: true,
  });

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

  // Hàm chuyển đổi timestamp thành định dạng "x phút trước"
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

  if (postState.loading) return <p style={{ textAlign: 'center' }}>Đang tải bài viết...</p>;

  return (
    <div className="post-list-container">
      <h2 className="post-list-header">Bảng tin</h2>
      {postState.data.length === 0 ? (
        <p>Chưa có bài viết nào.</p>
      ) : (
        postState.data.map((post) => {
          const canDelete = currentUser && (
            (
              (currentUser.id && post.author?.id && currentUser.id === post.author?.id) ||
              (currentUser._id && post.author?._id && currentUser._id === post.author?._id)
            ) ||
            ['moderator', 'system_admin'].includes(currentUser.role)
          );

          return (
            <div key={post._id} className="post-item">
              <div className="post-item-header">
                <h3 className="post-item-title">{post.title}</h3>
                {canDelete && (
                  <button onClick={() => handleDelete(post._id)} className="delete-btn" title="Xóa bài">
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <p className="post-item-content">{post.content}</p>

              {/* Phần thông tin chân bài viết */}
              <div className="post-item-footer">
                <span className="post-author-info">
                  <FiUser /> Tác giả: <b>{post.author?.username || 'Ẩn danh'}</b>
                </span>

                <span className="post-time-info" title={post.createdAt}>
                  <FiClock /> {formatTime(post.createdAt)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default PostList;