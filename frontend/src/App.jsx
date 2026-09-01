// src/App.jsx
import { useNavigate, Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/utils/useAuth.js';
import { toast } from 'react-toastify';
import axiosClient from './api/axiosClient.js';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import CreatePost from './components/CreatePost.jsx';
import EditPost from './components/EditPost.jsx';
import PostList from './components/PostList.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Profile from './components/Profile.jsx';
import './App.css';

function App() {
  const { currentUser, isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Đã đăng xuất!');
      navigate('/login');
    } catch (error) {
      toast.error('Lỗi khi đăng xuất');
    }
  };

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
      <Sidebar />

      {/* KHỐI BÊN PHẢI: HEADER + CONTENT */}
      <div className="main-wrapper">
        <Header onLogout={handleLogout} />

        <main className="content-area">
          <div className="feed-container">
            <Routes>
              <Route path="/" element={<Navigate to="/posts" />} />
              <Route path="/posts" element={<PostList />} />
              <Route path="/edit-post/:postId" element={currentUser ? <EditPost /> : <Navigate to="/login" />} />
              <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/login" element={currentUser ? <Navigate to="/posts" /> : <Login />} />
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