import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isMock } from '../api';
import Icon from '/Icon';
import { Avatar } from './ui';

const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/admin/teachers', label: 'Teachers', icon: 'teacher' },
    { to: '/admin/students', label: 'Students', icon: 'users' },
    { to: '/admin/settings', label: 'System Settings', icon: 'settings' },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/teacher/courses', label: 'My Courses', icon: 'book' },
    { to: '/teacher/assignments', label: 'Assignments', icon: 'file' },
    { to: '/teacher/reports', label: 'Similarity Reports', icon: 'report' },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/student/assignments', label: 'Assignments', icon: 'file' },
    { to: '/student/submissions', label: 'My Submissions', icon: 'upload' },
    { to: '/student/courses', label: 'My Courses', icon: 'book' },
  ],
};

const ROLE_LABEL = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`shell ${open ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="shield" size={18} />
          </span>
          <span className="brand-name">IntegrityCheck</span>
        </div>
        <div className="role-chip">{ROLE_LABEL[user.role]} portal</div>
        <nav className="nav">
          {NAV[user.role].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/account" className="nav-link">
            <Icon name="key" />
            <span>My Account</span>
          </NavLink>
          <button className="nav-link nav-button" onClick={handleLogout}>
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          {isMock && <span className="demo-pill">Demo data</span>}
          <div className="topbar-spacer" />
          <div className="topbar-user">
            <div className="topbar-user-text">
              <strong>{user.name}</strong>
              <span>{ROLE_LABEL[user.role]}</span>
            </div>
            <Avatar name={user.name} />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}