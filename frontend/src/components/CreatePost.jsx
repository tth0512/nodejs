// src/components/CreatePost.jsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import './CreatePost.css';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axiosClient.post('/posts', { title, content, imageUrl });
      navigate('/posts');
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageChange}
        />

        <div className="post-toolbar">
          <button type="button" className="upload-btn" onClick={() => fileInputRef.current?.click()}>
            Upload picture
          </button>
          {imageUrl && (
            <button type="button" className="remove-image-btn" onClick={() => setImageUrl('')}>
              Remove image
            </button>
          )}
        </div>

        {imageUrl && (
          <div className="preview-image-wrap">
            <img src={imageUrl} alt="Preview" className="preview-image" />
          </div>
        )}

        <button type="submit" className="post-submit-btn">Đăng bài</button>
      </form>
    </div>
  );
}

export default CreatePost;