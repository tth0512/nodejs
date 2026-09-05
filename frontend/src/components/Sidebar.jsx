import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/utils/useAuth.js';

function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const isProfileActive =
    location.pathname === '/profile' ||
    (currentUser &&
      (location.pathname === `/users/${currentUser._id}` ||
        location.pathname === '/profile/edit'));

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <Link to="/" className="logo">
          UniConnect
        </Link>
      </div>

      <nav className="nav-menu">
        {/* Dùng NavLink thay cho Link để tự động bắt class 'active' */}
        <NavLink to="/posts" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="icon">🏠</span> Home
        </NavLink>
        <NavLink
          to={currentUser ? `/users/${currentUser._id}` : '/profile'}
          className={() => (isProfileActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="icon">👤</span> Profile
        </NavLink>
        <NavLink to="/communities" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="icon">👥</span> Explore Communities
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
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