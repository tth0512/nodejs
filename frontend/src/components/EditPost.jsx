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
  const [imageUrls, setImageUrls] = useState([]);
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
        const imgs = Array.isArray(res.data.data.imageUrl)
          ? res.data.data.imageUrl.filter(Boolean)
          : (res.data.data.imageUrl ? [res.data.data.imageUrl] : []);
        setImageUrls(imgs);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosClient.put(`/posts/${postId}`, {
        title,
        content,
        imageUrl: imageUrls
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
            multiple
            hidden
            onChange={handleImageChange}
          />

          <div className="edit-image-toolbar">
            <button 
              type="button"
              className="upload-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {imageUrls.length > 0 ? `Thêm ảnh (${imageUrls.length}/10)` : 'Thêm ảnh'}
            </button>
            {imageUrls.length > 0 && (
              <button 
                type="button"
                className="remove-image-btn"
                onClick={() => setImageUrls([])}
              >
                Xóa tất cả ảnh
              </button>
            )}
          </div>

          {imageUrls.length > 0 && (
            <div className="multi-preview-strip" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0' }}>
              {imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
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
