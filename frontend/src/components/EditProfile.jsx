// src/components/EditProfile.jsx
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCamera,
  FiSave,
  FiX,
  FiUser,
  FiBookOpen,
  FiShield,
  FiLock,
  FiSlash,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/utils/useAuth.js';
import axiosClient from '../api/axiosClient.js';
import BlockList from './BlockList.jsx';
import './EditProfile.css';

function EditProfile() {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || currentUser?.username || '',
    bio: currentUser?.bio || '',
    studentId: currentUser?.studentId || '',
    major: currentUser?.major || '',
    cohort: currentUser?.cohort || '',
    skills: currentUser?.skills || '',
    interests: currentUser?.interests || '',
    privacyProfile: currentUser?.privacyProfile || 'public',
    privacyContact: currentUser?.privacyContact || 'members',
    isPrivate: currentUser?.isPrivate || false,
  });

  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || '');
  const avatarInputRef = useRef(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(currentUser?.coverUrl || '');
  const coverInputRef = useRef(null);

  const [showBlockList, setShowBlockList] = useState(false);

  const myProfilePath = currentUser?._id ? `/users/${currentUser._id}` : '/';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Select new avatar: preview locally, DO NOT upload until Save is clicked
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Ảnh đại diện tối đa 2MB.');
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Select new cover: preview locally, DO NOT upload until Save is clicked
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ảnh bìa tối đa 5MB.');
      e.target.value = '';
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let latestUser = { ...currentUser };

      // 1. Upload avatar only if a new file was chosen
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const avatarRes = await axiosClient.post('/auth/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (avatarRes.data?.user) {
          latestUser = { ...latestUser, ...avatarRes.data.user };
        }
      }

      // 2. Upload cover only if a new file was chosen
      if (coverFile) {
        const fd = new FormData();
        fd.append('cover', coverFile);
        const coverRes = await axiosClient.post('/auth/cover', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (coverRes.data?.user) {
          latestUser = { ...latestUser, ...coverRes.data.user };
        }
      }

      // 3. Update profile fields
      const res = await axiosClient.put('/auth/profile', formData);
      const updatedUser = { ...latestUser, ...res.data.user };
      setCurrentUser(updatedUser);
      toast.success('Cập nhật hồ sơ thành công!');
      navigate(myProfilePath);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editprofile-container">
      {/* Top navigation */}
      <div className="editprofile-header-nav">
        <Link to={myProfilePath} className="editprofile-back-btn">
          <FiArrowLeft /> Quay lại hồ sơ
        </Link>
      </div>

      {/* Main card */}
      <div className="editprofile-card">
        {/* Cover image editor */}
        <div
          className="editprofile-cover-area"
          style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : {}}
        >
          <button
            type="button"
            className="editprofile-cover-upload-btn"
            onClick={() => coverInputRef.current?.click()}
            disabled={saving}
          >
            <FiCamera /> Đổi ảnh bìa
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCoverChange}
          />
        </div>

        {/* Avatar editor */}
        <div className="editprofile-avatar-area">
          <div className="editprofile-avatar-wrapper">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="editprofile-avatar-img" />
            ) : (
              <div className="editprofile-avatar-placeholder">
                {(currentUser?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              className="editprofile-avatar-btn"
              title="Đổi ảnh đại diện"
              onClick={() => avatarInputRef.current?.click()}
              disabled={saving}
            >
              <FiCamera />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <div className="editprofile-avatar-hint">
            <h3>{formData.fullName || currentUser?.username}</h3>
            <p>Nhấp vào biểu tượng camera để thay đổi ảnh đại diện</p>
          </div>
        </div>

        {/* Form Body */}
        <form className="editprofile-form" onSubmit={handleSubmit}>
          {/* Section 1: Basic & Bio */}
          <div className="editprofile-section-title">
            <FiUser /> Thông tin cơ bản & Giới thiệu
          </div>

          <div className="editprofile-grid">
            <div className="form-field full-col">
              <label>
                Họ và tên
                <span className="field-hint">Tên hiển thị công khai trên hồ sơ</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Nhập họ và tên đầy đủ..."
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="form-field full-col">
              <label>
                Giới thiệu bản thân (Bio)
                <span className="field-hint">Đoạn giới thiệu ngắn xuất hiện dưới tên bạn (LinkedIn style)</span>
              </label>
              <textarea
                name="bio"
                placeholder="VD: Sinh viên ngành CNTT tại UET | Đam mê Fullstack Development & Trí tuệ nhân tạo..."
                value={formData.bio}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          {/* Section 2: Education & Skills */}
          <div className="editprofile-section-title">
            <FiBookOpen /> Học vấn & Kỹ năng
          </div>

          <div className="editprofile-grid">
            <div className="form-field">
              <label>Mã sinh viên / Cán bộ</label>
              <input
                type="text"
                name="studentId"
                placeholder="VD: 22020000"
                value={formData.studentId}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Khoa / Ngành</label>
              <select name="major" value={formData.major} onChange={handleChange}>
                <option value="">Chọn Khoa / Ngành...</option>
                <option value="cntt">Công nghệ thông tin</option>
                <option value="kt">Kinh tế</option>
              </select>
            </div>

            <div className="form-field">
              <label>Khóa học</label>
              <select name="cohort" value={formData.cohort} onChange={handleChange}>
                <option value="">Chọn khóa học...</option>
                <option value="k65">K65</option>
                <option value="k66">K66</option>
                <option value="k67">K67</option>
                <option value="k68">K68</option>
                <option value="k69">K69</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Kỹ năng chuyên môn
                <span className="field-hint">Cách nhau bởi dấu phẩy</span>
              </label>
              <input
                type="text"
                name="skills"
                placeholder="VD: React, Node.js, Python, UI/UX"
                value={formData.skills}
                onChange={handleChange}
              />
            </div>

            <div className="form-field full-col">
              <label>
                Lĩnh vực quan tâm
                <span className="field-hint">Cách nhau bởi dấu phẩy</span>
              </label>
              <input
                type="text"
                name="interests"
                placeholder="VD: Web Development, Trí tuệ nhân tạo, Thiết kế sản phẩm"
                value={formData.interests}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section 3: Privacy & Security */}
          <div className="editprofile-section-title">
            <FiShield /> Quyền riêng tư & Bảo mật
          </div>

          <div className="editprofile-grid">
            <div className="form-field">
              <label>Ai có thể xem hồ sơ của bạn?</label>
              <select
                name="privacyProfile"
                value={formData.privacyProfile}
                onChange={handleChange}
              >
                <option value="public">Mọi người (Public)</option>
                <option value="members">Chỉ thành viên đăng nhập</option>
                <option value="private">Chỉ mình tôi</option>
              </select>
            </div>

            <div className="form-field">
              <label>Ai có thể xem thông tin liên hệ (Email)?</label>
              <select
                name="privacyContact"
                value={formData.privacyContact}
                onChange={handleChange}
              >
                <option value="public">Mọi người (Public)</option>
                <option value="members">Chỉ thành viên đăng nhập</option>
                <option value="private">Chỉ mình tôi</option>
              </select>
            </div>
          </div>

          {/* Private Account Toggle */}
          <div className="privacy-toggle-card">
            <div className="privacy-toggle-info">
              <div className="privacy-toggle-title">
                <FiLock /> Chế độ tài khoản riêng tư
              </div>
              <p className="privacy-toggle-desc">
                Khi bật, người khác cần gửi yêu cầu theo dõi và phải được bạn phê duyệt trước khi theo dõi bạn.
              </p>
            </div>
            <label className="switch-label">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Collapsible Block List */}
          <div className="editprofile-blocked-section">
            <div
              className="editprofile-blocked-header"
              onClick={() => setShowBlockList(!showBlockList)}
            >
              <h4>
                <FiSlash /> Quản lý người dùng đã chặn
              </h4>
              {showBlockList ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showBlockList && (
              <div className="editprofile-blocked-body">
                <BlockList />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="editprofile-actions-bar">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(myProfilePath)}
              disabled={saving}
            >
              <FiX style={{ marginRight: '4px' }} /> Hủy
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              <FiSave /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
