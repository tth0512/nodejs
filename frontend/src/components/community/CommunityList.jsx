// frontend/src/components/community/CommunityList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiUsers, FiCompass } from 'react-icons/fi';
import { getCommunities } from '../../api/communityApi.js';
import CommunityCard from './CommunityCard.jsx';
import CreateCommunityModal from './CreateCommunityModal.jsx';
import './CommunityList.css';

export default function CommunityList() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchCommunities = useCallback(async (searchQuery = '') => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await getCommunities(params);
      if (res.success && Array.isArray(res.data)) {
        setCommunities(res.data);
      } else {
        setCommunities([]);
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Không thể tải danh sách cộng đồng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommunities(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchCommunities]);

  const handleCommunityCreated = (newComm) => {
    setCommunities((prev) => [newComm, ...prev]);
    navigate(`/communities/${newComm._id}`);
  };

  return (
    <div className="comm-explore-page">
      {/* ── 1. Page Header ── */}
      <div className="comm-explore-header">
        <div className="comm-explore-title-wrap">
          <h1 className="comm-explore-title">Communities</h1>
          <p className="comm-explore-subtitle">
            Tham gia các nhóm học tập, chia sẻ ghi chú và cùng nhau tiến bộ trong học tập.
          </p>
        </div>

        <button
          type="button"
          className="comm-btn-create"
          onClick={() => setIsCreateOpen(true)}
        >
          <FiPlus size={18} />
          <span>Start your own</span>
        </button>
      </div>

      {/* ── 2. Search Bar ── */}
      <div className="comm-search-bar-wrap">
        <div className="comm-search-box">
          <FiSearch className="comm-search-icon" />
          <input
            type="text"
            className="comm-search-input"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="comm-search-clear"
              onClick={() => setSearch('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Section Title ── */}
      <div className="comm-section-head">
        <div className="comm-section-title-wrap">
          <FiCompass size={20} className="comm-section-icon" />
          <h2 className="comm-section-title">Khám phá các cộng đồng hiện có</h2>
        </div>
        <span className="comm-count-badge">{communities.length} nhóm</span>
      </div>

      {/* ── 4. Communities Grid ── */}
      {loading ? (
        <div className="comm-grid-loading">
          <div className="comm-spinner" />
          <p>Đang tải danh sách cộng đồng...</p>
        </div>
      ) : error ? (
        <div className="comm-error-box">
          <p>{error}</p>
          <button type="button" onClick={() => fetchCommunities(search)}>
            Thử lại
          </button>
        </div>
      ) : communities.length === 0 ? (
        <div className="comm-empty-box">
          <div className="comm-empty-icon">
            <FiUsers size={48} />
          </div>
          <h3>{search ? 'Không tìm thấy cộng đồng nào phù hợp' : 'Chưa có cộng đồng nào'}</h3>
          <p>
            {search
              ? `Thử tìm kiếm với từ khóa khác hoặc tạo cộng đồng mới.`
              : 'Hãy là người đầu tiên tạo dựng một cộng đồng học tập hữu ích!'}
          </p>
          <button
            type="button"
            className="comm-btn-create-empty"
            onClick={() => setIsCreateOpen(true)}
          >
            <FiPlus size={16} /> Tạo cộng đồng ngay
          </button>
        </div>
      ) : (
        <div className="comm-grid">
          {communities.map((comm) => (
            <CommunityCard
              key={comm._id}
              community={comm}
              onJoined={() => {
                // Refresh list or mark joined
                fetchCommunities(search);
              }}
            />
          ))}
        </div>
      )}

      {/* ── 5. Modal Tạo Cộng Đồng ── */}
      <CreateCommunityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCommunityCreated}
      />
    </div>
  );
}
