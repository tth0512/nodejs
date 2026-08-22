// src/components/Home.jsx
import { Link } from 'react-router-dom';
import './Home.css';

function Home({ currentUser }) {
  return (
    <div className="home-container">
      <div className="home-card">
        <h2 className="home-title">Mini Social Network</h2>
        <p className="home-desc">
          Nền tảng chia sẻ bài viết, kết nối mọi người đơn giản và bảo mật.
        </p>

        <div className="home-actions">
          <Link to="/posts" className="btn-secondary">Xem bài viết</Link>
          
          {currentUser ? (
            <Link to="/create-post" className="btn-primary">Tạo bài mới</Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary">Đăng nhập</Link>
              <Link to="/register" className="btn-secondary">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;