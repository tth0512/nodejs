// src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import CreatePost from './components/CreatePost.jsx';
import PostList from './components/PostList.jsx';
import axiosClient from './api/axiosClient.js';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        setCurrentUser(res.data.user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
      setCurrentUser(null);
      toast.info('Đã đăng xuất!');
      navigate('/login');
    } catch (error) {
      toast.error('Lỗi khi đăng xuất');
    }
  };

  // Giữ lại Header khi đang loading để giao diện không bị trắng bóc
  if (isAuthLoading) {
    return (
      <div className="app-wrapper">
        <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className="universe-layout">
      {/* CỘT TRÁI: SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-container">
          <Link to="/" className="logo">
            Uni<span>verse</span>
          </Link>
        </div>

        <nav className="nav-menu">
          <Link to="/posts" className="nav-link active">
            <span className="icon">🏠</span> Home
          </Link>
          <Link to="/profile" className="nav-link">
            <span className="icon">👤</span> Profile
          </Link>
          <Link to="/communities" className="nav-link">
            <span className="icon">👥</span> Explore Communities
          </Link>
          <Link to="/settings" className="nav-link">
            <span className="icon">⚙️</span> Settings
          </Link>
        </nav>

        {currentUser && (
          <div className="my-communities">
            <div className="communities-header">
              <h3>My Communities</h3>
              <span className="badge">19</span>
            </div>
            {/* Dummy data cho danh sách nhóm */}
            <div className="community-item">
              <div className="avatar">W</div>
              <div className="info">
                <h4>Websters Shivaji</h4>
                <p>764 members</p>
              </div>
            </div>
            <button className="see-all-btn">See All</button>
          </div>
        )}
      </aside>

      {/* KHỐI BÊN PHẢI: HEADER + CONTENT */}
      <div className="main-wrapper">
        {/* THANH TRÊN CÙNG: HEADER */}
        <header className="top-header">
          {currentUser ? (
            <div className="header-actions">
              <button className="icon-btn">💬</button>
              <button className="icon-btn">🔔</button>
              <div className="user-profile-dropdown" onClick={handleLogout}>
                <div className="user-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
                <span className="user-name">{currentUser.username} <span>▼</span></span>
              </div>
            </div>
          ) : (
            <div className="header-actions">
              <Link to="/login" className="login-btn">Đăng nhập</Link>
              <Link to="/register" className="register-btn">Đăng ký</Link>
            </div>
          )}
        </header>

        {/* KHU VỰC NỘI DUNG CHÍNH (Cột giữa + Cột phải) */}
        <main className="content-area">
          <div className="feed-container">
            {/* Định tuyến các trang vào đây */}
            <Routes>
              <Route path="/" element={<Navigate to="/posts" />} />
              <Route path="/posts" element={<PostList currentUser={currentUser} />} />
              <Route path="/login" element={currentUser ? <Navigate to="/posts" /> : <Login onLoginSuccess={(user) => setCurrentUser(user)} />} />
              <Route path="/register" element={currentUser ? <Navigate to="/posts" /> : <Register />} />
              <Route path="/create-post" element={currentUser ? <CreatePost /> : <Navigate to="/login" />} />
            </Routes>
          </div>

          {/* CỘT PHẢI (Chỉ hiện khi ở màn hình lớn) */}
          <div className="right-panel">
            <div className="widget">
              <h3>Based on your communities</h3>
              {/* Sẽ render danh sách gợi ý nhóm ở đây */}
              <div className="widget-placeholder">List communities...</div>
            </div>
            <div className="widget">
              <h3>People you may know</h3>
              {/* Sẽ render danh sách gợi ý kết bạn ở đây */}
              <div className="widget-placeholder">List people...</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;