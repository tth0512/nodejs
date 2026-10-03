// frontend/src/components/community/CommunityCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiLock } from 'react-icons/fi';
import { joinCommunity } from '../../api/communityApi.js';
import CommunityAvatar from './CommunityAvatar.jsx';
import './CommunityCard.css';

// Danh sách các gradient đẹp mắt làm banner dự phòng khi cộng đồng chưa có ảnh bìa
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', // Blue
  'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', // Red
  'linear-gradient(135deg, #334155 0%, #1e293b 100%)', // Dark Slate
  'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', // Green
  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', // Purple
  'linear-gradient(135deg, #d97706 0%, #b45309 100%)', // Amber
];

function getFallbackGradient(id = '') {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % FALLBACK_GRADIENTS.length;
  }
  return FALLBACK_GRADIENTS[hash] || FALLBACK_GRADIENTS[0];
}

export default function CommunityCard({ community, onJoined }) {
  const navigate = useNavigate();
  const [isMember, setIsMember] = useState(Boolean(community?.isMember));
  const [memberCount, setMemberCount] = useState(community?.memberCount || 1);
  const [loadingJoin, setLoadingJoin] = useState(false);

  const fallbackBg = getFallbackGradient(community?._id || community?.name);

  const handleCardClick = () => {
    navigate(`/communities/${community._id}`);
  };

  const handleJoinClick = async (e) => {
    e.stopPropagation();
    if (isMember) {
      navigate(`/communities/${community._id}`);
      return;
    }

    try {
      setLoadingJoin(true);
      const res = await joinCommunity(community._id);
      if (res.success) {
        setIsMember(true);
        setMemberCount(res.memberCount ?? (memberCount + 1));
        onJoined?.(community._id);
      }
    } catch (err) {
      console.error('Error joining community:', err);
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div className="comm-card" onClick={handleCardClick}>
      {/* ── 1. Top Cover Banner ── */}
      <div
        className="comm-card-cover"
        style={{
          background: community.coverImage ? `url(${community.coverImage}) center/cover no-repeat` : fallbackBg
        }}
      >
        {/* Avatar badge overlapping cover */}
        <div className="comm-card-avatar-wrap">
          <CommunityAvatar
            avatarUrl={community.avatar}
            name={community.name}
            size="lg"
            className="comm-card-avatar"
          />
        </div>
      </div>

      {/* ── 2. Card Content ── */}
      <div className="comm-card-body">
        <div className="comm-card-header-row">
          <h4 className="comm-card-title" title={community.name}>
            {community.name}
          </h4>
          {community.privacy === 'private' && (
            <span className="comm-privacy-badge" title="Cộng đồng riêng tư">
              <FiLock size={12} />
            </span>
          )}
        </div>

        <div className="comm-card-members">
          <FiUsers size={14} />
          <span>{memberCount} thành viên</span>
        </div>

        <p className="comm-card-desc">
          {community.description || 'Chưa có mô tả cho cộng đồng này.'}
        </p>

        {/* ── 3. Bottom Action Button ── */}
        <div className="comm-card-footer">
          {isMember ? (
            <button
              type="button"
              className="comm-btn-view"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/communities/${community._id}`);
              }}
            >
              Xem cộng đồng
            </button>
          ) : (
            <button
              type="button"
              className="comm-btn-join"
              onClick={handleJoinClick}
              disabled={loadingJoin}
            >
              {loadingJoin ? 'Đang vào...' : 'Tham gia'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
