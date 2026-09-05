// src/components/ProfilePage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiLock,
  FiUser,
  FiGrid,
  FiCalendar,
  FiAward,
  FiBookOpen,
  FiMail,
  FiClock,
  FiHeart,
  FiMessageSquare,
  FiCode,
  FiCompass,
  FiShield,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/utils/useAuth.js';
import FollowButton from './FollowButton.jsx';
import FollowList from './FollowList.jsx';
import FollowRequests from './FollowRequests.jsx';
import './ProfilePage.css';
import './PostList.css';

const MAJOR_LABELS = {
  cntt: 'Công nghệ thông tin',
  kt: 'Kinh tế',
};

const PRIVACY_LABELS = {
  public: 'Mọi người (Public)',
  members: 'Chỉ thành viên',
  private: 'Chỉ mình tôi',
};

function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isOwnProfile = Boolean(
    currentUser && (currentUser._id === userId || currentUser.id === userId)
  );

  const [user, setUser] = useState(isOwnProfile ? currentUser : null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'posts'
  const [followListMode, setFollowListMode] = useState(null); // 'followers' | 'following' | null

  // Fetch user details
  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axiosClient.get(`/auth/users/${userId}`);
      setUser(res.data.user);
    } catch (err) {
      setError('Không tìm thấy thông tin người dùng.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch posts by author
  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;
    setPostsLoading(true);
    try {
      const res = await axiosClient.get('/posts', { params: { author: userId } });
      setPosts(res.data.data || []);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchUserData();
    fetchUserPosts();
  }, [userId, fetchUserData, fetchUserPosts]);

  // Format relative timestamp
  const formatTime = (dateString) => {
    if (!dateString) return 'Vừa xong';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return 'Vừa xong';
    }
  };

  const isPostEdited = (post) => {
    if (!post.updatedAt || !post.createdAt) return false;
    return new Date(post.updatedAt) - new Date(post.createdAt) > 2000;
  };

  // Parse comma or space-separated tags into array
  const parseTags = (str) => {
    if (!str) return [];
    return str
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  if (loading && !user) {
    return (
      <div className="profile-page-container">
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Đang tải hồ sơ...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-page-container">
        <div className="profile-nav-back">
          <button className="profile-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Quay lại
          </button>
        </div>
        <div className="profile-main-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', fontSize: '16px' }}>{error || 'Không tìm thấy người dùng.'}</p>
        </div>
      </div>
    );
  }

  const joinedDate = user.createdAt
    ? format(new Date(user.createdAt), 'MMMM yyyy', { locale: enUS })
    : '';

  const skillsList = parseTags(user.skills);
  const interestsList = parseTags(user.interests);

  const canViewContact =
    isOwnProfile ||
    user.privacyContact === 'public' ||
    (user.privacyContact === 'members' && currentUser);

  const hasAnyInfo = Boolean(
    user.bio ||
      user.studentId ||
      user.major ||
      user.cohort ||
      skillsList.length > 0 ||
      interestsList.length > 0 ||
      (canViewContact && user.email)
  );

  return (
    <div className="profile-page-container">
      {/* Back button if viewing someone else */}
      {!isOwnProfile && (
        <div className="profile-nav-back">
          <button className="profile-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Quay lại
          </button>
        </div>
      )}

      {/* Main unified card */}
      <div className="profile-main-card">
        {/* Cover banner (LinkedIn inspiration) */}
        <div
          className="profile-cover-banner"
          style={
            user.coverUrl
              ? { backgroundImage: `url(${user.coverUrl})` }
              : {}
          }
        >
          <div className="profile-cover-overlay" />
        </div>

        {/* Profile Header Content */}
        <div className="profile-header-content">
          {/* Avatar & Action Row */}
          <div className="profile-avatar-action-row">
            {/* Overlapping Avatar */}
            <div className="profile-avatar-wrapper">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || user.username}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {(user.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Actions: Edit Profile (owner) or Follow Button (visitor) */}
            <div className="profile-actions">
              {isOwnProfile ? (
                <Link to="/profile/edit" className="profile-btn profile-btn-primary">
                  <FiEdit /> Chỉnh sửa hồ sơ
                </Link>
              ) : (
                currentUser && (
                  <FollowButton
                    targetUserId={userId}
                    targetUsername={user.username}
                    onStatusChange={fetchUserData}
                  />
                )
              )}
            </div>
          </div>

          {/* Identity & Professional Bio */}
          <div className="profile-identity">
            <div className="profile-name-row">
              <h1 className="profile-fullname">{user.fullName || user.username}</h1>
              {user.isPrivate && (
                <span className="profile-private-badge" title="Tài khoản riêng tư">
                  <FiLock /> Riêng tư
                </span>
              )}
            </div>
            <p className="profile-username">@{user.username}</p>

            {/* Professional Bio */}
            {user.bio && (
              <div className="profile-bio-box">
                <p className="profile-bio-text">{user.bio}</p>
              </div>
            )}

            {/* Meta Row: Major, Cohort, Joined date */}
            <div className="profile-meta-row">
              {user.major && (
                <span className="profile-meta-item">
                  <FiAward /> {MAJOR_LABELS[user.major] || user.major}
                </span>
              )}
              {user.cohort && (
                <span className="profile-meta-item">
                  <FiBookOpen /> {user.cohort.toUpperCase()}
                </span>
              )}
              {joinedDate && (
                <span className="profile-meta-item">
                  <FiCalendar /> Tham gia tháng {joinedDate}
                </span>
              )}
            </div>
          </div>

          {/* Social Metrics Bar (Instagram inspiration - Clickable counts) */}
          <div className="profile-metrics-bar" aria-label="Chỉ số tương tác">
            <div
              className="metric-item interactive"
              onClick={() => setActiveTab('posts')}
              title="Xem bài viết"
            >
              <strong>{posts.length}</strong>
              <span>Bài viết</span>
            </div>

            <div
              className="metric-item interactive"
              onClick={() => setFollowListMode('followers')}
              title="Xem danh sách Followers"
            >
              <strong>{user.followers?.length || 0}</strong>
              <span>Followers</span>
            </div>

            <div
              className="metric-item interactive"
              onClick={() => setFollowListMode('following')}
              title="Xem danh sách Following"
            >
              <strong>{user.following?.length || 0}</strong>
              <span>Following</span>
            </div>
          </div>
        </div>

        {/* Follow Requests panel (for private account owner) */}
        {isOwnProfile && user.isPrivate && (
          <div className="profile-pending-requests-card">
            <FollowRequests />
          </div>
        )}

        {/* Tab Bar (Instagram inspiration) */}
        <div className="profile-tabs-nav">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <FiUser /> Thông tin cá nhân
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <FiGrid /> Bài viết
            <span className="profile-tab-count">{posts.length}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="profile-tab-content">
          {activeTab === 'info' && (
            <div className="profile-info-grid">
              {!hasAnyInfo ? (
                <div className="info-card full-width profile-empty-state">
                  <FiInfo />
                  <p>Người dùng chưa cập nhật thông tin cá nhân.</p>
                </div>
              ) : (
                <>
                  {/* Academic / Organization Info */}
                  {(user.studentId || user.major || user.cohort || (canViewContact && user.email)) && (
                    <div className="info-card">
                      <div className="info-card-header">
                        <h3 className="info-card-title">
                          <FiBookOpen /> Học vấn & Liên hệ
                        </h3>
                      </div>
                      <div className="info-fields-list">
                        {user.studentId && (
                          <div className="info-field-item">
                            <span className="info-field-label">Mã sinh viên / Cán bộ</span>
                            <span className="info-field-value">{user.studentId}</span>
                          </div>
                        )}
                        {user.major && (
                          <div className="info-field-item">
                            <span className="info-field-label">Khoa / Ngành</span>
                            <span className="info-field-value">
                              {MAJOR_LABELS[user.major] || user.major}
                            </span>
                          </div>
                        )}
                        {user.cohort && (
                          <div className="info-field-item">
                            <span className="info-field-label">Khóa học</span>
                            <span className="info-field-value">{user.cohort.toUpperCase()}</span>
                          </div>
                        )}
                        {canViewContact && user.email && (
                          <div className="info-field-item">
                            <span className="info-field-label">Email liên hệ</span>
                            <span className="info-field-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <FiMail style={{ color: '#3b82f6' }} /> {user.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills Cloud */}
                  {skillsList.length > 0 && (
                    <div className="info-card">
                      <div className="info-card-header">
                        <h3 className="info-card-title">
                          <FiCode /> Kỹ năng chuyên môn
                        </h3>
                      </div>
                      <div className="tags-cloud">
                        {skillsList.map((skill, idx) => (
                          <span key={idx} className="tag-badge skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests Cloud */}
                  {interestsList.length > 0 && (
                    <div className="info-card">
                      <div className="info-card-header">
                        <h3 className="info-card-title">
                          <FiCompass /> Lĩnh vực quan tâm
                        </h3>
                      </div>
                      <div className="tags-cloud">
                        {interestsList.map((interest, idx) => (
                          <span key={idx} className="tag-badge interest-tag">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Owner-only Privacy Summary */}
                  {isOwnProfile && (
                    <div className="info-card full-width">
                      <div className="info-card-header">
                        <h3 className="info-card-title">
                          <FiShield /> Trạng thái quyền riêng tư
                        </h3>
                        <Link
                          to="/profile/edit"
                          style={{ fontSize: '13px', color: 'var(--primary-color, #f0394f)', fontWeight: '600', textDecoration: 'none' }}
                        >
                          Thay đổi cài đặt
                        </Link>
                      </div>
                      <div className="privacy-summary-row">
                        <div className="privacy-summary-item">
                          <div className="privacy-summary-label">Hiển thị hồ sơ</div>
                          <div className="privacy-summary-val">
                            {PRIVACY_LABELS[user.privacyProfile] || 'Mọi người'}
                          </div>
                        </div>
                        <div className="privacy-summary-item">
                          <div className="privacy-summary-label">Thông tin liên hệ</div>
                          <div className="privacy-summary-val">
                            {PRIVACY_LABELS[user.privacyContact] || 'Chỉ thành viên'}
                          </div>
                        </div>
                        <div className="privacy-summary-item">
                          <div className="privacy-summary-label">Chế độ tài khoản</div>
                          <div className="privacy-summary-val">
                            {user.isPrivate ? 'Riêng tư (Cần duyệt follow)' : 'Công khai'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="profile-posts-wrapper">
              {postsLoading && (
                <div className="posts-feed-loading">Đang tải bài viết...</div>
              )}

              {!postsLoading && posts.length === 0 && (
                <div className="profile-empty-state">
                  <FiGrid />
                  <p>Chưa có bài viết nào.</p>
                </div>
              )}

              {!postsLoading && posts.length > 0 && (
                <div className="post-list">
                  {posts.map((post) => {
                    const isEdited = isPostEdited(post);
                    const displayTime = isEdited
                      ? formatTime(post.updatedAt)
                      : formatTime(post.createdAt);

                    return (
                      <div key={post._id} className="post-card">
                        {/* Header */}
                        <div className="post-header">
                          <div className="post-author-info">
                            <div className="author-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt="avatar"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%',
                                  }}
                                />
                              ) : (
                                (user.username || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="author-meta">
                              <div>
                                <span className="author-name">
                                  {isOwnProfile ? 'Bạn' : user.fullName || user.username}
                                </span>
                                <span className="community-name"> &gt; Cộng đồng chung</span>
                              </div>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title={
                                  isEdited
                                    ? `Đăng: ${new Date(post.createdAt).toLocaleString('vi-VN')} · Chỉnh sửa: ${new Date(post.updatedAt).toLocaleString('vi-VN')}`
                                    : new Date(post.createdAt).toLocaleString('vi-VN')
                                }
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
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1a1a1a' }}>
                              {post.title}
                            </h3>
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
                            <FiHeart className="icon" />
                            <span>Thích</span>
                          </button>
                          <button className="action-btn">
                            <FiMessageSquare className="icon" />
                            <span>Bình luận</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FollowList Modal (Clicking Followers / Following counts) */}
      {followListMode && (
        <FollowList
          userId={userId}
          mode={followListMode}
          onClose={() => setFollowListMode(null)}
        />
      )}
    </div>
  );
}

export default ProfilePage;
