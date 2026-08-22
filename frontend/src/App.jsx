// src/App.jsx
import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import CreatePost from './components/CreatePost.jsx';
import PostList from './components/PostList.jsx';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="app-wrapper">
      {/* Navbar Điều Hướng */}
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

      {/* Định tuyến các trang */}
      <main>
        <Routes>
          <Route path="/" element={<Home currentUser={currentUser} />} />
          <Route path="/posts" element={<PostList currentUser={currentUser} />} />
          <Route path="/login" element={<Login onLoginSuccess={(user) => setCurrentUser(user)} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create-post" element={<CreatePost />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;