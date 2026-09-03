// frontend/src/components/FollowList.jsx
import { useState, useEffect, useCallback } from 'react';
import { FiX, FiSearch, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getFollowers, getFollowing } from '../api/followApi.js';
import FollowButton from './FollowButton.jsx';
import './FollowList.css';

function FollowList({ userId, mode = 'followers', onClose }) {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = mode === 'followers'
        ? await getFollowers(userId)
        : await getFollowing(userId);
      const data = mode === 'followers' ? res.data.followers : res.data.following;
      setList(data || []);
      setFiltered(data || []);
    } catch {
      setList([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [userId, mode]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(list);
    } else {
      const q = query.toLowerCase();
      setFiltered(list.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q)
      ));
    }
  }, [query, list]);

  const handleUserClick = (u) => {
    onClose?.();
    navigate(`/users/${u._id}`);
  };

  return (
    <div className="followlist-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="followlist-modal" role="dialog" aria-modal="true" aria-label={mode === 'followers' ? 'Followers' : 'Following'}>
        {/* Header */}
        <div className="followlist-header">
          <FiUsers className="followlist-header__icon" />
          <h3 className="followlist-header__title">
            {mode === 'followers' ? 'Followers' : 'Đang follow'}
          </h3>
          <button className="followlist-close-btn" onClick={onClose} id="followlist-close">
            <FiX />
          </button>
        </div>

        {/* Search */}
        <div className="followlist-search">
          <FiSearch className="followlist-search__icon" />
          <input
            id="followlist-search-input"
            type="text"
            placeholder="Tìm kiếm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="followlist-search__input"
          />
        </div>

        {/* List */}
        <div className="followlist-body">
          {loading && (
            <div className="followlist-empty">Đang tải...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="followlist-empty">
              {query ? 'Không tìm thấy người dùng.' : 'Danh sách trống.'}
            </div>
          )}
          {!loading && filtered.map((u) => (
            <div key={u._id} className="followlist-item">
              <div className="followlist-item__left" onClick={() => handleUserClick(u)} style={{ cursor: 'pointer' }}>
                <div className="followlist-avatar">
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt={u.username} />
                    : <span>{(u.username || 'U').charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="followlist-item__info">
                  <span className="followlist-item__name">{u.fullName || u.username}</span>
                  <span className="followlist-item__username">@{u.username}</span>
                </div>
              </div>
              <FollowButton
                targetUserId={u._id}
                targetUsername={u.username}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FollowList;
