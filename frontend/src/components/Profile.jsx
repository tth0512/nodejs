// src/components/Profile.jsx
import { useEffect, useRef, useState } from 'react';
import { FiEdit, FiMail, FiPlus, FiX, FiSave, FiLock, FiUsers, FiClock, FiHeart, FiMessageSquare, FiCamera } from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useAuth } from '../context/utils/useAuth.js';
import axiosClient from '../api/axiosClient.js';
import './Profile.css';
import './PostList.css';

function Profile() {
  const { currentUser, setCurrentUser } = useAuth();
  const currentDate = format(new Date(), 'EEE, dd MMMM yyyy', { locale: enUS });
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(currentUser || {});
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [coverPreview, setCoverPreview] = useState(currentUser?.coverUrl || '');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || currentUser?.username || '',
    studentId: currentUser?.studentId || '',
    major: currentUser?.major || '',
    cohort: currentUser?.cohort || '',
    skills: currentUser?.skills || '',
    interests: currentUser?.interests || '',
    privacyProfile: currentUser?.privacyProfile || 'public',
    privacyContact: currentUser?.privacyContact || 'members',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const userId = profile.id || profile._id;

  useEffect(() => {
    if (!userId) return;

    let ignore = false;
    axiosClient.get('/posts', { params: { author: userId } })
      .then((response) => {
        if (!ignore) setPosts(response.data.data || []);
      })
      .catch(() => {
        if (!ignore) setError('Unable to load your posts.');
      })
      .finally(() => {
        if (!ignore) setPostsLoading(false);
      });

    return () => { ignore = true; };
  }, [userId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName || profile.username || '',
      studentId: profile.studentId || '',
      major: profile.major || '',
      cohort: profile.cohort || '',
      skills: profile.skills || '',
      interests: profile.interests || '',
      privacyProfile: profile.privacyProfile || 'public',
      privacyContact: profile.privacyContact || 'members',
    });
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axiosClient.put('/auth/profile', formData);
      const updatedUser = { ...response.data.user };
      setProfile((previous) => ({ ...previous, ...updatedUser }));
      // Sync currentUser globally so avatars update everywhere
      setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
      setSuccess(response.data.message || 'Profile updated successfully.');
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update profile.');
    }
  };

  // Upload avatar immediately on file select
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Ảnh đại diện tối đa 2MB.');
      e.target.value = '';
      return;
    }

    // Show local preview immediately
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);

    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await axiosClient.post('/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = res.data.avatarUrl;
      setAvatarPreview(newUrl);
      setProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
      // Sync to global context immediately
      setCurrentUser((prev) => ({ ...prev, avatarUrl: newUrl }));
      toast.success('Ảnh đại diện đã được cập nhật!');
    } catch {
      toast.error('Không thể tải ảnh đại diện lên. Vui lòng thử lại.');
      setAvatarPreview(profile.avatarUrl || '');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Upload cover immediately on file select
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ảnh bìa tối đa 5MB.');
      e.target.value = '';
      return;
    }

    setCoverPreview(URL.createObjectURL(file));
    setCoverUploading(true);

    try {
      const fd = new FormData();
      fd.append('cover', file);
      const res = await axiosClient.post('/auth/cover', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = res.data.coverUrl;
      setCoverPreview(newUrl);
      setProfile((prev) => ({ ...prev, coverUrl: newUrl }));
      setCurrentUser((prev) => ({ ...prev, coverUrl: newUrl }));
      toast.success('Ảnh bìa đã được cập nhật!');
    } catch {
      toast.error('Không thể tải ảnh bìa. Vui lòng thử lại.');
      setCoverPreview(profile.coverUrl || '');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-page-header">
        <h2>Welcome, {profile.username || 'User'}</h2>
        <p>{currentDate}</p>
      </div>

      <div className="profile-card">
        {/* Cover photo with edit overlay */}
        <div
          className="profile-cover"
          style={coverPreview ? { backgroundImage: `url(${coverPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <button
            type="button"
            className="cover-upload-btn"
            title="Đổi ảnh bìa"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
          >
            <FiCamera /> {coverUploading ? 'Đang tải...' : 'Đổi ảnh bìa'}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleCoverChange}
          />
        </div>

        <div className="profile-top-section">
          {/* Avatar with camera upload overlay */}
          <div className="avatar-wrapper" style={{ position: 'relative' }}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="profile-avatar profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar">
                {(profile.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {/* Camera overlay button */}
            <button
              type="button"
              className="avatar-upload-btn"
              title="Đổi ảnh đại diện"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? '...' : <FiCamera />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </div>

          <div className="profile-titles">
            <h3>{profile.fullName || profile.username || 'User'}</h3>
            <p>{profile.email || 'email@example.com'}</p>
          </div>

          {!isEditing ? (
            <button type="button" className="edit-btn" onClick={() => setIsEditing(true)}>
              <FiEdit style={{ marginRight: '5px' }} /> Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="edit-btn cancel-btn" onClick={handleCancel} style={{ backgroundColor: '#94a3b8' }}>
                <FiX style={{ marginRight: '5px' }} /> Cancel
              </button>
              <button type="submit" form="profile-form" className="edit-btn save-btn" style={{ backgroundColor: '#10b981' }}>
                <FiSave style={{ marginRight: '5px' }} /> Save
              </button>
            </div>
          )}
        </div>

        {error && <p role="alert" style={{ color: '#dc2626', padding: '0 30px' }}>{error}</p>}
        {success && <p role="status" style={{ color: '#059669', padding: '0 30px' }}>{success}</p>}

        <form id="profile-form" className="profile-form-grid" onSubmit={handleSave}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input name="fullName" type="text" placeholder="Nhập họ và tên..." value={formData.fullName} onChange={handleChange} disabled={!isEditing} />
          </div>

          <div className="form-group">
            <label>Mã sinh viên / Cán bộ</label>
            <input name="studentId" type="text" placeholder="Nhập MSV..." value={formData.studentId} onChange={handleChange} disabled={!isEditing} />
          </div>

          <div className="form-group">
            <label>Khoa / Ngành</label>
            <select name="major" value={formData.major} onChange={handleChange} disabled={!isEditing}>
              <option value="">Chọn Khoa / Ngành...</option>
              <option value="cntt">Công nghệ thông tin</option>
              <option value="kt">Kinh tế</option>
            </select>
          </div>

          <div className="form-group">
            <label>Khóa học</label>
            <select name="cohort" value={formData.cohort} onChange={handleChange} disabled={!isEditing}>
              <option value="">Chọn khóa học...</option>
              <option value="k65">K65</option>
              <option value="k66">K66</option>
            </select>
          </div>
          <div className="form-group">
            <label>Kỹ năng</label>
            <input name="skills" type="text" placeholder="VD: React, Nodejs, Design..." value={formData.skills} onChange={handleChange} disabled={!isEditing} />
          </div>

          <div className="form-group">
            <label>Lĩnh vực quan tâm</label>
            <input name="interests" type="text" placeholder="VD: AI, Web Dev..." value={formData.interests} onChange={handleChange} disabled={!isEditing} />
          </div>
        </form>

        <section className="profile-stats" aria-label="Profile statistics">
          <div><strong>{posts.length}</strong><span>Posts</span></div>
          <div><strong>{profile.followers?.length || profile.followerCount || 0}</strong><span>Followers</span></div>
          <div><strong>{profile.following?.length || profile.followingCount || 0}</strong><span>Following</span></div>
        </section>

        <section className="profile-privacy">
          <h4 className="section-title"><FiLock /> Privacy settings</h4>
          <div className="privacy-grid">
            <label>
              Profile visibility
              <select name="privacyProfile" value={formData.privacyProfile} onChange={handleChange} disabled={!isEditing}>
                <option value="public">Everyone</option>
                <option value="members">Members only</option>
                <option value="private">Only me</option>
              </select>
            </label>
            <label>
              Contact information
              <select name="privacyContact" value={formData.privacyContact} onChange={handleChange} disabled={!isEditing}>
                <option value="public">Everyone</option>
                <option value="members">Members only</option>
                <option value="private">Only me</option>
              </select>
            </label>
          </div>
        </section>

        <section className="profile-posts">
          <h4 className="section-title"><FiUsers /> Your posts</h4>
          {postsLoading && <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading posts...</p>}
          {!postsLoading && posts.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No posts yet.</p>
          )}
          {!postsLoading && posts.length > 0 && (
            <div className="post-list" style={{ marginTop: '16px' }}>
              {posts.map((post) => {
                const isEdited = post.updatedAt && post.createdAt &&
                  new Date(post.updatedAt) - new Date(post.createdAt) > 2000;
                const displayTime = isEdited
                  ? formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true, locale: vi })
                  : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi });

                return (
                  <div key={post._id} className="post-card">
                    {/* Header */}
                    <div className="post-header">
                      <div className="post-author-info">
                        <div className="author-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                          {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : (profile.username || 'U').charAt(0).toUpperCase()
                          }
                        </div>
                        <div className="author-meta">
                          <div>
                            <span className="author-name">You</span>
                            <span className="community-name"> &gt; Cộng đồng chung</span>
                          </div>
                          <span
                            style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title={isEdited
                              ? `Đăng: ${new Date(post.createdAt).toLocaleString('vi-VN')} · Chỉnh sửa: ${new Date(post.updatedAt).toLocaleString('vi-VN')}`
                              : new Date(post.createdAt).toLocaleString('vi-VN')}
                          >
                            <FiClock /> {displayTime}
                            {isEdited && (
                              <span className="edited-badge"> · Đã chỉnh sửa</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="post-body">
                      {post.title && (
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1a1a1a' }}>{post.title}</h3>
                      )}
                      <p className="post-content">{post.content}</p>
                      {post.imageUrl && (
                        <div className="post-image-placeholder">
                          <img src={post.imageUrl} alt="Post" className="post-cover" />
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="post-actions">
                      <button className="action-btn">
                        <FiHeart className="icon" /><span>Thích</span>
                      </button>
                      <button className="action-btn">
                        <FiMessageSquare className="icon" /><span>Bình luận</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="profile-email-section">
          <h4 className="section-title">My email Address</h4>

          <div className="email-item">
            <div className="email-icon">
              <FiMail />
            </div>
            <div className="email-info">
              <p className="email-text">{profile.email || 'email@example.com'}</p>
              <span className="email-time">1 month ago</span>
            </div>
          </div>

          <button type="button" className="add-email-btn">
            <FiPlus /> Add Email Address
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;