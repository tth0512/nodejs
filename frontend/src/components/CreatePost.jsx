// src/components/CreatePost.jsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import './CreatePost.css';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const availableSlots = 10 - imageUrls.length;
    const filesToRead = files.slice(0, Math.max(0, availableSlots));

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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axiosClient.post('/posts', { title, content, imageUrl: imageUrls });
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
          multiple
          hidden
          onChange={handleImageChange}
        />

        <div className="post-toolbar">
          <button type="button" className="upload-btn" onClick={() => fileInputRef.current?.click()}>
            {imageUrls.length > 0 ? `Thêm ảnh (${imageUrls.length}/10)` : 'Upload pictures'}
          </button>
          {imageUrls.length > 0 && (
            <button type="button" className="remove-image-btn" onClick={() => setImageUrls([])}>
              Xóa tất cả ảnh
            </button>
          )}
        </div>

        {imageUrls.length > 0 && (
          <div className="multi-preview-strip" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0' }}>
            {imageUrls.map((url, idx) => (
              <div key={idx} className="preview-thumb-wrap" style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                <img src={url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                  style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="post-submit-btn">Đăng bài</button>
      </form>
    </div>
  );
}

export default CreatePost;