import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/utils/useAuth.js';
import { 
  FiEdit, 
  FiMoreHorizontal, 
  FiSearch, 
  FiMessageSquare 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import ChatRoom from './ChatRoom.jsx';
import ChatDetails from './ChatDetails.jsx';
import './Messages.css';

const Messages = () => {
  const { currentUser } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const { conversationId, newUserId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('#0084ff');
  const [quickEmoji, setQuickEmoji] = useState('👍');
  const [newChatUser, setNewChatUser] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (newUserId) {
      fetchNewChatUserInfo(newUserId);
    } else {
      setNewChatUser(null);
    }
  }, [newUserId]);

  useEffect(() => {
    if (socket) {
      socket.on('receiveMessage', handleNewMessage);
      return () => {
        socket.off('receiveMessage', handleNewMessage);
      };
    }
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const { data } = await axiosClient.get('/messages/inbox');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewChatUserInfo = async (id) => {
    try {
      const { data } = await axiosClient.get(`/users/${id}`);
      setNewChatUser(data.user || data);
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  const handleNewMessage = (message) => {
    setConversations((prev) => {
      const existsIndex = prev.findIndex((c) => c._id === message.conversationId);
      if (existsIndex > -1) {
        const updated = [...prev];
        updated[existsIndex].lastMessage = message;
        const [item] = updated.splice(existsIndex, 1);
        updated.unshift(item);
        return updated;
      }
      fetchConversations();
      return prev;
    });
  };

  const openConversation = (id) => {
    navigate(`/messages/${id}`);
  };

  // Find active partner user
  const activeConversation = conversations.find((c) => c._id === conversationId);
  const activePartner = newChatUser || activeConversation?.participants.find(
    (p) => p._id !== (currentUser?._id || currentUser?.id)
  );

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    const other = conv.participants.find(
      (p) => p._id !== (currentUser?._id || currentUser?.id)
    );
    if (!other) return false;
    const name = (other.fullName || other.username || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Unique list of active contacts for the horizontal carousel
  const activeFriends = conversations
    .map((c) => c.participants.find((p) => p._id !== (currentUser?._id || currentUser?.id)))
    .filter((u, index, self) => u && self.findIndex((s) => s?._id === u._id) === index);

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày`;
  };

  return (
    <div className="fb-messenger">
      {/* LEFT SIDEBAR */}
      <aside className={`fb-sidebar ${(conversationId || newUserId) ? 'hidden-mobile' : ''}`}>
        {/* Top Header */}
        <div className="fb-sidebar-header">
          <h1>Đoạn chat</h1>
          <div className="fb-sidebar-header-actions">
            <button 
              className="fb-icon-btn" 
              title="Tùy chọn"
              onClick={() => toast.info('Cài đặt tin nhắn Facebook')}
            >
              <FiMoreHorizontal />
            </button>
            <button 
              className="fb-icon-btn" 
              title="Tin nhắn mới"
              onClick={() => toast.info('Nhập tên người dùng vào thanh tìm kiếm')}
            >
              <FiEdit />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="fb-search-wrap">
          <div className="fb-search-bar">
            <FiSearch />
            <input 
              type="text" 
              placeholder="Tìm kiếm trên Messenger"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Active Friends Tray (Horizontal) */}
        {activeFriends.length > 0 && (
          <div className="fb-active-tray">
            {activeFriends.map((friend) => (
              <div 
                key={friend._id} 
                className="fb-active-user-chip"
                onClick={() => navigate(`/messages/new/${friend._id}`)}
              >
                <div className="fb-active-avatar-wrap">
                  <img 
                    src={friend.avatarUrl || 'https://via.placeholder.com/48'} 
                    alt={friend.fullName || friend.username}
                    className="fb-active-avatar"
                  />
                  <span className="fb-online-badge" />
                </div>
                <span className="fb-active-chip-name">
                  {friend.fullName?.split(' ').pop() || friend.username}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Conversation List */}
        <div className="fb-conv-list">
          {loading ? (
            <div className="fb-sidebar-empty">Đang tải các cuộc trò chuyện...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="fb-sidebar-empty">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện phù hợp.' : 'Chưa có tin nhắn nào. Bắt đầu ngay!'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherUser = conv.participants.find(
                (p) => p._id !== (currentUser?._id || currentUser?.id)
              );
              if (!otherUser) return null;

              const isSelected = conversationId === conv._id;
              const isSenderMe = conv.lastMessage?.senderId === (currentUser?._id || currentUser?.id);
              const previewPrefix = isSenderMe ? 'Bạn: ' : '';
              const timeDisplay = formatRelativeTime(conv.lastMessage?.createdAt);

              return (
                <div 
                  key={conv._id} 
                  className={`fb-conv-item ${isSelected ? 'active' : ''}`}
                  onClick={() => openConversation(conv._id)}
                >
                  <div className="fb-conv-avatar-wrap">
                    <img 
                      src={otherUser.avatarUrl || 'https://via.placeholder.com/56'} 
                      alt="avatar" 
                      className="fb-conv-avatar" 
                    />
                    <span className="fb-online-badge" />
                  </div>

                  <div className="fb-conv-content">
                    <div className="fb-conv-top-row">
                      <span className="fb-conv-name">{otherUser.fullName || otherUser.username}</span>
                    </div>
                    <div className="fb-conv-bottom-row">
                      <span className="fb-conv-snippet">
                        {previewPrefix}{conv.lastMessage?.content || 'Đã bắt đầu cuộc trò chuyện'}
                      </span>
                      {timeDisplay && (
                        <>
                          <span>·</span>
                          <span className="fb-conv-time">{timeDisplay}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* CENTER CHAT AREA */}
      <main className={`fb-chat-area ${(!conversationId && !newUserId) ? 'hidden-mobile' : ''}`}>
        {conversationId ? (
          <ChatRoom 
            conversationId={conversationId} 
            targetUser={activePartner}
            onBack={() => navigate('/messages')}
            onToggleDetails={() => setShowDetails(!showDetails)}
            isDetailsOpen={showDetails}
            theme={currentTheme}
            quickEmoji={quickEmoji}
          />
        ) : newUserId ? (
          <ChatRoom 
            isNewChat={true} 
            targetUserId={newUserId}
            targetUser={activePartner}
            onBack={() => navigate('/messages')}
            onToggleDetails={() => setShowDetails(!showDetails)}
            isDetailsOpen={showDetails}
            theme={currentTheme}
            quickEmoji={quickEmoji}
          />
        ) : (
          <div className="fb-chat-empty-state">
            <div className="fb-chat-empty-icon">
              <FiMessageSquare />
            </div>
            <h3>Các đoạn chat của bạn</h3>
            <p>Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu tin nhắn mới.</p>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR: CHAT DETAILS */}
      {(conversationId || newUserId) && showDetails && activePartner && (
        <ChatDetails 
          targetUser={activePartner}
          currentTheme={currentTheme}
          onSelectTheme={setCurrentTheme}
          quickEmoji={quickEmoji}
          onSelectQuickEmoji={setQuickEmoji}
        />
      )}
    </div>
  );
};

export default Messages;
