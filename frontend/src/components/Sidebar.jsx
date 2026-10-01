import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/utils/useAuth.js';

function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const isProfileActive =
    location.pathname === '/profile' ||
    (currentUser &&
      (location.pathname === `/users/${currentUser._id || currentUser.id}` ||
        location.pathname === '/profile/edit'));

  /* ── Admin nav (chỉ hiện khi role = system_admin) ── */
  if (currentUser?.role === 'system_admin') {
    return (
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="logo-container">
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            <FiMenu />
          </button>
          {!isCollapsed ? (
            <Link to="/" className="logo">Uni<span>Connect</span></Link>
          ) : (
            <Link to="/" className="logo logo-mini" title="UniConnect">U<span>C</span></Link>
          )}
        </div>

        {/* Divider + label */}
        {!isCollapsed && (
          <div className="admin-panel-label" style={{ marginTop: 28, marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', paddingLeft: 4 }}>
            Admin Panel
          </div>
        )}

        <nav className="nav-menu" style={{ marginTop: isCollapsed ? 20 : 0 }}>
          <NavLink
            to="/admin"
            end
            title={isCollapsed ? "Tổng quan" : undefined}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">📊</span>
            <span className="nav-text">Tổng quan</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            title={isCollapsed ? "Người dùng" : undefined}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">👥</span>
            <span className="nav-text">Người dùng</span>
          </NavLink>

          <NavLink
            to="/admin/posts"
            title={isCollapsed ? "Bài viết" : undefined}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">📝</span>
            <span className="nav-text">Bài viết</span>
          </NavLink>

          {/* Separator */}
          <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0', width: '100%' }}></div>

          <NavLink
            to="/posts"
            title={isCollapsed ? "Về trang chính" : undefined}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="icon">⬅️</span>
            <span className="nav-text">Về trang chính</span>
          </NavLink>
        </nav>
      </aside>
    );
  }

  /* ── User nav bình thường ── */
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="logo-container">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
        >
          <FiMenu />
        </button>
        {!isCollapsed ? (
          <Link to="/" className="logo">
            Uni<span>Connect</span>
          </Link>
        ) : (
          <Link to="/" className="logo logo-mini" title="UniConnect">
            U<span>C</span>
          </Link>
        )}
      </div>

      <nav className="nav-menu">
        <NavLink
          to="/posts"
          title={isCollapsed ? "Home" : undefined}
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="icon">🏠</span>
          <span className="nav-text">Home</span>
        </NavLink>
        <NavLink
          to={currentUser ? `/users/${currentUser._id || currentUser.id}` : '/profile'}
          title={isCollapsed ? "Profile" : undefined}
          className={() => (isProfileActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="icon">👤</span>
          <span className="nav-text">Profile</span>
        </NavLink>
        <NavLink
          to="/messages"
          title={isCollapsed ? "Messages" : undefined}
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="icon">💬</span>
          <span className="nav-text">Messages</span>
        </NavLink>
        <NavLink
          to="/communities"
          title={isCollapsed ? "Explore Communities" : undefined}
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="icon">👥</span>
          <span className="nav-text">Explore Communities</span>
        </NavLink>
        <NavLink
          to="/settings"
          title={isCollapsed ? "Settings" : undefined}
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="icon">⚙️</span>
          <span className="nav-text">Settings</span>
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