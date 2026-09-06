import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiEdit } from 'react-icons/fi';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/utils/useAuth.js';
import { useSocket } from '../context/SocketContext.jsx';

const MessengerDropdown = ({ onClose }) => {
  const { currentUser } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c._id === message.conversationId);
          if (idx > -1) {
            const updated = [...prev];
            updated[idx].lastMessage = message;
            const [item] = updated.splice(idx, 1);
            updated.unshift(item);
            return updated;
          }
          fetchConversations();
          return prev;
        });
      };

      socket.on('receiveMessage', handleNewMessage);
      return () => {
        socket.off('receiveMessage', handleNewMessage);
      };
    }
  }, [socket]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const fetchConversations = async () => {
    try {
      const { data } = await axiosClient.get('/messages/inbox');
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch dropdown messages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConv = (id) => {
    navigate(`/messages/${id}`);
    onClose();
  };

  const filtered = conversations.filter((c) => {
    const other = c.participants.find(
      (p) => p._id !== (currentUser?._id || currentUser?.id)
    );
    if (!other) return false;
    const name = (other.fullName || other.username || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="fb-messenger-dropdown" ref={dropdownRef}>
      {/* Dropdown Header */}
      <div className="fb-dropdown-header">
        <h2>Đoạn chat</h2>
        <button 
          className="fb-icon-btn" 
          title="Tin nhắn mới"
          onClick={() => {
            navigate('/messages');
            onClose();
          }}
        >
          <FiEdit />
        </button>
      </div>

      {/* Dropdown Search */}
      <div className="fb-dropdown-search">
        <div className="fb-search-bar" style={{ height: '34px' }}>
          <FiSearch />
          <input 
            type="text" 
            placeholder="Tìm kiếm trên Messenger"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Dropdown List */}
      <div className="fb-dropdown-list">
        {loading ? (
          <div className="fb-sidebar-empty" style={{ padding: '20px' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="fb-sidebar-empty" style={{ padding: '20px' }}>
            {search ? 'Không có kết quả.' : 'Chưa có đoạn chat nào.'}
          </div>
        ) : (
          filtered.slice(0, 6).map((conv) => {
            const otherUser = conv.participants.find(
              (p) => p._id !== (currentUser?._id || currentUser?.id)
            );
            if (!otherUser) return null;

            const isSenderMe = conv.lastMessage?.senderId === (currentUser?._id || currentUser?.id);
            const prefix = isSenderMe ? 'Bạn: ' : '';

            return (
              <div 
                key={conv._id} 
                className="fb-conv-item"
                onClick={() => handleSelectConv(conv._id)}
              >
                <div className="fb-conv-avatar-wrap" style={{ width: '48px', height: '48px' }}>
                  <img 
                    src={otherUser.avatarUrl || 'https://via.placeholder.com/48'} 
                    alt="avatar" 
                    className="fb-conv-avatar" 
                    style={{ width: '48px', height: '48px' }}
                  />
                  <span className="fb-online-badge" />
                </div>

                <div className="fb-conv-content">
                  <div className="fb-conv-top-row">
                    <span className="fb-conv-name" style={{ fontSize: '14px' }}>
                      {otherUser.fullName || otherUser.username}
                    </span>
                  </div>
                  <div className="fb-conv-bottom-row" style={{ fontSize: '12px' }}>
                    <span className="fb-conv-snippet">
                      {prefix}{conv.lastMessage?.content || 'Đã bắt đầu cuộc trò chuyện'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="fb-dropdown-footer">
        <Link 
          to="/messages" 
          className="fb-dropdown-footer-link"
          onClick={onClose}
        >
          Xem tất cả trong Messenger
        </Link>
      </div>
    </div>
  );
};

export default MessengerDropdown;
