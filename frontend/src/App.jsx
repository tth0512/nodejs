// src/App.jsx
import { useNavigate, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/utils/useAuth.js';
import { toast } from 'react-toastify';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import VerifyEmail from './components/VerifyEmail.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import CreatePost from './components/CreatePost.jsx';
import PostList from './components/PostList.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import EditProfile from './components/EditProfile.jsx';
import Messages from './components/Messages.jsx';
import AdminOverview from './components/admin/AdminOverview.jsx';
import UserManagement from './components/admin/UserManagement.jsx';
import PostManagement from './components/admin/PostManagement.jsx';
import PhotoModal from './components/PhotoModal.jsx';
import PhotoPage from './components/PhotoPage.jsx';
import PostDetailModal from './components/PostDetailModal.jsx';
import CommunityList from './components/community/CommunityList.jsx';
import CommunityDetail from './components/community/CommunityDetail.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import './App.css';

function App() {
  const { currentUser, isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Background location pattern for modals
  const backgroundLocation = location.state?.backgroundLocation;

  const isAdmin = currentUser?.role === 'system_admin';

  // Admin routes mở rộng feed full (không có right panel)
  const isAdminRoute = location.pathname.startsWith('/admin');

  const isMessagesRoute = location.pathname.startsWith('/messages');

  const isPhotoRoute = /^\/photo\/[^/]+$/.test(location.pathname);

  const isFullWidthRoute =
    isAdminRoute ||
    location.pathname.startsWith('/users/') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/communities') ||
    isMessagesRoute ||
    (isPhotoRoute && !backgroundLocation);

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
        {/* CỘT TRÁI: SIDEBAR — tự render admin nav khi role = system_admin */}
        <Sidebar />

        {/* KHỐI BÊN PHẢI: HEADER + CONTENT */}
        <div className="main-wrapper">
          <Header onLogout={handleLogout} />

          <main className={`content-area ${isFullWidthRoute ? 'content-area--full' : ''} ${isMessagesRoute ? 'content-area--messages' : ''}`}>
            <div className={`feed-container ${isFullWidthRoute ? 'feed-container--full' : ''} ${isMessagesRoute ? 'feed-container--messages' : ''}`}>
              <Routes location={backgroundLocation || location}>
                {/* ─── User routes ─── */}
                <Route path="/" element={<Navigate to="/posts" />} />
                <Route path="/posts" element={<PostList />} />
                <Route path="/posts/:postId" element={<PostDetailModal />} />
                <Route path="/photo/:postId" element={<PhotoPage />} />
                <Route path="/communities" element={<CommunityList />} />
                <Route path="/communities/:communityId" element={<CommunityDetail />} />
                <Route
                  path="/profile"
                  element={
                    currentUser
                      ? <Navigate to={`/users/${currentUser._id || currentUser.id}`} replace />
                      : <Navigate to="/login" />
                  }
                />
                <Route path="/users/:userId" element={<ProfilePage />} />
                <Route path="/profile/edit" element={currentUser ? <EditProfile /> : <Navigate to="/login" />} />
                <Route path="/login"    element={currentUser ? <Navigate to="/posts" /> : <Login />} />
                <Route path="/register" element={currentUser ? <Navigate to="/posts" /> : <Register />} />
                <Route path="/verify-email" element={currentUser ? <Navigate to="/posts" /> : <VerifyEmail />} />
                <Route path="/forgot-password" element={currentUser ? <Navigate to="/posts" /> : <ForgotPassword />} />
                <Route path="/create-post" element={currentUser ? <CreatePost /> : <Navigate to="/login" />} />
                <Route path="/messages"                element={currentUser ? <Messages /> : <Navigate to="/login" />} />
                <Route path="/messages/new/:newUserId" element={currentUser ? <Messages /> : <Navigate to="/login" />} />
                <Route path="/messages/:conversationId" element={currentUser ? <Messages /> : <Navigate to="/login" />} />

                {/* ─── Admin routes (chỉ dành cho system_admin) ─── */}
                <Route path="/admin" element={isAdmin ? <AdminOverview /> : <Navigate to="/posts" />} />
                <Route path="/admin/users" element={isAdmin ? <UserManagement currentAdmin={currentUser} /> : <Navigate to="/posts" />} />
                <Route path="/admin/posts" element={isAdmin ? <PostManagement /> : <Navigate to="/posts" />} />
              </Routes>
            </div>

            {/* CỘT PHẢI — ẩn trên trang admin, profile, messages, photo */}
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

      {/* ── Modal Routes (chỉ render khi có backgroundLocation) ── */}
      {backgroundLocation && (
        <Routes>
          <Route path="/posts/:postId" element={<PostDetailModal />} />
          <Route path="/photo/:postId" element={<PhotoModal />} />
        </Routes>
      )}
    </SocketProvider>
  );
}

export default App;