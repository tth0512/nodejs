// frontend/src/components/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';

const UserManagement = ({ currentAdmin }) => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // History modal
  const [historyOpen, setHistoryOpen]         = useState(false);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [historyData, setHistoryData]         = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  /* ─── Fetch ─── */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({ search, role: roleFilter, status: statusFilter, page, limit: 8 });
      if (res.data?.success) {
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.totalPages);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi tải người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter, statusFilter, page]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ─── Lock / Unlock ─── */
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'locked' : 'active';
    if (!window.confirm(`${newStatus === 'locked' ? 'Khóa' : 'Mở khóa'} tài khoản @${user.username}?`)) return;
    try {
      const res = await adminApi.updateUserStatus(user._id, newStatus);
      if (res.data?.success) {
        showToast(res.data.message);
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  /* ─── Change Role ─── */
  const handleChangeRole = async (user, newRole) => {
    if (user.role === newRole) return;
    try {
      const res = await adminApi.updateUserRole(user._id, newRole);
      if (res.data?.success) {
        showToast(`Đã đổi vai trò @${user.username} thành ${newRole}`);
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  /* ─── Action History ─── */
  const handleOpenHistory = async (userId) => {
    try {
      setHistoryLoading(true);
      setHistoryOpen(true);
      const res = await adminApi.getUserActionHistory(userId);
      if (res.data?.success) setHistoryData(res.data.data);
    } catch (err) {
      showToast('Không thể tải lịch sử', 'error');
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const adminId = currentAdmin?._id || currentAdmin?.id;

  return (
    <div className="admin-feed">
      {/* Toast */}
      {toast && <div className={`a-toast ${toast.type}`}>{toast.text}</div>}

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">👥 Quản lý Người dùng</h3>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Tổng: <strong>{totalCount}</strong></span>
        </div>

        {/* Filter bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-wrap">
            <span className="admin-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên, email, username..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="admin-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả vai trò</option>
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="group_admin">Group Admin</option>
            <option value="system_admin">System Admin</option>
          </select>
          <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Tham gia</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="admin-loading"><div className="a-spinner"></div>Đang tải...</div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="admin-empty"><div className="admin-empty-icon">👤</div>Không tìm thấy người dùng.</td></tr>
              ) : users.map(u => {
                const isSelf = u._id === adminId;
                return (
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
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{u.email}</td>
                    <td>
                      <select
                        className="a-role-select"
                        value={u.role}
                        disabled={isSelf}
                        onChange={e => handleChangeRole(u, e.target.value)}
                      >
                        <option value="member">member</option>
                        <option value="moderator">moderator</option>
                        <option value="group_admin">group_admin</option>
                        <option value="system_admin">system_admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`a-badge ${u.status}`}>
                        {u.status === 'active' ? '● Hoạt động' : '● Bị khóa'}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div className="a-btn-group">
                        <button
                          className={`a-btn ${u.status === 'active' ? 'danger' : 'success'}`}
                          onClick={() => handleToggleStatus(u)}
                          disabled={isSelf}
                          title={isSelf ? 'Không thể tự khóa tài khoản mình' : ''}
                        >
                          {u.status === 'active' ? '🔒 Khóa' : '🔓 Mở khóa'}
                        </button>
                        <button className="a-btn" onClick={() => handleOpenHistory(u._id)}>
                          📜 Lịch sử
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="admin-pagination">
            <span>Trang {page}/{totalPages} · {totalCount} kết quả</span>
            <div className="admin-pagination-controls">
              <button className="a-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>◀ Trước</button>
              <button className="a-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau ▶</button>
            </div>
          </div>
        )}
      </div>

      {/* ── History Modal ── */}
      {historyOpen && (
        <div className="a-modal-overlay" onClick={() => setHistoryOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()}>
            <div className="a-modal-header">
              <h3>
                Lịch sử hoạt động
                {historyData?.user && ` — @${historyData.user.username}`}
              </h3>
              <button className="a-modal-close" onClick={() => setHistoryOpen(false)}>×</button>
            </div>

            <div className="a-modal-body">
              {historyLoading ? (
                <div className="admin-loading"><div className="a-spinner"></div>Đang tải...</div>
              ) : historyData ? (
                <>
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f9fafb', padding: 14, borderRadius: 10, marginBottom: 20 }}>
                    <img className="a-avatar" style={{ width: 48, height: 48 }} src={historyData.user?.avatarUrl || 'https://via.placeholder.com/48'} alt="" />
                    <div>
                      <div className="a-user-name">{historyData.user?.fullName} (@{historyData.user?.username})</div>
                      <div className="a-user-sub">{historyData.user?.email}</div>
                      <div style={{ marginTop: 4 }}>
                        <span className={`a-badge ${historyData.user?.status}`}>{historyData.user?.status}</span>
                        {' '}
                        <span className={`a-badge ${historyData.user?.role}`}>{historyData.user?.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Posts */}
                  <div className="a-history-section">
                    <h4>📝 Bài viết gần đây ({historyData.recentPosts?.length || 0})</h4>
                    {historyData.recentPosts?.length > 0 ? historyData.recentPosts.map(p => (
                      <div key={p._id} className="a-history-item">
                        <div className="a-history-item-meta">
                          <span>Trạng thái: <strong>{p.status}</strong></span>
                          <span>{new Date(p.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div>{p.content}</div>
                        {p.topic && <div style={{ fontSize: 12, color: '#2563eb', marginTop: 2 }}>#{p.topic}</div>}
                      </div>
                    )) : <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa đăng bài viết nào.</div>}
                  </div>

                  {/* Recent Follows */}
                  <div className="a-history-section">
                    <h4>🤝 Đang theo dõi ({historyData.recentFollows?.length || 0})</h4>
                    {historyData.recentFollows?.length > 0 ? historyData.recentFollows.map(f => (
                      <div key={f._id} className="a-history-item" style={{ borderLeftColor: '#059669' }}>
                        <div className="a-history-item-meta">
                          <span>Theo dõi <strong>@{f.followingId?.username}</strong></span>
                          <span>{new Date(f.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    )) : <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa theo dõi ai.</div>}
                  </div>
                </>
              ) : null}
            </div>

            <div className="a-modal-footer">
              <button className="a-btn" onClick={() => setHistoryOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
