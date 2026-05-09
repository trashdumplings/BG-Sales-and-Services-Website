import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../stores/AuthProvider';
import logo from '../../../assets/logo.png';
import { 
  LuLayoutDashboard, 
  LuUser, 
  LuCalendarDays, 
  LuClipboardList, 
  LuPackage, 
  LuUsers, 
  LuShieldCheck, 
  LuSettings, 
  LuLogOut,
  LuHistory,
  LuMoon,
  LuSun
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import './layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  const [theme, setTheme] = React.useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('theme') || 'light';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const menuItems = [
    { name: 'Overview', path: `/dashboard/${role}`, icon: LuLayoutDashboard, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'My Profile', path: '/dashboard/profile', icon: LuUser, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'My Leave', path: '/dashboard/leave/my', icon: LuCalendarDays, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'Work Logs', path: '/dashboard/logs/my', icon: LuClipboardList, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'My Assets', path: '/dashboard/assets/my', icon: LuPackage, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    
    { name: 'Employees', path: '/dashboard/employees', icon: LuUsers, roles: ['hr', 'admin', 'superadmin'] },
    { name: 'Leave Mgt', path: '/dashboard/leave', icon: LuCalendarDays, roles: ['hr', 'superadmin'] },
    { name: 'Inventory', path: '/dashboard/inventory', icon: LuPackage, roles: ['admin', 'superadmin'] },
    { name: 'Reports', path: '/dashboard/reports', icon: FiBarChart2, roles: ['hr', 'admin', 'superadmin'] },
    
    { name: 'Admin', path: '/dashboard/admin-panel', icon: LuShieldCheck, roles: ['admin', 'superadmin'] },
    { name: 'System Logs', path: '/dashboard/audit', icon: LuHistory, roles: ['superadmin'] },
    { name: 'Settings', path: '/dashboard/settings', icon: LuSettings, roles: ['superadmin'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(role));
  const currentPage = menuItems.find(i => window.location.pathname === i.path)?.name || 'Overview';
  const ThemeIcon = theme === 'dark' ? LuSun : LuMoon;

  return (
    <div className="dash-wrap">
      <aside className="dash-aside">
        <div className="brand">
          <img src={logo} alt="" className="brand-logo" />
          <div>
            <strong>BG Services</strong>
            <span>Operations Portal</span>
          </div>
        </div>
        <div className="user">
          <div className="user-avatar">{user?.name?.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{role}</span>
          </div>
        </div>
        <nav className="dash-nav">
          {allowedItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === `/dashboard/${role}`}
            >
              <item.icon className="nav-icon" />
              <span>{item.name}</span>
            </NavLink>
          ))}
          
          <button onClick={logout} className="logout-btn">
            <LuLogOut className="nav-icon" />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <div className="header-page-title">Dashboard</div>
            <div className="header-current">{currentPage}</div>
          </div>
          <button
            type="button"
            className="dash-theme-toggle"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <ThemeIcon />
          </button>
        </header>
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
}
