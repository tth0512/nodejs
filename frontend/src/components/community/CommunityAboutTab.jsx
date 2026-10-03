// frontend/src/components/community/CommunityAboutTab.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiShield, FiLock, FiGlobe, FiFileText, FiCheck, FiLogOut } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { joinCommunity, leaveCommunity } from '../../api/communityApi.js';
import CommunityAvatar from './CommunityAvatar.jsx';
import './CommunityAboutTab.css';

export default function CommunityAboutTab({ community, isMember, onMembershipChange, currentUser }) {
  const [loading, setLoading] = useState(false);

  const creator = community?.creator || {};
  const isCreator = currentUser && (currentUser._id || currentUser.id)?.toString() === (creator._id || creator.id)?.toString();

  const handleJoin = async () => {
    try {
      setLoading(true);
      const res = await joinCommunity(community._id);
      if (res.success) {
        onMembershipChange?.(true, res.memberCount);
      }
    } catch (err) {
      console.error('Error joining community:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi cộng đồng này?')) return;
    try {
      setLoading(true);
      const res = await leaveCommunity(community._id);
      if (res.success) {
        onMembershipChange?.(false, res.memberCount);
      }
    } catch (err) {
      console.error('Error leaving community:', err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = community?.createdAt
    ? format(new Date(community.createdAt), 'dd MMMM, yyyy', { locale: vi })
    : 'Gần đây';

  return (
    <div className="comm-about-tab">
      {/* ── 1. Hero Cover & Profile ── */}
      <div className="comm-about-hero">
        <div
          className="comm-about-cover"
          style={{
            backgroundImage: community?.coverImage ? `url(${community.coverImage})` : undefined
          }}
        />

        <div className="comm-about-identity-bar">
          <div className="comm-about-avatar-container">
            {/* Hiển thị Avatar - nếu không upload thì hiển thị avatar chữ cái đầu trên NỀN ĐEN theo yêu cầu */}
            <CommunityAvatar
              avatarUrl={community?.avatar}
              name={community?.name}
              size="xl"
              className="comm-about-avatar"
            />
          </div>

          <div className="comm-about-identity-info">
            <div className="comm-about-title-row">
              <h2 className="comm-about-name">{community?.name}</h2>
              <span className={`comm-privacy-tag ${community?.privacy === 'private' ? 'private' : 'public'}`}>
                {community?.privacy === 'private' ? (
                  <><FiLock size={12} /> Riêng tư</>
                ) : (
                  <><FiGlobe size={12} /> Công khai</>
                )}
              </span>
            </div>
            <p className="comm-about-subtitle">
              Cộng đồng được thành lập ngày {formattedDate}
            </p>
          </div>

          <div className="comm-about-action-col">
            {isMember ? (
              <div className="comm-member-actions">
                <span className="comm-badge-joined">
                  <FiCheck size={14} /> Đã tham gia
                </span>
                {!isCreator && (
                  <button
                    type="button"
                    className="comm-btn-leave"
                    onClick={handleLeave}
                    disabled={loading}
                    title="Rời khỏi nhóm"
                  >
                    <FiLogOut size={14} /> Rời nhóm
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="comm-btn-join-lg"
                onClick={handleJoin}
                disabled={loading}
              >
                {loading ? 'Đang tham gia...' : 'Tham gia cộng đồng'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Grid Thống Kê & Người Sáng Lập ── */}
      <div className="comm-about-stats-grid">
        <div className="comm-stat-card">
          <div className="comm-stat-icon comm-stat-icon--users">
            <FiUsers size={22} />
          </div>
          <div className="comm-stat-meta">
            <span className="comm-stat-value">{community?.memberCount || 1}</span>
            <span className="comm-stat-label">Thành viên tham gia</span>
          </div>
        </div>

        <div className="comm-stat-card">
          <div className="comm-stat-icon comm-stat-icon--posts">
            <FiFileText size={22} />
          </div>
          <div className="comm-stat-meta">
            <span className="comm-stat-value">{community?.posts?.length || 0}</span>
            <span className="comm-stat-label">Bài viết đã chia sẻ</span>
          </div>
        </div>

        <div className="comm-stat-card">
          <div className="comm-stat-icon comm-stat-icon--creator">
            <FiShield size={22} />
          </div>
          <div className="comm-stat-meta">
            <span className="comm-stat-value">
              {creator?._id ? (
                <Link to={`/users/${creator._id}`} className="comm-creator-link">
                  {creator.fullName || creator.username || 'Admin'}
                </Link>
              ) : (
                'Quản trị viên'
              )}
            </span>
            <span className="comm-stat-label">Người sáng lập (Owner)</span>
          </div>
        </div>
      </div>

      {/* ── 3. Mô Tả Chi Tiết ── */}
      <div className="comm-about-section">
        <h3 className="comm-about-section-title">Giới thiệu về cộng đồng</h3>
        <div className="comm-about-desc-content">
          {community?.description ? (
            <p>{community.description}</p>
          ) : (
            <p className="comm-about-no-desc">Chưa có thông tin mô tả chi tiết cho cộng đồng này.</p>
          )}
        </div>
      </div>

      {/* ── 4. Quy Định & Hướng Dẫn ── */}
      <div className="comm-about-section">
        <h3 className="comm-about-section-title">Quy định cộng đồng</h3>
        <ul className="comm-about-rules-list">
          <li>Tôn trọng các thành viên khác, trao đổi văn minh và lành mạnh.</li>
          <li>Chia sẻ tài liệu, bài học và thảo luận đúng chủ đề cộng đồng.</li>
          <li>Không đăng tải nội dung quảng cáo rác (spam) hoặc tin giả.</li>
          <li>Tuân thủ các điều khoản chung của mạng xã hội UniVERSE.</li>
        </ul>
      </div>
    </div>
  );
}
