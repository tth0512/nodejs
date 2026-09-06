import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiChevronDown, 
  FiChevronUp, 
  FiUser, 
  FiBellOff, 
  FiSearch, 
  FiImage, 
  FiShield, 
  FiSlash,
  FiSmile
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const THEMES = [
  { id: 'blue', name: 'Messenger Blue', value: '#0084ff' },
  { id: 'sunset', name: 'Sunset', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'berry', name: 'Berry', value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' },
  { id: 'purple', name: 'Royal Purple', value: 'linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)' },
  { id: 'emerald', name: 'Emerald', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
];

const EMOJIS = ['👍', '❤️', '🔥', '🎉', '💯', '🌸'];

const ChatDetails = ({ targetUser, currentTheme, onSelectTheme, quickEmoji, onSelectQuickEmoji }) => {
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
          <img 
            src={targetUser.avatarUrl || 'https://via.placeholder.com/80'} 
            alt={targetUser.fullName || targetUser.username}
            className="fb-details-avatar" 
          />
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
              <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--fb-text-secondary)' }}>
                Đổi chủ đề
              </p>
              <div className="fb-theme-picker">
                {THEMES.map((theme) => (
                  <div 
                    key={theme.id} 
                    className={`fb-theme-dot ${currentTheme === theme.value ? 'selected' : ''}`}
                    style={{ background: theme.value }}
                    title={theme.name}
                    onClick={() => onSelectTheme(theme.value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, margin: '12px 0 8px 0', color: 'var(--fb-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiSmile /> Biểu tượng cảm xúc nhanh
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {EMOJIS.map((emoji) => (
                  <button 
                    key={emoji}
                    onClick={() => onSelectQuickEmoji(emoji)}
                    style={{
                      background: quickEmoji === emoji ? 'var(--fb-secondary-bg)' : 'transparent',
                      border: quickEmoji === emoji ? '2px solid var(--fb-primary)' : '1px solid var(--fb-border)',
                      borderRadius: '8px',
                      fontSize: '20px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      transition: 'transform 0.1s'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section: File phương tiện chia sẻ */}
        <div 
          className="fb-accordion-header"
          onClick={() => toggleSection('media')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiImage /> File phương tiện & liên kết
          </span>
          {openSection === 'media' ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {openSection === 'media' && (
          <div className="fb-accordion-body">
            <div className="fb-media-grid">
              <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop" alt="shared" className="fb-media-thumb" />
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop" alt="shared" className="fb-media-thumb" />
              <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop" alt="shared" className="fb-media-thumb" />
            </div>
          </div>
        )}

        {/* Section: Quyền riêng tư & hỗ trợ */}
        <div 
          className="fb-accordion-header"
          onClick={() => toggleSection('privacy')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiShield /> Quyền riêng tư & hỗ trợ
          </span>
          {openSection === 'privacy' ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {openSection === 'privacy' && (
          <div className="fb-accordion-body">
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: '#fa383e',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 0'
              }}
              onClick={() => toast.warning('Đã gửi yêu cầu chặn người dùng.')}
            >
              <FiSlash /> Chặn người dùng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDetails;
