// src/components/Header.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/utils/useAuth.js';
import NotificationBell from './NotificationBell.jsx';
import './Header.css';

function Header({ onLogout }) {
  const { currentUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="top-header">
      {currentUser ? (
        <div className="header-actions">
          <button className="icon-btn" title="Tin nhắn">
            <FiMessageSquare />
          </button>
          <NotificationBell />
          
          <div className="user-profile-container">
            <div className="user-profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="user-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
              <span className="user-name">{currentUser.username} <span>▼</span></span>
            </div>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
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