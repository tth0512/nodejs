import { useEffect, useState, useRef } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/utils/useAuth.js';
import { toast } from 'react-toastify';
import { 
  FiArrowLeft, 
  FiPhone, 
  FiVideo, 
  FiInfo, 
  FiPlusCircle, 
  FiImage, 
  FiSmile, 
  FiSend,
  FiX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const POPULAR_EMOJIS = ['😀', '😂', '😍', '🥳', '😎', '🥺', '👍', '❤️', '🔥', '🎉', '✨', '💯'];

const ChatRoom = ({ 
  conversationId, 
  isNewChat, 
  targetUserId, 
  targetUser: propTargetUser,
  onBack,
  onToggleDetails,
  isDetailsOpen,
  theme = '#0084ff',
  quickEmoji = '👍'
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [partner, setPartner] = useState(propTargetUser || null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // 'audio' | 'video' | null

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch partner info if not provided
  useEffect(() => {
    if (propTargetUser) {
      setPartner(propTargetUser);
    } else if (targetUserId) {
      fetchTargetUserData(targetUserId);
    }
  }, [propTargetUser, targetUserId]);

  const fetchTargetUserData = async (id) => {
    try {
      const { data } = await axiosClient.get(`/users/${id}`);
      setPartner(data.user || data);
    } catch (err) {
      console.error('Failed to load user info', err);
    }
  };

  useEffect(() => {
    if (isNewChat) {
      setMessages([]);
      setLoading(false);
      setHasMore(false);
      return;
    }
    
    fetchMessages();

    if (socket && conversationId) {
      socket.emit('joinConversation', conversationId);
      
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('typing', handleTypingEvent);
      
      return () => {
        socket.emit('leaveConversation', conversationId);
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('typing', handleTypingEvent);
      };
    }
  }, [conversationId, isNewChat, socket]);

  const handleReceiveMessage = (message) => {
    if (message.conversationId === conversationId) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleTypingEvent = (data) => {
    if (data.conversationId === conversationId && data.senderId !== (currentUser?._id || currentUser?.id)) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2500);
    }
  };

  const fetchMessages = async (pageNum = 1) => {
    try {
      const { data } = await axiosClient.get(`/messages/${conversationId}?page=${pageNum}`);
      if (pageNum === 1) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages((prev) => [...data, ...prev]);
      }
      
      if (data.length < 20) {
        setHasMore(false);
      }

      // If partner is not set, find partner from conversation
      if (!partner) {
        const { data: convData } = await axiosClient.get('/messages/inbox');
        const currentConv = convData.find(c => c._id === conversationId);
        if (currentConv) {
          const myId = currentUser?._id || currentUser?.id;
          const otherUser = currentConv.participants.find(
            p => (p._id || p.id || p)?.toString() !== myId?.toString()
          );
          if (otherUser) setPartner(otherUser);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
      toast.error('Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current?.scrollTop === 0 && hasMore && !loading) {
      setPage((prev) => {
        const nextPage = prev + 1;
        fetchMessages(nextPage);
        return nextPage;
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Emit typing event
    if (socket && conversationId) {
      socket.emit('typing', {
        conversationId,
        receiverId: partner?._id || partner?.id
      });
    }
  };

  const sendDirectMessage = async (contentToSend) => {
    if (!contentToSend.trim()) return;

    try {
      let receiverId = targetUserId || partner?._id || partner?.id || propTargetUser?._id || propTargetUser?.id;
      
      if (!receiverId && !isNewChat) {
        const { data: convData } = await axiosClient.get('/messages/inbox');
        const currentConv = convData.find(c => c._id === conversationId);
        if (currentConv) {
          const myId = currentUser?._id || currentUser?.id;
          const otherUser = currentConv.participants.find(
            p => (p._id || p.id || p)?.toString() !== myId?.toString()
          );
          receiverId = otherUser?._id || otherUser?.id || otherUser;
          if (otherUser && !partner) setPartner(otherUser);
        }
      }

      if (!receiverId) {
        toast.error('Không tìm thấy người nhận');
        return;
      }

      const res = await axiosClient.post('/messages', {
        receiverId,
        content: contentToSend
      });

      setNewMessage('');
      setShowEmojiPicker(false);

      if (isNewChat) {
        navigate(`/messages/${res.data.conversationId}`);
      } else {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi tin nhắn');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendDirectMessage(newMessage);
  };

  const handleSendQuickEmoji = () => {
    sendDirectMessage(quickEmoji);
  };

  const handleAddEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const isEmojiOnly = (text) => {
    if (!text) return false;
    const trimmed = text.trim();
    // Check if only 1 or 2 emojis and short length
    const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,2}$/u;
    return emojiRegex.test(trimmed);
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fb-chat-area" style={{ '--messenger-current-theme': theme }}>
      {/* Messenger Header */}
      <div className="fb-chat-header">
        <div className="fb-chat-header-user" onClick={onToggleDetails}>
          <button className="fb-mobile-back-btn" onClick={(e) => { e.stopPropagation(); onBack?.(); }}>
            <FiArrowLeft />
          </button>
          
          <div className="fb-header-avatar-wrap">
            <img 
              src={partner?.avatarUrl || 'https://via.placeholder.com/42'} 
              alt="avatar" 
              className="fb-header-avatar"
            />
            <span className="fb-online-badge" />
          </div>

          <div className="fb-header-info">
            <span className="fb-header-name">{partner?.fullName || partner?.username || 'Người dùng'}</span>
            <span className="fb-header-status">
              <span className="fb-status-dot-active" /> Đang hoạt động
            </span>
          </div>
        </div>

        <div className="fb-chat-header-actions">
          <button 
            className="fb-header-action-btn" 
            title="Bắt đầu gọi thoại"
            onClick={() => setActiveCall('audio')}
          >
            <FiPhone />
          </button>
          <button 
            className="fb-header-action-btn" 
            title="Bắt đầu gọi video"
            onClick={() => setActiveCall('video')}
          >
            <FiVideo />
          </button>
          <button 
            className={`fb-header-action-btn ${isDetailsOpen ? 'active' : ''}`}
            title="Thông tin cuộc trò chuyện"
            onClick={onToggleDetails}
          >
            <FiInfo />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div 
        className="fb-messages-feed" 
        ref={messagesContainerRef} 
        onScroll={handleScroll}
      >
        {/* Intro Card at Top */}
        <div className="fb-intro-card">
          <img 
            src={partner?.avatarUrl || 'https://via.placeholder.com/80'} 
            alt="avatar" 
            className="fb-intro-avatar"
          />
          <h2 className="fb-intro-name">{partner?.fullName || partner?.username || 'Người dùng UniConnect'}</h2>
          <p className="fb-intro-sub">Các bạn đã kết nối trên UniConnect. Hãy gửi lời chào!</p>
        </div>

        <div className="fb-date-divider">Hôm nay</div>

        {loading && page === 1 && (
          <div style={{ textAlign: 'center', color: 'var(--fb-text-secondary)', padding: '10px' }}>
            Đang tải đoạn chat...
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.senderId === (currentUser._id || currentUser.id);
          const emojiOnly = isEmojiOnly(msg.content);
          const showAvatar = !isMine && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId);

          return (
            <div 
              key={msg._id || idx} 
              className={`fb-message-row ${isMine ? 'mine' : 'theirs'}`}
            >
              {!isMine && (
                showAvatar ? (
                  <img 
                    src={partner?.avatarUrl || 'https://via.placeholder.com/28'} 
                    alt="avatar" 
                    className="fb-message-partner-avatar"
                  />
                ) : (
                  <div className="fb-avatar-placeholder-space" />
                )
              )}

              <div className={`fb-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                <div 
                  className={`fb-bubble ${isMine ? 'mine' : 'theirs'} ${emojiOnly ? 'emoji-only' : ''}`}
                  title={formatMessageTime(msg.createdAt)}
                >
                  {msg.content}
                </div>

                {/* Hover Reactions popover */}
                <div className="fb-bubble-actions">
                  {['👍', '❤️', '😆', '😮', '😢', '😡'].map((r) => (
                    <button 
                      key={r} 
                      className="fb-reaction-quick-btn"
                      onClick={() => toast.success(`Bạn đã thả cảm xúc ${r}`)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="fb-message-row theirs">
            <img 
              src={partner?.avatarUrl || 'https://via.placeholder.com/28'} 
              alt="avatar" 
              className="fb-message-partner-avatar"
            />
            <div className="fb-typing-bubble">
              <div className="fb-typing-dot" />
              <div className="fb-typing-dot" />
              <div className="fb-typing-dot" />
            </div>
          </div>
        )}

        {/* Seen indicator under last sent message */}
        {messages.length > 0 && messages[messages.length - 1]?.senderId === (currentUser._id || currentUser.id) && partner?.avatarUrl && (
          <div className="fb-seen-receipt" title="Đã xem">
            <img src={partner.avatarUrl} alt="seen" className="fb-seen-avatar" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Toolbar */}
      <form className="fb-input-bar" onSubmit={handleFormSubmit}>
        <button 
          type="button" 
          className="fb-input-action-btn" 
          title="Thêm hành động"
          onClick={() => toast.info('Đính kèm file hoặc ứng dụng')}
        >
          <FiPlusCircle />
        </button>
        <button 
          type="button" 
          className="fb-input-action-btn" 
          title="Gửi hình ảnh"
          onClick={() => toast.info('Chọn ảnh để gửi')}
        >
          <FiImage />
        </button>

        {/* Pill Input */}
        <div className="fb-input-pill">
          <input 
            type="text" 
            placeholder="Aa" 
            value={newMessage}
            onChange={handleInputChange}
          />
          <button 
            type="button" 
            className="fb-emoji-trigger" 
            title="Biểu tượng cảm xúc"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FiSmile />
          </button>
        </div>

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="fb-emoji-popover">
            {POPULAR_EMOJIS.map((emoji) => (
              <button 
                key={emoji} 
                type="button" 
                className="fb-emoji-item-btn"
                onClick={() => handleAddEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Action: Like 👍 or Send */}
        {newMessage.trim() ? (
          <button type="submit" className="fb-main-action-btn" title="Gửi">
            <FiSend />
          </button>
        ) : (
          <button 
            type="button" 
            className="fb-main-action-btn like-btn" 
            title="Gửi biểu tượng cảm xúc nhanh"
            onClick={handleSendQuickEmoji}
          >
            {quickEmoji}
          </button>
        )}
      </form>

      {/* Messenger Call Preview Modal */}
      {activeCall && (
        <div className="fb-call-modal-backdrop" onClick={() => setActiveCall(null)}>
          <div className="fb-call-card" onClick={(e) => e.stopPropagation()}>
            <img 
              src={partner?.avatarUrl || 'https://via.placeholder.com/90'} 
              alt="avatar" 
              className="fb-call-avatar"
            />
            <h3 className="fb-call-name">{partner?.fullName || partner?.username || 'Người dùng'}</h3>
            <p className="fb-call-status">
              Đang đổ chuông {activeCall === 'video' ? 'gọi video' : 'cuộc gọi thoại'}...
            </p>
            <div className="fb-call-actions">
              <button className="fb-call-hangup-btn" onClick={() => setActiveCall(null)} title="Kết thúc">
                <FiX />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
