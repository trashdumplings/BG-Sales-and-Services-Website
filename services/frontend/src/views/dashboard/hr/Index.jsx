import React from 'react';
import Layout from '../../../components/layout/DashboardLayout/Layout';
import { useAuth } from '../../../stores/AuthProvider';
import { 
  LuUsers, 
  LuCalendarDays, 
  LuHistory 
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';

export default function HR() {
  const { user } = useAuth();

  const stats = [
    { title: 'Total Employees', value: '86', icon: LuUsers, color: '#38bdf8' },
    { title: 'Pending Leaves', value: '12', icon: LuCalendarDays, color: '#f43f5e' },
    { title: 'Active Reports', value: '5', icon: FiBarChart2, color: '#22c55e' },
  ];

  return (
    <Layout>
      <div className="dash-hero">
        <h1>Welcome back, HR!</h1>
        <p>There are 12 leave requests awaiting your approval. 2 reports were generated today.</p>
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

      <h2 className="section-title">HR Management</h2>
      <div className="card-grid">
        <div className="card action-card">
          <LuCalendarDays className="card-icon" />
          <h3>Leave Requests</h3>
          <p>Review, approve or reject employee leave applications.</p>
        </div>
        <div className="card action-card">
          <LuUsers className="card-icon" />
          <h3>Employee Directory</h3>
          <p>Manage employee records, contracts and information.</p>
        </div>
        <div className="card action-card">
          <FiBarChart2 className="card-icon" />
          <h3>HR Reports</h3>
          <p>Generate and view attendance and leave reports.</p>
        </div>
      </div>
    </Layout>
  );
}
