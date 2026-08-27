import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  LuActivity,
  LuBriefcaseBusiness,
  LuCalendarDays,
  LuCheck,
  LuClock3,
  LuEye,
  LuEyeOff,
  LuLaptop,
  LuLockKeyhole,
  LuMail,
  LuMapPin,
  LuPhone,
  LuRefreshCw,
  LuShieldCheck,
  LuUserRound,
} from 'react-icons/lu';
import { useAuth } from '../../../stores/AuthProvider';
import {
  apiChangePassword,
  apiProfile,
  apiRevokeSession,
  apiSessions,
  apiUpdateProfile,
} from '../../../utils/api';
import './UserProfile.css';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LuUserRound },
  { id: 'details', label: 'Personal details', icon: LuBriefcaseBusiness },
  { id: 'security', label: 'Security', icon: LuShieldCheck },
];

const roleLabels = { superadmin: 'Super Admin', hr: 'Human Resources', employee: 'Employee' };

function formatDate(value, includeTime = false) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return 'Not checked in';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function sessionName(userAgent = '') {
  const browser = userAgent.includes('Edg/') ? 'Microsoft Edge'
    : userAgent.includes('Chrome/') ? 'Google Chrome'
      : userAgent.includes('Firefox/') ? 'Mozilla Firefox'
        : userAgent.includes('Safari/') ? 'Safari' : 'Web browser';
  const device = /Mobile|Android|iPhone/i.test(userAgent) ? 'Mobile device' : 'Desktop device';
  return `${browser} · ${device}`;
}

function decodeSessionId(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(payload)).sid;
  } catch {
    return null;
  }
}

