import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/utils/useAuth.js';
import NotificationBell from './NotificationBell.jsx';
import MessengerDropdown from './MessengerDropdown.jsx';
import './Header.css';

function Header({ onLogout }) {
  const { currentUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);

  return (
    <header className="top-header">
      {currentUser ? (
        <div className="header-actions">
          <div className="messenger-header-container" style={{ position: 'relative' }}>
            <button 
              className={`icon-btn ${isMessengerOpen ? 'active' : ''}`} 
              title="Tin nhắn"
              onClick={() => setIsMessengerOpen(!isMessengerOpen)}
            >
              <FiMessageSquare />
            </button>
            {isMessengerOpen && <MessengerDropdown onClose={() => setIsMessengerOpen(false)} />}
          </div>
          <NotificationBell />
          
          <div className="user-profile-container">
            <div className="user-profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="avatar"
                  className="user-avatar"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="user-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
              )}
              <span className="user-name">{currentUser.username} <span>▼</span></span>
            </div>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <Link
                  to={`/users/${currentUser._id || currentUser.id}`}
                  className="dropdown-item"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FiUser className="item-icon" /> Hồ sơ cá nhân
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <FiSettings className="item-icon" /> Cài đặt
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button 
                  className="dropdown-item text-danger" 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                >
                  <FiLogOut className="item-icon" /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="header-actions">
          <Link to="/login" className="login-btn">Đăng nhập</Link>
          <Link to="/register" className="register-btn">Đăng ký</Link>
        </div>
      )}
    </header>
  );
}

export default Header;