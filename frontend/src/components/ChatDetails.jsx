import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiChevronDown, 
  FiChevronUp, 
  FiUser, 
  FiBellOff, 
  FiSearch, 
  FiSmile
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🎉', '💯', '🌸', '👏', '😂', '⭐', '🚀'];

const ChatDetails = ({ targetUser, quickEmoji, onSelectQuickEmoji }) => {
  const [openSection, setOpenSection] = useState('customize');
  const [isMuted, setIsMuted] = useState(false);

  if (!targetUser) return null;

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'Đã bật thông báo đoạn chat' : 'Đã tắt thông báo đoạn chat');
  };

  return (
    <div className="fb-details-pane">
      {/* Profile Overview */}
      <div className="fb-details-header">
        <div className="fb-details-avatar-wrap">
          {targetUser.avatarUrl ? (
            <img 
              src={targetUser.avatarUrl} 
              alt={targetUser.fullName || targetUser.username}
              className="fb-details-avatar" 
            />
          ) : (
            <div className="fb-details-avatar fb-avatar-placeholder">
              {(targetUser.username || targetUser.fullName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h3 className="fb-details-name">{targetUser.fullName || targetUser.username}</h3>
        <span className="fb-details-status">Đang hoạt động trên UniConnect</span>

        {/* Shortcuts */}
        <div className="fb-details-shortcuts">
          <Link to={`/users/${targetUser._id || targetUser.id}`} className="fb-shortcut-item" title="Xem hồ sơ">
            <div className="fb-shortcut-icon">
              <FiUser />
            </div>
            <span>Trang cá nhân</span>
          </Link>

          <button className="fb-shortcut-item" onClick={handleToggleMute} title="Tắt thông báo">
            <div className="fb-shortcut-icon" style={{ color: isMuted ? '#fa383e' : 'inherit' }}>
              <FiBellOff />
            </div>
            <span>{isMuted ? 'Đã tắt thông báo' : 'Tắt thông báo'}</span>
          </button>

          <button className="fb-shortcut-item" onClick={() => toast.info('Tìm kiếm trong đoạn chat')} title="Tìm kiếm">
            <div className="fb-shortcut-icon">
              <FiSearch />
            </div>
            <span>Tìm kiếm</span>
          </button>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="fb-accordion">
        {/* Section: Tùy chỉnh đoạn chat */}
        <div 
          className="fb-accordion-header"
          onClick={() => toggleSection('customize')}
        >
          <span>Tùy chỉnh đoạn chat</span>
          {openSection === 'customize' ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {openSection === 'customize' && (
          <div className="fb-accordion-body">
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 10px 0', color: 'var(--fb-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiSmile /> Đổi biểu tượng cảm xúc nhanh
              </p>
              <div className="fb-quick-emoji-grid">
                {QUICK_EMOJIS.map((emoji) => (
                  <button 
                    key={emoji}
                    type="button"
                    onClick={() => onSelectQuickEmoji(emoji)}
                    className={`fb-quick-emoji-btn ${quickEmoji === emoji ? 'active' : ''}`}
                    title={`Chọn biểu tượng ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDetails;
