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
        console.error('Lỗi khi lấy thông tin người dùng:', error);
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
      console.error('Lỗi khi đăng xuất:', error);
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
    <div className="app-wrapper">
      <header className="app-header">
        <Link to="/" className="logo-link">
          <h1 className="app-title">Mini Social</h1>
        </Link>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">Trang chủ</Link>
          <Link to="/posts" className="nav-link">Bài viết</Link>

          {currentUser ? (
            <>
              <Link to="/create-post" className="nav-link">Tạo bài</Link>
              <span className="user-badge">Chào, <b>{currentUser.username}</b></span>
              <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Đăng nhập</Link>
              <Link to="/register" className="nav-link">Đăng ký</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home currentUser={currentUser} />} />
          <Route path="/posts" element={<PostList currentUser={currentUser} />} />
          
          {/* Chuyển hướng người dùng đã login nếu họ lỡ bấm vào /login hoặc /register */}
          <Route path="/login" element={currentUser ? <Navigate to="/posts" /> : <Login onLoginSuccess={(user) => setCurrentUser(user)} />} />
          <Route path="/register" element={currentUser ? <Navigate to="/posts" /> : <Register />} />
          
          {/* BẢO VỆ ROUTE: Chặn người dùng chưa đăng nhập gõ URL vào thẳng trang tạo bài */}
          <Route path="/create-post" element={currentUser ? <CreatePost /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;