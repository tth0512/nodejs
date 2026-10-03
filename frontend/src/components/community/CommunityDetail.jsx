// frontend/src/components/community/CommunityDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FiFileText, FiMessageSquare, FiUsers, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/utils/useAuth.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { getCommunityById } from '../../api/communityApi.js';
import CommunityAvatar from './CommunityAvatar.jsx';
import CommunityAboutTab from './CommunityAboutTab.jsx';
import CommunityFeedTab from './CommunityFeedTab.jsx';
import CommunityMembersTab from './CommunityMembersTab.jsx';
import './CommunityDetail.css';

export default function CommunityDetail() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const socket = useSocket();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);

  // Tab: 'about' | 'feed' | 'members' (mặc định lấy từ URL query param ?tab= hoặc 'feed')
  const activeTab = searchParams.get('tab') || 'feed';

  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const fetchCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getCommunityById(communityId);
      if (res.success && res.data) {
        setCommunity(res.data);
        setIsMember(Boolean(res.data.isMember));
      } else {
        setError(res.message || 'Không thể tải thông tin cộng đồng.');
      }
    } catch (err) {
      console.error('Error loading community:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu cộng đồng.');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  // Socket.IO realtime listener for new posts in this community
  useEffect(() => {
    if (!socket || !communityId) return;

    const handleNewPost = ({ post }) => {
      if (post && post.communityId?._id?.toString() === communityId || post.communityId?.toString() === communityId) {
        setCommunity((prev) => {
          if (!prev) return prev;
          const exists = prev.posts?.some((p) => p._id === post._id);
          if (exists) return prev;
          return {
            ...prev,
            posts: [post, ...(prev.posts || [])]
          };
        });
      }
    };

    socket.on('newCommunityPost', handleNewPost);
    return () => {
      socket.off('newCommunityPost', handleNewPost);
    };
  }, [socket, communityId]);

  const handleMembershipChange = (joined, updatedMemberCount) => {
    setIsMember(joined);
    setCommunity((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        isMember: joined,
        memberCount: updatedMemberCount ?? (joined ? (prev.memberCount || 0) + 1 : Math.max(0, (prev.memberCount || 1) - 1))
      };
    });
  };

  const handlePostCreated = (newPost) => {
    setCommunity((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: [newPost, ...(prev.posts || [])]
      };
    });
  };

  if (loading) {
    return (
      <div className="comm-detail-loading-page">
        <div className="comm-detail-spinner" />
        <p>Đang tải thông tin cộng đồng...</p>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="comm-detail-error-page">
        <h2>Không tìm thấy cộng đồng</h2>
        <p>{error || 'Cộng đồng này không tồn tại hoặc đã bị xóa.'}</p>
        <button
          type="button"
          className="comm-btn-back-explore"
          onClick={() => navigate('/communities')}
        >
          <FiArrowLeft /> Quay về danh sách cộng đồng
        </button>
      </div>
    );
  }

  return (
    <div className="comm-detail-container">
      {/* ── CỘT TRÁI: Menu điều hướng nội bộ cộng đồng (Giống Hình 2) ── */}
      <aside className="comm-nav-sidebar">
        {/* Nút quay lại Explore */}
        <button
          type="button"
          className="comm-nav-back-link"
          onClick={() => navigate('/communities')}
        >
          <FiArrowLeft size={14} /> Tất cả cộng đồng
        </button>

        {/* Brand header của nhóm: Avatar (hoặc initials nền đen) + Tên nhóm */}
        <div className="comm-nav-brand">
          <CommunityAvatar
            avatarUrl={community.avatar}
            name={community.name}
            size="md"
            className="comm-nav-avatar"
          />
          <h2 className="comm-nav-title" title={community.name}>
            {community.name}
          </h2>
        </div>

        {/* Danh sách 3 tab chính: Giới thiệu, Bảng Feed, Members */}
        <nav className="comm-nav-menu">
          <button
            type="button"
            className={`comm-nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <span className="comm-nav-icon">
              <FiFileText size={18} />
            </span>
            <span className="comm-nav-text">Giới thiệu</span>
          </button>

          <button
            type="button"
            className={`comm-nav-item ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <span className="comm-nav-icon">
              <FiMessageSquare size={18} />
            </span>
            <span className="comm-nav-text">Bảng Feed</span>
          </button>

          <button
            type="button"
            className={`comm-nav-item ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <span className="comm-nav-icon">
              <FiUsers size={18} />
            </span>
            <span className="comm-nav-text">Members</span>
            <span className="comm-nav-badge">{community.memberCount || 1}</span>
          </button>
        </nav>
      </aside>

      {/* ── CỘT PHẢI: Nội dung tab đang chọn ── */}
      <main className="comm-content-stage">
        {activeTab === 'about' && (
          <CommunityAboutTab
            community={community}
            isMember={isMember}
            currentUser={currentUser}
            onMembershipChange={handleMembershipChange}
          />
        )}

        {activeTab === 'feed' && (
          <CommunityFeedTab
            community={community}
            posts={community.posts || []}
            isMember={isMember}
            currentUser={currentUser}
            onPostCreated={handlePostCreated}
            onMembershipChange={handleMembershipChange}
          />
        )}

        {activeTab === 'members' && (
          <CommunityMembersTab communityId={community._id} />
        )}
      </main>
    </div>
  );
}
