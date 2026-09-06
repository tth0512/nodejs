// src/App.jsx
import { useNavigate, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/utils/useAuth.js';
import { toast } from 'react-toastify';
import axiosClient from './api/axiosClient.js';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import CreatePost from './components/CreatePost.jsx';
import PostList from './components/PostList.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import EditProfile from './components/EditProfile.jsx';
import Messages from './components/Messages.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import './App.css';

function App() {
  const { currentUser, isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isFullWidthRoute =
    location.pathname.startsWith('/users/') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/messages');

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
    <SocketProvider currentUser={currentUser}>
      <div className="universe-layout">
        {/* CỘT TRÁI: SIDEBAR */}
        <Sidebar />

        {/* KHỐI BÊN PHẢI: HEADER + CONTENT */}
        <div className="main-wrapper">
          <Header onLogout={handleLogout} />

          <main className={`content-area ${isFullWidthRoute ? 'content-area--full' : ''}`}>
            <div className={`feed-container ${isFullWidthRoute ? 'feed-container--full' : ''}`}>
              <Routes>
                <Route path="/" element={<Navigate to="/posts" />} />
                <Route path="/posts" element={<PostList />} />
                <Route
                  path="/profile"
                  element={
                    currentUser ? (
                      <Navigate to={`/users/${currentUser._id || currentUser.id}`} replace />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route path="/users/:userId" element={<ProfilePage />} />
                <Route
                  path="/profile/edit"
                  element={currentUser ? <EditProfile /> : <Navigate to="/login" />}
                />
                <Route path="/login" element={currentUser ? <Navigate to="/posts" /> : <Login />} />
                <Route path="/register" element={currentUser ? <Navigate to="/posts" /> : <Register />} />
                <Route path="/create-post" element={currentUser ? <CreatePost /> : <Navigate to="/login" />} />
                <Route path="/messages" element={currentUser ? <Messages /> : <Navigate to="/login" />} />
                <Route path="/messages/new/:newUserId" element={currentUser ? <Messages /> : <Navigate to="/login" />} />
                <Route path="/messages/:conversationId" element={currentUser ? <Messages /> : <Navigate to="/login" />} />
              </Routes>
            </div>

            {/* CỘT PHẢI (Ẩn trên trang Profile & Messages để mở rộng toàn bộ không gian) */}
            {!isFullWidthRoute && (
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
            )}
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}

export default App;