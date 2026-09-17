// frontend/src/components/admin/AdminOverview.jsx
import React, { useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboardStats();
      if (res.data?.success) setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="admin-feed">
        <div className="admin-loading"><div className="a-spinner"></div> Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="admin-feed">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tổng quan hệ thống</h2>
        <button className="a-btn" onClick={fetchStats}>🔄 Làm mới</button>
      </div>

      {/* Stat Cards */}
      <div className="admin-stat-row">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Tổng người dùng</div>
          <div className="admin-stat-value">{stats?.totalUsers ?? 0}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Hoạt động: {stats?.activeUsers ?? 0} · Bị khóa: {stats?.lockedUsers ?? 0}
          </div>
        </div>
        <div className="admin-stat-card info">
          <div className="admin-stat-label">Bài viết</div>
          <div className="admin-stat-value">{stats?.totalPosts ?? 0}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Hiển thị: {stats?.activePosts ?? 0} · Ẩn: {stats?.hiddenPosts ?? 0}
          </div>
        </div>
        <div className="admin-stat-card warn">
          <div className="admin-stat-label">Tài khoản bị khóa</div>
          <div className="admin-stat-value">{stats?.lockedUsers ?? 0}</div>
        </div>
        <div className="admin-stat-card muted">
          <div className="admin-stat-label">Bài viết bị ẩn</div>
          <div className="admin-stat-value">{stats?.hiddenPosts ?? 0}</div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">👥 Người dùng mới đăng ký</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentUsers?.length > 0 ? stats.recentUsers.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="a-user-cell">
                      <img className="a-avatar" src={u.avatarUrl || 'https://via.placeholder.com/32'} alt="" />
                      <div>
                        <div className="a-user-name">{u.fullName || u.username}</div>
                        <div className="a-user-sub">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#6b7280' }}>{u.email}</td>
                  <td><span className={`a-badge ${u.role}`}>{u.role}</span></td>
                  <td><span className={`a-badge ${u.status}`}>{u.status === 'active' ? '● Hoạt động' : '● Bị khóa'}</span></td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="admin-empty">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">📝 Bài viết mới nhất</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tác giả</th>
                <th>Nội dung</th>
                <th>Chủ đề</th>
                <th>Ngày đăng</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentPosts?.length > 0 ? stats.recentPosts.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="a-user-cell">
                      <img className="a-avatar" src={p.authorId?.avatarUrl || 'https://via.placeholder.com/32'} alt="" />
                      <span className="a-user-name">{p.authorId?.username || 'Ẩn danh'}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.content}
                  </td>
                  <td>
                    {p.topic
                      ? <span style={{ color: '#2563eb', fontSize: 12 }}>#{p.topic}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>
                    }
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="admin-empty">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
