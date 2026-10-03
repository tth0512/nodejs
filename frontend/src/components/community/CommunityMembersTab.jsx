// frontend/src/components/community/CommunityMembersTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiShield, FiUser } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { getCommunityMembers } from '../../api/communityApi.js';
import './CommunityMembersTab.css';

// Bảng màu avatar đẹp mắt cho thành viên nếu chưa có ảnh đại diện
const AVATAR_COLORS = [
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

function getAvatarColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash + str.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] || AVATAR_COLORS[0];
}

export default function CommunityMembersTab({ communityId }) {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'admin' | 'member'
  const [counts, setCounts] = useState({ all: 0, admin: 0, member: 0 });

  const fetchMembers = useCallback(async (searchQuery = '', roleFilter = 'all') => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter !== 'all') params.role = roleFilter;

      const res = await getCommunityMembers(communityId, params);
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  // Lấy tổng số lượng để hiển thị trên các pills
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const resAll = await getCommunityMembers(communityId, {});
        if (resAll.success && Array.isArray(resAll.data)) {
          const all = resAll.data;
          const adminCount = all.filter((m) => m.role === 'admin' || m.isCreator).length;
          const memberCount = all.filter((m) => m.role !== 'admin' && !m.isCreator).length;
          setCounts({ all: all.length, admin: adminCount, member: memberCount });
        }
      } catch (err) {
        console.error('Error fetching counts:', err);
      }
    };
    if (communityId) fetchCounts();
  }, [communityId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers(search, activeFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, activeFilter, fetchMembers]);

  return (
    <div className="comm-members-tab">
      {/* ── 1. Search Box ── */}
      <div className="comm-members-search-wrap">
        <div className="comm-members-search-box">
          <FiSearch className="comm-members-search-icon" />
          <input
            type="text"
            className="comm-members-search-input"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="comm-members-search-clear"
              onClick={() => setSearch('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Filter Pills ── */}
      <div className="comm-members-filters">
        <button
          type="button"
          className={`comm-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className={`comm-filter-pill ${activeFilter === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveFilter('admin')}
        >
          Admins ({counts.admin})
        </button>
        <button
          type="button"
          className={`comm-filter-pill ${activeFilter === 'member' ? 'active' : ''}`}
          onClick={() => setActiveFilter('member')}
        >
          Members ({counts.member})
        </button>
      </div>

      {/* ── 3. Members List (Admin đầu tiên, sau đó theo bảng chữ cái A-Z) ── */}
      <div className="comm-members-card">
        {loading ? (
          <div className="comm-members-loading">
            <div className="comm-members-spinner" />
            <p>Đang tải danh sách thành viên...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="comm-members-empty">
            <FiUser size={36} />
            <p>Không tìm thấy thành viên nào phù hợp.</p>
          </div>
        ) : (
          <div className="comm-members-list">
            {members.map((m) => {
              const u = m.user || {};
              const userId = u._id || u.id;
              const displayName = u.fullName || u.username || 'Thành viên';
              const initial = (u.username || displayName).charAt(0).toUpperCase();
              const bgCol = getAvatarColor(u.username || displayName);

              return (
                <div
                  key={m._id || userId}
                  className="comm-member-row"
                  onClick={() => userId && navigate(`/users/${userId}`)}
                >
                  {/* Avatar */}
                  <div className="comm-member-avatar-wrap">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={displayName} className="comm-member-avatar-img" />
                    ) : (
                      <div
                        className="comm-member-avatar-letter"
                        style={{ backgroundColor: bgCol }}
                      >
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="comm-member-name-wrap">
                    <span className="comm-member-name">{displayName}</span>
                    {u.username && u.fullName && (
                      <span className="comm-member-username">@{u.username}</span>
                    )}
                  </div>

                  {/* Role Badge */}
                  <div className="comm-member-role-wrap">
                    {m.isCreator ? (
                      <span className="comm-role-badge owner" title="Người sáng lập">
                        <FaCrown size={12} /> Owner
                      </span>
                    ) : m.role === 'admin' ? (
                      <span className="comm-role-badge admin" title="Quản trị viên">
                        <FiShield size={13} /> Admin
                      </span>
                    ) : (
                      <span className="comm-role-badge member">
                        Member
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
