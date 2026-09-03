// frontend/src/components/FollowButton.jsx
import { useState, useEffect, useCallback } from 'react';
import { FiUserPlus, FiUserCheck, FiUserX, FiClock, FiSlash } from 'react-icons/fi';
import { useAuth } from '../context/utils/useAuth.js';
import { followUser, unfollowUser, getFollowStatus, blockUser, unblockUser } from '../api/followApi.js';
import { toast } from 'react-toastify';
import './FollowButton.css';

function FollowButton({ targetUserId, targetUsername, onStatusChange }) {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(null); // 'none' | 'following' | 'requested' | 'blocked'
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!currentUser || !targetUserId) return;
    try {
      const res = await getFollowStatus(targetUserId);
      const { isFollowing, isRequested, isBlocked } = res.data;
      if (isBlocked) setStatus('blocked');
      else if (isFollowing) setStatus('following');
      else if (isRequested) setStatus('requested');
      else setStatus('none');
    } catch {
      setStatus('none');
    }
  }, [currentUser, targetUserId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (!currentUser || currentUser._id === targetUserId) return null;

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await followUser(targetUserId);
      const newStatus = res.data.status; // 'following' or 'requested'
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      if (newStatus === 'following') toast.success(`Đã follow @${targetUsername}`);
      else toast.info(`Đã gửi yêu cầu follow @${targetUsername}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi follow');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    setShowMenu(false);
    try {
      await unfollowUser(targetUserId);
      setStatus('none');
      onStatusChange?.('none');
      toast.info(`Đã unfollow @${targetUsername}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi unfollow');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    setShowMenu(false);
    try {
      await blockUser(targetUserId);
      setStatus('blocked');
      onStatusChange?.('blocked');
      toast.warn(`Đã block @${targetUsername}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi block');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      await unblockUser(targetUserId);
      setStatus('none');
      onStatusChange?.('none');
      toast.success(`Đã bỏ block @${targetUsername}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi bỏ block');
    } finally {
      setLoading(false);
    }
  };

  if (status === null) {
    return <div className="follow-btn follow-btn--loading">...</div>;
  }

  if (status === 'blocked') {
    return (
      <button
        id={`unblock-btn-${targetUserId}`}
        className="follow-btn follow-btn--blocked"
        onClick={handleUnblock}
        disabled={loading}
      >
        <FiSlash className="follow-btn__icon" />
        <span>Đã bị chặn · Bỏ chặn</span>
      </button>
    );
  }

  if (status === 'following') {
    return (
      <div className="follow-btn-wrapper">
        <button
          id={`following-btn-${targetUserId}`}
          className={`follow-btn follow-btn--following ${hovered ? 'follow-btn--unfollow-hover' : ''}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); }}
          onClick={() => setShowMenu(!showMenu)}
          disabled={loading}
        >
          {hovered ? (
            <><FiUserX className="follow-btn__icon" /><span>Tuỳ chọn</span></>
          ) : (
            <><FiUserCheck className="follow-btn__icon" /><span>Đang follow</span></>
          )}
        </button>
        {showMenu && (
          <div className="follow-dropdown" id={`follow-menu-${targetUserId}`}>
            <button onClick={handleUnfollow} className="follow-dropdown__item follow-dropdown__item--danger">
              <FiUserX /> Unfollow
            </button>
            <button onClick={handleBlock} className="follow-dropdown__item follow-dropdown__item--danger">
              <FiSlash /> Block @{targetUsername}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === 'requested') {
    return (
      <button
        id={`requested-btn-${targetUserId}`}
        className="follow-btn follow-btn--requested"
        onClick={handleUnfollow}
        disabled={loading}
      >
        <FiClock className="follow-btn__icon" />
        <span>Đã gửi yêu cầu</span>
      </button>
    );
  }

  // status === 'none'
  return (
    <button
      id={`follow-btn-${targetUserId}`}
      className="follow-btn follow-btn--none"
      onClick={handleFollow}
      disabled={loading}
    >
      <FiUserPlus className="follow-btn__icon" />
      <span>Follow</span>
    </button>
  );
}

export default FollowButton;
