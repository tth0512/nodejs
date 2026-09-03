// frontend/src/components/BlockList.jsx
import { useState, useEffect, useCallback } from 'react';
import { FiSlash, FiUnlock, FiShield } from 'react-icons/fi';
import { getBlockedUsers, unblockUser } from '../api/followApi.js';
import { toast } from 'react-toastify';
import './BlockList.css';

function BlockList() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBlockedUsers();
      setBlocked(res.data.blockedUsers || []);
    } catch {
      setBlocked([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = async (userId, username) => {
    setProcessingId(userId);
    try {
      await unblockUser(userId);
      setBlocked((prev) => prev.filter((u) => u._id !== userId));
      toast.success(`Đã bỏ block @${username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi bỏ block');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="blocklist-section" aria-label="Blocked Users">
      <div className="blocklist-header">
        <FiShield className="blocklist-header__icon" />
        <h4 className="blocklist-header__title">
          Người dùng đã chặn
          {blocked.length > 0 && <span className="blocklist-count">{blocked.length}</span>}
        </h4>
      </div>

      {loading && <p className="blocklist-empty">Đang tải...</p>}

      {!loading && blocked.length === 0 && (
        <p className="blocklist-empty">Bạn chưa chặn ai.</p>
      )}

      {!loading && blocked.length > 0 && (
        <div className="blocklist-list">
          {blocked.map((u) => (
            <div key={u._id} className="blocklist-item" id={`blocked-user-${u._id}`}>
              <div className="blocklist-item__left">
                <div className="blocklist-avatar">
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt={u.username} />
                    : <span>{(u.username || 'U').charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="blocklist-item__info">
                  <span className="blocklist-item__name">{u.fullName || u.username}</span>
                  <span className="blocklist-item__username">@{u.username}</span>
                </div>
              </div>
              <button
                id={`unblock-btn-${u._id}`}
                className="blocklist-unblock-btn"
                onClick={() => handleUnblock(u._id, u.username)}
                disabled={processingId === u._id}
              >
                <FiUnlock />
                <span>Bỏ chặn</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BlockList;
