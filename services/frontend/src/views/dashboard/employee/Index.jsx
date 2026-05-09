import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../../components/layout/DashboardLayout/Layout';
import { useAuth } from '../../../stores/AuthProvider';
import { 
  LuCalendarDays, 
  LuPackage, 
  LuClipboardCheck, 
  LuUser
} from 'react-icons/lu';

export default function Employee() {
  const { user } = useAuth();

  const stats = [
    { title: 'Leave Balance', value: '18 Days', icon: LuCalendarDays, color: '#38bdf8' },
    { title: 'Assigned Assets', value: '4', icon: LuPackage, color: '#22c55e' },
    { title: 'Open Tasks', value: '3', icon: LuClipboardCheck, color: '#fbbf24' },
  ];

  const quickActions = [
    {
      title: 'Request Leave',
      description: 'Submit a new leave application for approval.',
      icon: LuCalendarDays,
      path: '/dashboard/leave/my',
    },
    {
      title: 'Work Logs',
      description: 'Submit your daily progress and work hours.',
      icon: LuClipboardCheck,
      path: '/dashboard/logs/my',
    },
    {
      title: 'Profile',
      description: 'Update your personal information and contact details.',
      icon: LuUser,
      path: '/dashboard/profile',
    },
  ];

  return (
    <Layout>
      <div className="dash-hero">
        <h1>Hello, {user?.name.split(' ')[0]}!</h1>
        <p>You have 3 tasks pending for today. Have a great day at work!</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon />
            </div>
            <div className="stat-info">
              <span className="stat-title">{stat.title}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Quick Actions</h2>
      <div className="card-grid">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path} className="card action-card">
            <action.icon className="card-icon" />
            <h3>{action.title}</h3>
            <p>{action.description}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
