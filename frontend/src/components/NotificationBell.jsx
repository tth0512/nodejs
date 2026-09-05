// frontend/src/components/NotificationBell.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { FiBell, FiX, FiCheck, FiUserPlus, FiUserCheck, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/utils/useAuth.js';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/followApi.js';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './NotificationBell.css';

const TYPE_CONFIG = {
  follow: { icon: FiUserPlus, label: 'đã follow bạn.', color: '#6366f1' },
  follow_request: { icon: FiClock, label: 'gửi yêu cầu follow bạn.', color: '#ca8a04' },
  follow_accept: { icon: FiUserCheck, label: 'đã chấp nhận yêu cầu follow của bạn.', color: '#16a34a' },
};

function NotificationBell() {
  const { currentUser, socketRef } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Attach a listener to the shared socket from AuthContext — no new connection created
  useEffect(() => {
    if (!currentUser?._id) return;

    const socket = socketRef?.current;
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('new_notification', handleNewNotification);

    // Remove only this listener on cleanup — do NOT disconnect the shared socket
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [currentUser?._id, socketRef]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleMarkRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => n._id === notif._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
    if (notif.sender?._id) {
      setOpen(false);
      navigate(`/users/${notif.sender._id}`);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  if (!currentUser) return null;

  return (
    <div className="notif-bell-wrapper" ref={panelRef}>
      <button
        id="notification-bell-btn"
        className="notif-bell-btn"
        onClick={handleOpen}
        aria-label="Thông báo"
      >
        <FiBell className="notif-bell-icon" />
        {unreadCount > 0 && (
          <span className="notif-bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel" id="notification-panel">
          {/* Header */}
          <div className="notif-panel__header">
            <span className="notif-panel__title">Thông báo</span>
            <div className="notif-panel__actions">
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  className="notif-mark-all-btn"
                  onClick={handleMarkAll}
                  title="Đánh dấu tất cả đã đọc"
                >
                  <FiCheck /> Đọc hết
                </button>
              )}
              <button className="notif-close-btn" onClick={() => setOpen(false)}>
                <FiX />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="notif-panel__body">
            {loading && <div className="notif-empty">Đang tải...</div>}
            {!loading && notifications.length === 0 && (
              <div className="notif-empty">Chưa có thông báo nào.</div>
            )}
            {!loading && notifications.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.follow;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif._id}
                  className={`notif-item ${notif.isRead ? '' : 'notif-item--unread'}`}
                  onClick={() => handleMarkRead(notif)}
                  id={`notif-item-${notif._id}`}
                >
                  <div className="notif-item__avatar-wrap">
                    {notif.sender?.avatarUrl
                      ? <img src={notif.sender.avatarUrl} alt={notif.sender.username} className="notif-item__avatar" />
                      : <div className="notif-item__avatar notif-item__avatar--placeholder">
                          {(notif.sender?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="notif-item__type-icon" style={{ background: cfg.color }}>
                      <Icon />
                    </span>
                  </div>
                  <div className="notif-item__content">
                    <p className="notif-item__text">
                      <strong>@{notif.sender?.username}</strong> {cfg.label}
                    </p>
                    <span className="notif-item__time">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  {!notif.isRead && <div className="notif-item__dot" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
