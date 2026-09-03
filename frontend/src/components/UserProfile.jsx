// src/components/UserProfile.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiClock, FiHeart, FiMessageSquare, FiLock } from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/utils/useAuth.js';
import FollowButton from './FollowButton.jsx';
import FollowList from './FollowList.jsx';
import './Profile.css';
import './PostList.css';

const MAJOR_LABELS = {
  cntt: 'Công nghệ thông tin',
  kt: 'Kinh tế',
};

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [followListMode, setFollowListMode] = useState(null); // 'followers' | 'following' | null

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');

    axiosClient.get(`/auth/users/${userId}`)
      .then((res) => setUser(res.data.user))
      .catch(() => setError('Không tìm thấy người dùng.'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setPostsLoading(true);

    axiosClient.get('/posts', { params: { author: userId } })
      .then((res) => setPosts(res.data.data || []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, [userId]);

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

  if (loading) {
    return (
      <div className="profile-container">
        <p style={{ color: '#64748b', marginTop: '40px', textAlign: 'center' }}>Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-container">
        <button className="userprofile-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Quay lại
        </button>
        <p style={{ color: '#dc2626', marginTop: '20px' }}>{error || 'Không tìm thấy người dùng.'}</p>
      </div>
    );
  }

  const joinedDate = user.createdAt
    ? format(new Date(user.createdAt), 'MMMM yyyy', { locale: enUS })
    : '';

  return (
    <div className="profile-container">
      {/* Back button */}
      <div className="profile-page-header">
        <button className="userprofile-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Quay lại
        </button>
        <h2 style={{ marginTop: '12px' }}>Hồ sơ của {user.username}</h2>
        {joinedDate && <p>Tham gia từ {joinedDate}</p>}
      </div>

      <div className="profile-card">
        {/* Cover gradient */}
        <div className="profile-cover" />

        {/* Top: avatar + name + Follow button */}
        <div className="profile-top-section">
          <div className="avatar-wrapper">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="profile-avatar profile-avatar-img" />
            ) : (
              <div className="profile-avatar">
                {(user.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-titles">
            <h3>
              {user.fullName || user.username}
              {user.isPrivate && <FiLock title="Tài khoản riêng tư" style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '14px' }} />}
            </h3>
            <p>@{user.username}</p>
            {currentUser && currentUser._id !== userId && (
              <div style={{ marginTop: '10px' }}>
                <FollowButton targetUserId={userId} targetUsername={user.username} />
              </div>
            )}
          </div>
        </div>

        {/* Stats — clickable */}
        <section className="profile-stats" aria-label="Thống kê">
          <div><strong>{posts.length}</strong><span>Bài viết</span></div>
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => setFollowListMode('followers')}
            title="Xem followers"
          >
            <strong>{user.followers?.length || 0}</strong><span>Followers</span>
          </div>
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => setFollowListMode('following')}
            title="Xem following"
          >
            <strong>{user.following?.length || 0}</strong><span>Following</span>
          </div>
        </section>

        {/* Info fields — read-only, shown only if filled */}
        {(user.studentId || user.major || user.cohort || user.skills || user.interests) && (
          <div className="profile-form-grid" style={{ paddingBottom: '10px' }}>
            {user.studentId && (
              <div className="form-group">
                <label>Mã sinh viên / Cán bộ</label>
                <input type="text" value={user.studentId} disabled />
              </div>
            )}
            {user.major && (
              <div className="form-group">
                <label>Khoa / Ngành</label>
                <input type="text" value={MAJOR_LABELS[user.major] || user.major} disabled />
              </div>
            )}
            {user.cohort && (
              <div className="form-group">
                <label>Khóa học</label>
                <input type="text" value={user.cohort.toUpperCase()} disabled />
              </div>
            )}
            {user.skills && (
              <div className="form-group">
                <label>Kỹ năng</label>
                <input type="text" value={user.skills} disabled />
              </div>
            )}
            {user.interests && (
              <div className="form-group">
                <label>Lĩnh vực quan tâm</label>
                <input type="text" value={user.interests} disabled />
              </div>
            )}
          </div>
        )}

        {/* Their posts */}
        <section className="profile-posts" style={{ paddingTop: '10px' }}>
          <h4 className="section-title"><FiUsers /> Bài viết của {user.username}</h4>

          {postsLoading && <p style={{ color: '#94a3b8', fontSize: '14px' }}>Đang tải bài viết...</p>}
          {!postsLoading && posts.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chưa có bài viết nào.</p>
          )}

          {!postsLoading && posts.length > 0 && (
            <div className="post-list" style={{ marginTop: '16px' }}>
              {posts.map((post) => (
                <div key={post._id} className="post-card">
                  {/* Header */}
                  <div className="post-header">
                    <div className="post-author-info">
                      <div
                        className="author-avatar"
                        style={{ overflow: 'hidden', padding: 0 }}
                      >
                        {user.avatarUrl
                          ? <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : user.username.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="author-meta">
                        <div>
                          <span className="author-name">{user.username}</span>
                          <span className="community-name"> &gt; Cộng đồng chung</span>
                        </div>
                        <span
                          style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title={isPostEdited(post)
                            ? `Đăng: ${new Date(post.createdAt).toLocaleString('vi-VN')} · Chỉnh sửa: ${new Date(post.updatedAt).toLocaleString('vi-VN')}`
                            : new Date(post.createdAt).toLocaleString('vi-VN')}
                        >
                          <FiClock /> {isPostEdited(post) ? formatTime(post.updatedAt) : formatTime(post.createdAt)}
                          {isPostEdited(post) && (
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
              ))}
            </div>
          )}
        </section>
      </div>

      {/* FollowList Modal */}
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

export default UserProfile;
