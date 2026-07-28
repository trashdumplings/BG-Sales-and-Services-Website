import React from 'react';
import Layout from '../../../components/layout/DashboardLayout/Layout';
import { useAuth } from '../../../stores/AuthProvider';
import { 
  LuUsers, 
  LuShieldAlert, 
  LuActivity, 
  LuDatabase, 
  LuSettings, 
  LuHistory 
} from 'react-icons/lu';

export default function Admin() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  
  const stats = [
    { title: 'Total Users', value: '124', icon: LuUsers, color: '#38bdf8' },
    { title: 'Security Alerts', value: '2', icon: LuShieldAlert, color: '#f43f5e' },
    { title: 'System Load', value: '18%', icon: LuActivity, color: '#22c55e' },
    { title: 'DB Queries', value: '1.2k/h', icon: LuDatabase, color: '#fbbf24' },
  ];

  return (
    <Layout>
      <div className="dash-hero">
        <h1>Welcome back, Super Admin!</h1>
        <p>System status is nominal. All services are currently operational.</p>
      </div>

      {isSuperAdmin && (
        <div className="alert-banner success">
          <LuShieldAlert className="alert-icon" />
          <span>Super Admin Mode: Full system access and audit logging enabled.</span>
        </div>
      )}

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
        {isSuperAdmin && (
          <div className="card action-card">
            <LuUsers className="card-icon" />
            <h3>Manage Users</h3>
            <p>Create, update or deactivate user accounts.</p>
          </div>
        )}
        <div className="card action-card">
          <LuHistory className="card-icon" />
          <h3>System Audit</h3>
          <p>Review system-wide activity logs and changes.</p>
        </div>
        {isSuperAdmin && (
          <>
            <div className="card action-card">
              <LuSettings className="card-icon" />
              <h3>Global Settings</h3>
              <p>Configure system-wide parameters and features.</p>
            </div>
            <div className="card action-card">
              <LuShieldAlert className="card-icon" />
              <h3>Permissions</h3>
              <p>Manage administrative roles and access levels.</p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
