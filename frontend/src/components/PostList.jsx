// src/components/PostList.jsx
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import './PostList.css';

function PostList({ currentUser, refreshTrigger }) {
  const [postState, setPostState] = useState({
    data: [],
    loading: true,
  });

  useEffect(() => {
    let ignore = false;

    // Gọi API bất đồng bộ
    axiosClient.get('/posts')
      .then((res) => {
        if (!ignore) {
          setPostState({
            data: res.data.data,
            loading: false,
          });
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải bài viết:', err);
        if (!ignore) {
          setPostState((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      ignore = true;
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
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa bài viết');
    }
  };

  if (postState.loading) return <p style={{ textAlign: 'center' }}>Đang tải bài viết...</p>;

  return (
    <div className="post-list-container">
      <h2>Bảng tin</h2>
      {postState.data.length === 0 ? (
        <p>Chưa có bài viết nào.</p>
      ) : (
        postState.data.map((post) => {
          const canDelete =
            currentUser &&
            (currentUser.id === post.author?._id || currentUser.role === 'admin');

          return (
            <div key={post._id} className="post-item">
              <div className="post-item-header">
                <h3 className="post-item-title">{post.title}</h3>
                {canDelete && (
                  <button onClick={() => handleDelete(post._id)} className="delete-btn">
                    Xóa
                  </button>
                )}
              </div>
              <p className="post-item-content">{post.content}</p>
              <div className="post-item-footer">
                <span>Tác giả: <b>{post.author?.username || 'Ẩn danh'}</b></span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default PostList;