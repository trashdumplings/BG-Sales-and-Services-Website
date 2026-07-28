import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../stores/AuthProvider';
import logo from '../../../assets/bg-logo.jpg';
import {
  LuArrowLeft,
  LuBell,
  LuCalendarDays,
  LuChevronDown,
  LuClipboardList,
  LuGauge,
  LuLogOut,
  LuMenu,
  LuMoon,
  LuShoppingBag,
  LuSun,
  LuUser,
  LuUsers,
  LuX,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import './layout.css';
import './ModernDashboard.css';

const roleLabel = {
  superadmin: 'Super Admin',
  hr: 'HR',
  employee: 'Employee',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role;
  const profileMenuRef = React.useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('theme') || 'light';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [profileMenuOpen]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('dashboard-menu-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('dashboard-menu-open');
    };
  }, [mobileMenuOpen]);

  const handleProfile = () => {
    setProfileMenuOpen(false);
    navigate('/dashboard/profile');
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { name: 'Dashboard', path: `/dashboard/${role}`, icon: LuGauge, roles: ['employee', 'hr', 'superadmin'] },
    { name: 'User Management', path: '/dashboard/admin-panel', icon: LuUsers, roles: ['superadmin'] },
    { name: 'Work Logs', path: '/dashboard/logs/my', icon: LuClipboardList, roles: ['employee', 'hr', 'superadmin'] },
    { name: 'Leave', path: role === 'employee' ? '/dashboard/leave/my' : '/dashboard/leave', icon: LuCalendarDays, roles: ['employee', 'hr', 'superadmin'] },
    { name: 'Products', path: '/dashboard/products', icon: LuShoppingBag, roles: ['employee', 'hr', 'superadmin'], permission: 'products' },
    { name: 'Reports', path: '/dashboard/reports', icon: FiBarChart2, roles: ['employee', 'hr', 'superadmin'], permission: 'reports' },
  ];

  const defaultRolePermission = (permission) => role === 'hr' && permission === 'reports';
  const allowedItems = menuItems.filter((item) => item.roles.includes(role) && (
    !item.permission
    || role === 'superadmin'
    || defaultRolePermission(item.permission)
    || (user?.module_permissions || []).includes(item.permission)
  ));
  const currentLocation = `${location.pathname}${location.search}`;
  const currentPage = location.pathname === '/dashboard/profile' ? 'My Profile'
    : menuItems.find((item) => currentLocation === item.path)?.name
    || menuItems.find((item) => location.pathname === item.path.split('?')[0])?.name
    || 'Dashboard';
  const ThemeIcon = theme === 'dark' ? LuSun : LuMoon;
  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <div className="dash-wrap">
      <a className="dash-skip-link" href="#dashboard-content">Skip to dashboard content</a>
      <aside className={`dash-aside ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Portal sidebar">
        <div className="brand">
          <img src={logo} alt="" className="brand-logo" />
          <strong>BG Portal</strong>
          <button type="button" className="dash-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">
            <LuX />
          </button>
        </div>

        <nav className="dash-nav" aria-label="Dashboard navigation">
          {allowedItems.map((item) => (
            <Link
              key={`${item.name}-${item.path}`}
              to={item.path}
              className={`nav-link ${item.nested ? 'nav-link--nested' : ''} ${currentLocation === item.path ? 'active' : ''}`}
              aria-current={currentLocation === item.path ? 'page' : undefined}
            >
              <item.icon className="nav-icon" aria-hidden="true" />
              <span>{item.name}</span>
              {item.hasChildren ? <LuChevronDown className="nav-chevron" /> : null}
            </Link>
          ))}

        </nav>
      </aside>
      {mobileMenuOpen ? <button type="button" className="dash-menu-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" /> : null}

      <main className="dash-main" id="dashboard-content" tabIndex="-1">
        <header className="dash-header">
          <div className="dash-header__title">
            <button type="button" className="dash-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" aria-expanded={mobileMenuOpen}>
              <LuMenu />
            </button>
            <button type="button" className="dash-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
              <LuArrowLeft />
            </button>
            <h1>{currentPage}</h1>
          </div>

          <div className="dash-header__actions">
            <button type="button" className="dash-icon-btn" aria-label="Notifications" title="Notifications">
              <LuBell />
              <span className="dash-notification-count">0</span>
            </button>
            <button
              type="button"
              className="dash-icon-btn"
              onClick={() => setTheme((previous) => previous === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <ThemeIcon />
            </button>
            <div className="dash-profile-menu" ref={profileMenuRef}>
              <button
                type="button"
                className="dash-profile"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <div className="dash-avatar">{initials}</div>
                <div>
                  <strong>{role === 'superadmin' ? 'Administrator' : user?.name}</strong>
                  <span>{roleLabel[role] || role}</span>
                </div>
                <LuChevronDown className={`dash-profile-chevron ${profileMenuOpen ? 'is-open' : ''}`} />
              </button>

              {profileMenuOpen ? (
                <div className="dash-profile-dropdown" role="menu">
                  <button type="button" role="menuitem" onClick={handleProfile}>
                    <LuUser />
                    <span>Profile</span>
                  </button>
                  <button type="button" role="menuitem" className="is-danger" onClick={handleLogout}>
                    <LuLogOut />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
}