export default function UserProfile() {
  const { user, token, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [profile, setProfile] = React.useState(null);
  const [sessions, setSessions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [details, setDetails] = React.useState({ name: '', phone: '' });
  const [passwords, setPasswords] = React.useState({ current_password: '', new_password: '', confirm: '' });
  const currentSessionId = React.useMemo(() => decodeSessionId(token || ''), [token]);

  const loadProfile = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [profileData, sessionData] = await Promise.all([apiProfile(token), apiSessions(token)]);
      setProfile(profileData);
      setSessions(sessionData);
      setDetails({
        name: profileData.account?.name || user?.name || '',
        phone: profileData.employee?.phone || '',
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, user?.name]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveDetails = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiUpdateProfile(token, { name: details.name, phone: details.phone || null });
      await refreshSession();
      await loadProfile();
      setNotice('Your profile was updated successfully.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (passwords.new_password !== passwords.confirm) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await apiChangePassword(token, {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      await logout();
      navigate('/login', { replace: true, state: { message: 'Password updated. Please sign in again.' } });
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };

  const revokeSession = async (sessionId) => {
    setError('');
    try {
      await apiRevokeSession(token, sessionId);
      if (sessionId === currentSessionId) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }
      setSessions((items) => items.map((item) => (
        item.id === sessionId ? { ...item, revoked_at: new Date().toISOString() } : item
      )));
      setNotice('Session access has been revoked.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading" role="status">
        <LuRefreshCw aria-hidden="true" />
        <span>Loading your profile…</span>
      </div>
    );
  }

  const account = profile?.account || user || {};
  const employee = profile?.employee;
  const stats = profile?.stats || {};
  const initials = (account.name || 'User').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section className="user-profile" aria-labelledby="profile-title">
      <header className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div className="profile-identity">
          <span className="profile-eyebrow">My account</span>
          <h2 id="profile-title">{account.name}</h2>
          <div className="profile-meta">
            <span>{roleLabels[account.role] || account.role}</span>
            {employee?.department ? <><i aria-hidden="true" /> <span>{employee.department}</span></> : null}
            {employee?.employee_id ? <><i aria-hidden="true" /> <span>#{employee.employee_id}</span></> : null}
          </div>
        </div>
        <span className={`profile-status ${account.is_active === false ? 'is-inactive' : ''}`}>
          <LuCheck aria-hidden="true" /> {account.is_active === false ? 'Inactive' : 'Active account'}
        </span>
      </header>

      <nav className="profile-tabs" aria-label="Profile sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'is-active' : ''}
            onClick={() => { setActiveTab(tab.id); setError(''); setNotice(''); }}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <tab.icon aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </nav>

      {error ? <div className="profile-alert is-error" role="alert">{error}</div> : null}
      {notice ? <div className="profile-alert is-success" role="status"><LuCheck /> {notice}</div> : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="profile-tab-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' ? (
            <>
              <div className="profile-stat-grid">
                <article><LuClock3 /><span>Hours this month</span><strong>{Number(stats.hours_this_month || 0).toFixed(1)}</strong></article>
                <article><LuCalendarDays /><span>Annual leave left</span><strong>{stats.leave_balance || 0} days</strong></article>
                <article><LuActivity /><span>Attendance rate</span><strong>{Math.round((stats.attendance_rate || 0) * 100)}%</strong></article>
              </div>
              <div className="profile-grid">
                <article className="profile-card">
                  <div className="profile-card-heading"><div><span>Account information</span><h3>Your portal identity</h3></div><LuUserRound /></div>
                  <dl className="profile-info-list">
                    <div><dt><LuMail /> Email address</dt><dd>{account.email}</dd></div>
                    <div><dt><LuBriefcaseBusiness /> Position</dt><dd>{employee?.position || roleLabels[account.role] || 'Portal user'}</dd></div>
                    <div><dt><LuPhone /> Phone</dt><dd>{employee?.phone || 'Not added'}</dd></div>
                    <div><dt><LuCalendarDays /> Member since</dt><dd>{formatDate(account.created_at)}</dd></div>
                  </dl>
                </article>
                <article className="profile-card">
                  <div className="profile-card-heading"><div><span>Recent attendance</span><h3>Your latest activity</h3></div><LuActivity /></div>
                  {profile?.recent_attendance?.length ? (
                    <ul className="attendance-list">
                      {profile.recent_attendance.slice(0, 4).map((item) => (
                        <li key={item.date}>
                          <div className="attendance-date">
                            <i aria-hidden="true" />
                            <div>
                              <strong>{formatDate(item.date)}</strong>
                              <span><LuClock3 aria-hidden="true" /> Check-in: {formatTime(item.check_in)}</span>
                            </div>
                          </div>
                          <em>{item.status}</em>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="profile-empty"><LuCalendarDays /><p>No attendance activity recorded yet.</p></div>}
                </article>
              </div>
            </>
          ) : null}

          {activeTab === 'details' ? (
            <form className="profile-card profile-form" onSubmit={saveDetails}>
              <div className="profile-card-heading"><div><span>Personal details</span><h3>Keep your information current</h3><p>Your role and email are managed by an administrator.</p></div><LuUserRound /></div>
              <div className="profile-form-grid">
                <label><span>Full name</span><input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} required minLength="2" autoComplete="name" /></label>
                <label><span>Phone number</span><input value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="+975 17 00 00 00" autoComplete="tel" /></label>
                <label><span>Email address</span><div className="profile-readonly"><LuMail />{account.email}</div></label>
                <label><span>Department</span><div className="profile-readonly"><LuBriefcaseBusiness />{employee?.department || 'Not linked'}</div></label>
                <label><span>Position</span><div className="profile-readonly"><LuBriefcaseBusiness />{employee?.position || roleLabels[account.role]}</div></label>
                <label><span>Employee ID</span><div className="profile-readonly"><LuMapPin />{employee?.employee_id || 'Not linked'}</div></label>
              </div>
              <div className="profile-form-actions"><p>Changes are visible across the portal.</p><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
            </form>
          ) : null}

          {activeTab === 'security' ? (
            <div className="profile-grid security-grid">
              <form className="profile-card profile-form" onSubmit={changePassword}>
                <div className="profile-card-heading"><div><span>Password</span><h3>Change your password</h3><p>Use at least 12 characters and three character types.</p></div><LuLockKeyhole /></div>
                <label><span>Current password</span><div className="password-field"><input type={showPasswords ? 'text' : 'password'} value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required autoComplete="current-password" /><button type="button" onClick={() => setShowPasswords(!showPasswords)} aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}>{showPasswords ? <LuEyeOff /> : <LuEye />}</button></div></label>
                <label><span>New password</span><input type={showPasswords ? 'text' : 'password'} value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} minLength="12" required autoComplete="new-password" /></label>
                <label><span>Confirm new password</span><input type={showPasswords ? 'text' : 'password'} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} minLength="12" required autoComplete="new-password" /></label>
                <div className="profile-form-actions"><p>You will be signed out on every device.</p><button type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button></div>
              </form>
              <article className="profile-card">
                <div className="profile-card-heading"><div><span>Active sessions</span><h3>Devices with account access</h3></div><LuLaptop /></div>
                <ul className="session-list">
                  {sessions.filter((session) => !session.revoked_at).map((session) => (
                    <li key={session.id}>
                      <div className="session-icon"><LuLaptop /></div>
                      <div><strong>{sessionName(session.user_agent)}</strong><span>{session.ip_address || 'Unknown location'} · Last active {formatDate(session.last_seen_at, true)}</span>{session.id === currentSessionId ? <em>Current session</em> : null}</div>
                      <button type="button" onClick={() => revokeSession(session.id)}>{session.id === currentSessionId ? 'Sign out' : 'Revoke'}</button>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
