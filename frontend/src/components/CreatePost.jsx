// src/components/CreatePost.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import './CreatePost.css';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axiosClient.post('/posts', { title, content });
      navigate('/posts'); // Chuyển sang xem danh sách bài viết
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đăng bài');
    }
  };

  return (
    <div className="create-post-card">
      <h3 className="create-post-title">Tạo bài viết mới</h3>
      {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}

      <form onSubmit={handleCreatePost} className="create-post-form">
        <input
          type="text"
          placeholder="Tiêu đề bài viết..."
          className="post-input-text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Bạn đang nghĩ gì thế?..."
          className="post-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" className="post-submit-btn">Đăng bài</button>
      </form>
    </div>
  );
}

export default CreatePost;