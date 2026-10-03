// frontend/src/components/admin/PostManagement.jsx
import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';

const PostManagement = () => {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Preview modal
  const [selectedPost, setSelectedPost] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  /* ─── Fetch ─── */
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPosts({ search, status: statusFilter, page, limit: 8 });
      if (res.data?.success) {
        setPosts(res.data.data.posts);
        setTotalPages(res.data.data.totalPages);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi tải bài viết', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [search, statusFilter, page]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ─── Toggle Status ─── */
  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'active' ? 'hidden' : 'active';
    try {
      const res = await adminApi.updatePostStatus(post._id, newStatus);
      if (res.data?.success) {
        showToast(res.data.message);
        setPosts(prev => prev.map(p => p._id === post._id ? { ...p, status: newStatus } : p));
        if (selectedPost?._id === post._id) {
          setSelectedPost(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async (postId) => {
    if (!window.confirm('Xóa vĩnh viễn bài viết này?')) return;
    try {
      const res = await adminApi.deletePost(postId);
      if (res.data?.success) {
        showToast(res.data.message);
        setPosts(prev => prev.filter(p => p._id !== postId));
        setTotalCount(c => Math.max(0, c - 1));
        if (selectedPost?._id === postId) setSelectedPost(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  return (
    <div className="admin-feed">
      {toast && <div className={`a-toast ${toast.type}`}>{toast.text}</div>}

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">📝 Quản lý Bài viết</h3>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Tổng: <strong>{totalCount}</strong></span>
        </div>

        {/* Filter bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-wrap">
            <span className="admin-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm nội dung bài viết..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hiển thị</option>
            <option value="hidden">Đang ẩn</option>
          </select>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tác giả</th>
                <th>Nội dung</th>
                <th>Chủ đề</th>
                <th>Ảnh</th>
                <th>Trạng thái</th>
                <th>Ngày đăng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="admin-loading"><div className="a-spinner"></div>Đang tải...</div></td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={7} className="admin-empty"><div className="admin-empty-icon">📝</div>Không tìm thấy bài viết.</td></tr>
              ) : posts.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="a-user-cell">
                      <img className="a-avatar" src={p.authorId?.avatarUrl || 'https://via.placeholder.com/32'} alt="" />
                      <div>
                        <div className="a-user-name">{p.authorId?.fullName || p.authorId?.username || 'Ẩn danh'}</div>
                        <div className="a-user-sub">@{p.authorId?.username || 'unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4, fontSize: 13 }}>
                      {p.content}
                    </div>
                  </td>
                  <td>
                    {p.topic
                      ? <span style={{ color: '#2563eb', fontSize: 12 }}>#{p.topic}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td>
                    {(() => {
                      const imgs = Array.isArray(p.imageUrl) ? p.imageUrl.filter(Boolean) : (p.imageUrl ? [p.imageUrl] : []);
                      if (!imgs.length) return <span style={{ color: '#9ca3af', fontSize: 12 }}>Không có</span>;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => setSelectedPost(p)}>
                          <img src={imgs[0]} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                          {imgs.length > 1 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#F0394F' }}>+{imgs.length - 1}</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <span className={`a-badge ${p.status}`}>
                      {p.status === 'active' ? '● Hiển thị' : '● Đang ẩn'}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>
                    {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div className="a-btn-group">
                      <button className="a-btn" onClick={() => setSelectedPost(p)} title="Xem chi tiết">👁️ Xem</button>
                      <button
                        className={`a-btn ${p.status === 'active' ? 'danger' : 'success'}`}
                        onClick={() => handleToggleStatus(p)}
                      >
                        {p.status === 'active' ? 'Ẩn' : 'Hiện'}
                      </button>
                      <button className="a-btn danger" onClick={() => handleDelete(p._id)} title="Xóa vĩnh viễn">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="admin-pagination">
            <span>Trang {page}/{totalPages} · {totalCount} bài viết</span>
            <div className="admin-pagination-controls">
              <button className="a-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>◀ Trước</button>
              <button className="a-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau ▶</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Post Preview Modal ── */}
      {selectedPost && (
        <div className="a-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="a-modal" onClick={e => e.stopPropagation()}>
            <div className="a-modal-header">
              <h3>Chi tiết bài viết</h3>
              <button className="a-modal-close" onClick={() => setSelectedPost(null)}>×</button>
            </div>

            <div className="a-modal-body">
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img className="a-avatar" style={{ width: 40, height: 40 }} src={selectedPost.authorId?.avatarUrl || 'https://via.placeholder.com/40'} alt="" />
                <div>
                  <div className="a-user-name">{selectedPost.authorId?.fullName || selectedPost.authorId?.username}</div>
                  <div className="a-user-sub">@{selectedPost.authorId?.username} · {new Date(selectedPost.createdAt).toLocaleString('vi-VN')}</div>
                </div>
              </div>

              {/* Topic */}
              {selectedPost.topic && (
                <div style={{ color: '#2563eb', fontWeight: 600, marginBottom: 10, fontSize: 14 }}>#{selectedPost.topic}</div>
              )}

              {/* Content */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: 16, borderRadius: 10, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
                {selectedPost.content}
              </div>

              {/* Images */}
              {(() => {
                const imgs = Array.isArray(selectedPost.imageUrl) ? selectedPost.imageUrl.filter(Boolean) : (selectedPost.imageUrl ? [selectedPost.imageUrl] : []);
                if (!imgs.length) return null;
                return (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '6px 0', marginBottom: 14 }}>
                    {imgs.map((src, i) => (
                      <img key={i} src={src} alt="" style={{ height: 160, borderRadius: 8, objectFit: 'contain', background: '#000' }} />
                    ))}
                  </div>
                );
              })()}

              {/* Meta */}
              <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 16 }}>
                <span>Quyền riêng tư: <strong>{selectedPost.privacy || 'public'}</strong></span>
                <span>Trạng thái: <span className={`a-badge ${selectedPost.status}`}>{selectedPost.status}</span></span>
              </div>
            </div>

            <div className="a-modal-footer">
              <button
                className={`a-btn ${selectedPost.status === 'active' ? 'danger' : 'success'}`}
                onClick={() => handleToggleStatus(selectedPost)}
              >
                {selectedPost.status === 'active' ? 'Ẩn bài viết' : 'Bỏ ẩn bài viết'}
              </button>
              <button className="a-btn danger" onClick={() => handleDelete(selectedPost._id)}>
                🗑️ Xóa vĩnh viễn
              </button>
              <button className="a-btn" onClick={() => setSelectedPost(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagement;
