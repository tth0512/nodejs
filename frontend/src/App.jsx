// src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import CreatePost from './components/CreatePost.jsx';
import PostList from './components/PostList.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Profile from './components/Profile.jsx';
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
      <Sidebar currentUser={currentUser} />

      {/* KHỐI BÊN PHẢI: HEADER + CONTENT */}
      <div className="main-wrapper">
        <Header currentUser={currentUser} onLogout={handleLogout} />

        <main className="content-area">
          <div className="feed-container">
             <Routes>
                <Route path="/" element={<Navigate to="/posts" />} />
                <Route path="/posts" element={<PostList currentUser={currentUser} />} />
                <Route path="/profile" element={currentUser ? <Profile currentUser={currentUser} /> : <Navigate to="/login" />} />
                <Route path="/login" element={currentUser ? <Navigate to="/posts" /> : <Login onLoginSuccess={setCurrentUser} />} />
                <Route path="/register" element={currentUser ? <Navigate to="/posts" /> : <Register />} />
                <Route path="/create-post" element={currentUser ? <CreatePost /> : <Navigate to="/login" />} />
              </Routes>
          </div>

          {/* CỘT PHẢI */}
          <div className="right-panel">
            <div className="widget">
              <h3>Based on your communities</h3>
              <div className="widget-placeholder">List communities...</div>
            </div>
            <div className="widget">
              <h3>People you may know</h3>
              <div className="widget-placeholder">List people...</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;