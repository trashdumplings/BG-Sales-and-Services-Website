import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../stores/AuthProvider';
import { LuClock, LuCalendar, LuCircleCheck, LuActivity, LuInfo } from 'react-icons/lu';
import './PersonalDashboard.css';

const PersonalDashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch profile data');
      const result = await response.json();
      setData(result);
      
      // Determine if checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAtt = result.recent_attendance.find(a => a.date === todayStr);
      setAttendanceStatus(todayAtt || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleCheckIn = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/profile/attendance/check-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Check-in failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/profile/attendance/check-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Check-out failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-state">Loading dashboard...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="personal-dash-container">
      <div className="profile-header-card">
        <div className="user-info">
          <div className="user-avatar-large">
            {data.employee.name.charAt(0)}
          </div>
          <div className="user-text">
            <h1>Welcome back, {data.employee.name.split(' ')[0]}!</h1>
            <p className="user-role-dept">{data.employee.position} • {data.employee.department}</p>
          </div>
        </div>
        <div className="attendance-action">
          {!attendanceStatus?.check_in ? (
            <button className="check-btn in" onClick={handleCheckIn}>
              <LuClock /> Check In Today
            </button>
          ) : !attendanceStatus?.check_out ? (
            <button className="check-btn out" onClick={handleCheckOut}>
              <LuClock /> Check Out
            </button>
          ) : (
            <div className="checked-out-badge">
              <LuCircleCheck /> Finished for Today
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-bg hour">
            <LuClock />
          </div>
          <div className="stat-content">
            <span className="stat-label">Hours This Month</span>
            <span className="stat-val">{data.stats.hours_this_month.toFixed(1)}h</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-bg leave">
            <LuCalendar />
          </div>
          <div className="stat-content">
            <span className="stat-label">Leave Balance</span>
            <span className="stat-val">{data.stats.leave_balance} Days</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-bg rate">
            <LuActivity />
          </div>
          <div className="stat-content">
            <span className="stat-label">Attendance Rate</span>
            <span className="stat-val">{Math.round(data.stats.attendance_rate * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="dash-sections">
        <div className="attendance-log-section">
          <h3>
            <LuActivity /> Recent Attendance
          </h3>
          <div className="att-list">
            {data.recent_attendance.map((att, idx) => (
              <div key={idx} className="att-row">
                <span className="att-date">{new Date(att.date).toLocaleDateString()}</span>
                <span className={`att-status ${att.status}`}>{att.status}</span>
                <span className="att-times">
                  {att.check_in ? new Date(att.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} 
                  {' - '}
                  {att.check_out ? new Date(att.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                </span>
              </div>
            ))}
            {data.recent_attendance.length === 0 && <p className="empty-msg">No recent logs found.</p>}
          </div>
        </div>

        <div className="info-section">
          <h3><LuInfo /> Personal Details</h3>
          <div className="details-grid">
            <div className="detail">
              <label>Employee ID</label>
              <span>{data.employee.employee_id}</span>
            </div>
            <div className="detail">
              <label>Email</label>
              <span>{data.employee.email}</span>
            </div>
            <div className="detail">
              <label>Hired On</label>
              <span>{new Date(data.employee.hire_date).toLocaleDateString()}</span>
            </div>
            <div className="detail">
              <label>Account Status</label>
              <span className={`status-${data.employee.status}`}>{data.employee.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;
