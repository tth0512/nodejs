import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/utils/useAuth.js';

function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const isProfileActive =
    location.pathname === '/profile' ||
    (currentUser &&
      (location.pathname === `/users/${currentUser._id || currentUser.id}` ||
        location.pathname === '/profile/edit'));

  /* ── Admin nav (chỉ hiện khi role = system_admin) ── */
  if (currentUser?.role === 'system_admin') {
    return (
      <aside className="sidebar">
        <div className="logo-container">
          <Link to="/" className="logo">UniConnect</Link>
        </div>

        {/* Divider + label */}
        <div style={{ marginTop: 28, marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', paddingLeft: 4 }}>
          Admin Panel
        </div>

        <nav className="nav-menu" style={{ marginTop: 0 }}>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">📊</span> Tổng quan
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">👥</span> Người dùng
          </NavLink>

          <NavLink
            to="/admin/posts"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">📝</span> Bài viết
          </NavLink>

          {/* Separator */}
          <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }}></div>

          <NavLink
            to="/posts"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">⬅️</span> Về trang chính
          </NavLink>
        </nav>
      </aside>
    );
  }

  /* ── User nav bình thường ── */
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <Link to="/" className="logo">
          UniConnect
        </Link>
      </div>

      <nav className="nav-menu">
        <NavLink to="/posts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="icon">🏠</span> Home
        </NavLink>
        <NavLink
          to={currentUser ? `/users/${currentUser._id || currentUser.id}` : '/profile'}
          className={() => (isProfileActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="icon">👤</span> Profile
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="icon">💬</span> Messages
        </NavLink>
        <NavLink to="/communities" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="icon">👥</span> Explore Communities
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="icon">⚙️</span> Settings
        </NavLink>
      </nav>

      {currentUser && (
        <div className="my-communities">
          <div className="communities-header">
            <h3>My Communities</h3>
            <span className="badge">19</span>
          </div>
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
  );
}

export default Sidebar;