// frontend/src/components/community/CreateCommunityModal.jsx
import React, { useState } from 'react';
import { FiX, FiUploadCloud, FiLock, FiGlobe, FiImage } from 'react-icons/fi';
import { createCommunity } from '../../api/communityApi.js';
import CommunityAvatar from './CommunityAvatar.jsx';
import './CreateCommunityModal.css';

export default function CreateCommunityModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Kích thước ảnh đại diện tối đa là 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh bìa tối đa là 5MB');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên cộng đồng!');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng nhập mô tả cho cộng đồng!');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('privacy', privacy);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      const res = await createCommunity(formData);
      if (res.success && res.data) {
        onCreated?.(res.data);
        onClose?.();
      } else {
        setError(res.message || 'Không thể tạo cộng đồng. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error('Error creating community:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo cộng đồng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="cc-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="cc-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cc-modal-header">
          <div className="cc-modal-title-group">
            <h3>Tạo Cộng Đồng Mới</h3>
            <p>Kết nối những người cùng sở thích, lớp học và chuyên môn</p>
          </div>
          <button
            type="button"
            className="cc-modal-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <FiX />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="cc-modal-body">
          {error && <div className="cc-modal-error">{error}</div>}

          {/* Cover Preview & Upload */}
          <div className="cc-form-group">
            <label className="cc-label">Ảnh bìa (Tùy chọn)</label>
            <div className="cc-cover-dropzone">
              {coverPreview ? (
                <div className="cc-cover-preview-box">
                  <img src={coverPreview} alt="Cover preview" className="cc-cover-preview-img" />
                  <button type="button" className="cc-remove-media-btn" onClick={removeCover}>
                    <FiX /> Xóa ảnh bìa
                  </button>
                </div>
              ) : (
                <label className="cc-upload-label">
                  <FiImage size={24} />
                  <span>Chọn ảnh bìa ngang (Tối đa 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Avatar Preview & Upload */}
          <div className="cc-form-group">
            <label className="cc-label">Ảnh đại diện cộng đồng</label>
            <div className="cc-avatar-upload-row">
              <div className="cc-avatar-preview-wrap">
                <CommunityAvatar
                  avatarUrl={avatarPreview}
                  name={name || 'Cộng đồng'}
                  size="xl"
                />
              </div>
              <div className="cc-avatar-upload-info">
                <p className="cc-avatar-hint">
                  {avatarPreview
                    ? 'Đã tải lên ảnh đại diện'
                    : 'Nếu không tải ảnh lên, hệ thống sẽ tự động dùng chữ cái đầu trên nền đen.'}
                </p>
                <div className="cc-avatar-actions">
                  <label className="cc-btn-select-file">
                    <FiUploadCloud size={16} />
                    <span>{avatarPreview ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="cc-btn-remove-avatar"
                      onClick={removeAvatar}
                    >
                      Dùng avatar nền đen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tên cộng đồng */}
          <div className="cc-form-group">
            <label className="cc-label" htmlFor="comm-name">
              Tên cộng đồng <span className="required">*</span>
            </label>
            <input
              id="comm-name"
              type="text"
              className="cc-input"
              placeholder="VD: Journalism, Data Science, K67 UET..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {/* Mô tả */}
          <div className="cc-form-group">
            <label className="cc-label" htmlFor="comm-desc">
              Mô tả cộng đồng <span className="required">*</span>
            </label>
            <textarea
              id="comm-desc"
              className="cc-textarea"
              rows={4}
              placeholder="Chia sẻ về mục đích, các hoạt động và quy tắc chính của cộng đồng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              required
            />
            <div className="cc-char-count">{description.length}/1000</div>
          </div>

          {/* Quyền riêng tư */}
          <div className="cc-form-group">
            <label className="cc-label">Quyền riêng tư</label>
            <div className="cc-privacy-grid">
              <label
                className={`cc-privacy-option ${privacy === 'public' ? 'active' : ''}`}
                onClick={() => setPrivacy('public')}
              >
                <div className="cc-privacy-radio">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={privacy === 'public'}
                    onChange={() => setPrivacy('public')}
                  />
                </div>
                <div className="cc-privacy-icon">
                  <FiGlobe />
                </div>
                <div className="cc-privacy-text">
                  <strong>Công khai</strong>
                  <span>Bất kỳ ai cũng có thể xem và tham gia cộng đồng.</span>
                </div>
              </label>

              <label
                className={`cc-privacy-option ${privacy === 'private' ? 'active' : ''}`}
                onClick={() => setPrivacy('private')}
              >
                <div className="cc-privacy-radio">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={privacy === 'private'}
                    onChange={() => setPrivacy('private')}
                  />
                </div>
                <div className="cc-privacy-icon">
                  <FiLock />
                </div>
                <div className="cc-privacy-text">
                  <strong>Riêng tư</strong>
                  <span>Chỉ thành viên được duyệt mới có thể xem bảng tin bài viết.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="cc-modal-footer">
            <button
              type="button"
              className="cc-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="cc-btn-submit"
              disabled={loading || !name.trim() || !description.trim()}
            >
              {loading ? 'Đang tạo...' : 'Tạo Cộng Đồng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
