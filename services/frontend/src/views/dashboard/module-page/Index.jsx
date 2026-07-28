import React from 'react';
import Layout from '../../../components/layout/DashboardLayout/Layout';
import { useAuth } from '../../../stores/AuthProvider';
import EmployeeList from '../../../components/dashboard/EmployeeList/EmployeeList';
import InventoryList from '../../../components/dashboard/InventoryList/InventoryList';
import LeaveManagement from '../../../components/dashboard/LeaveManagement/LeaveManagement';
import AuditLogs from '../../../components/dashboard/AuditLogs/AuditLogs';
import SystemSettings from '../../../components/dashboard/SystemSettings/SystemSettings';
import UserProfile from '../../../components/dashboard/UserProfile/UserProfile';
import WorkLogs from '../../../components/dashboard/WorkLogs/WorkLogs';
import UserManagement from '../../../components/dashboard/UserManagement/UserManagement';
import SystemReports from '../../../components/dashboard/SystemReports/SystemReports';
import ProductManager from '../../../components/dashboard/ProductManager/ProductManager';

const ModulePage = ({ title, icon: Icon }) => {
  const { user } = useAuth();

  const renderContent = () => {
    if ((title === "Admin Control Panel" || title === "User Management") && user?.role !== 'superadmin') {
      return (
        <div className="dash-hero">
          <h1>Access denied</h1>
          <p>User Management is available only to the Super Admin.</p>
        </div>
      );
    }

    if (title === "Employee Directory") {
      return <EmployeeList />;
    }
    if (title === "Inventory Management") {
      return <InventoryList />;
    }
    if (title === "Product Management") {
      return <ProductManager />;
    }
    if (title === "Leave Management" || title === "My Leave Requests") {
      return <LeaveManagement />;
    }
    if (title === "System Audit Logs") {
      return <AuditLogs />;
    }
    if (title === "System Settings") {
      return <SystemSettings />;
    }
    if (title === "My Profile") {
      return <UserProfile />;
    }
    if (title === "My Work Logs") {
      return <WorkLogs />;
    }
    if (title === "Admin Control Panel" || title === "User Management") {
      return <UserManagement />;
    }
    if (title === "System Reports") {
      return <SystemReports />;
    }

    return (
      <>
        <div className="dash-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
             {Icon && <Icon style={{ fontSize: '2rem', color: 'var(--accent-color)' }} />}
             <h1 style={{ margin: 0 }}>{title}</h1>
          </div>
          <p>This module is currently under development. Please check back later for updates.</p>
        </div>

        <div className="stats-grid" style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <div className="stat-card">
            <div className="stat-info">
               <span className="stat-title">Feature Pending</span>
               <span className="stat-value">--</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
               <span className="stat-title">Data Loading</span>
               <span className="stat-value">...</span>
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '3rem', 
          textAlign: 'center', 
          background: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '1rem',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Implementation in Progress</h2>
          <p style={{ color: 'var(--text-muted)' }}>The core logic for <strong>{title}</strong> is being integrated into the modular backend.</p>
        </div>
      </>
    );
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

export default ModulePage;
