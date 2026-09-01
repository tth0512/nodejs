// src/components/Profile.jsx
import { useEffect, useState } from 'react';
import { FiEdit, FiMail, FiPlus, FiX, FiSave, FiLock, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '../context/utils/useAuth.js';
import axiosClient from '../api/axiosClient.js';
import './Profile.css';

function Profile() {
  const { currentUser } = useAuth();
  const currentDate = format(new Date(), 'EEE, dd MMMM yyyy', { locale: enUS });
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(currentUser || {});
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
      setProfile((previous) => ({ ...previous, ...response.data.user }));
      setSuccess(response.data.message || 'Profile updated successfully.');
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update profile.');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-page-header">
        <h2>Welcome, {profile.username || 'User'}</h2>
        <p>{currentDate}</p>
      </div>

      <div className="profile-card">
        <div className="profile-cover"></div>

        <div className="profile-top-section">
          <div className="avatar-wrapper">
            <div className="profile-avatar">
              {(profile.username || 'U').charAt(0).toUpperCase()}
            </div>
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
          {postsLoading && <p>Loading posts...</p>}
          {!postsLoading && posts.length === 0 && <p>No posts yet.</p>}
          {!postsLoading && posts.map((post) => (
            <article className="profile-post" key={post._id}>
              <h5>{post.title}</h5>
              <p>{post.content}</p>
              <time dateTime={post.createdAt}>{post.createdAt ? format(new Date(post.createdAt), 'dd MMM yyyy') : ''}</time>
            </article>
          ))}
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