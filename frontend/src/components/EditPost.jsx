import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient.js';
import './EditPost.css';

function EditPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axiosClient.get(`/posts/${postId}`);
        setPost(res.data.data);
        setTitle(res.data.data.title || '');
        setContent(res.data.data.content || '');
        setImageUrl(res.data.data.imageUrl || '');
      } catch (error) {
        toast.error('Không thể tải bài viết');
        navigate('/posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, navigate]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosClient.put(`/posts/${postId}`, {
        title,
        content,
        imageUrl
      });
      toast.success('Cập nhật bài viết thành công!');
      navigate('/posts');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#6b7280' }}>Đang tải bài viết...</div>;
  }

  return (
    <div className="edit-post-container">
      <div className="edit-post-card">
        <div className="edit-post-header">
          <h2>Chỉnh sửa bài viết</h2>
          <button 
            className="close-btn"
            onClick={() => navigate('/posts')}
            title="Đóng"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-post-form">
          <input
            type="text"
            placeholder="Tiêu đề bài viết..."
            className="edit-input-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Nội dung bài viết..."
            className="edit-textarea-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows="6"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          <div className="edit-image-toolbar">
            <button 
              type="button"
              className="upload-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Thay đổi ảnh
            </button>
            {imageUrl && (
              <button 
                type="button"
                className="remove-image-btn"
                onClick={() => setImageUrl('')}
              >
                Xóa ảnh
              </button>
            )}
          </div>

          {imageUrl && (
            <div className="preview-container">
              <img src={imageUrl} alt="Preview" className="preview-image" />
            </div>
          )}

          <div className="edit-post-actions">
            <button 
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/posts')}
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="save-btn"
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPost;
