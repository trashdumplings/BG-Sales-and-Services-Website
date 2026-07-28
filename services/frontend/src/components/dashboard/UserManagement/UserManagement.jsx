import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../stores/AuthProvider';
import {
  LuBadgeCheck,
  LuChevronLeft,
  LuChevronRight,
  LuFilter,
  LuMicroscope,
  LuShieldCheck,
  LuShoppingBag,
  LuChartNoAxesCombined,
  LuUserCheck,
  LuUserPlus,
  LuUsers,
} from 'react-icons/lu';
import Modal from '../../common/Modal/Modal';
import Button from '../../common/Button/Button';
import FormField from '../../common/FormField/FormField';
import './UserManagement.css';

const PAGE_SIZE = 10;

const permissionOptions = [
  { id: 'products', label: 'Products', description: 'Manage the public product catalog.', icon: LuShoppingBag },
  { id: 'reports', label: 'Reports', description: 'View operational reports and insights.', icon: LuChartNoAxesCombined },
];

const roleTabs = [
  { id: 'superadmin', role: 'superadmin', label: 'Super Admin', icon: LuBadgeCheck, tone: 'indigo' },
  { id: 'hr', role: 'hr', label: 'HR', icon: LuUsers, tone: 'amber' },
  { id: 'employee', role: 'employee', label: 'Employee', icon: LuUserCheck, tone: 'green' },
];

const defaultFormData = () => ({
  name: '',
  email: '',
  password: '',
  role: 'employee',
  phone: '',
  gender: '',
  salary: '',
  hire_date: new Date().toISOString().split('T')[0],
});

const formatAddress = (user, type) => {
  if (type === 'permanent') {
    return user.permanent_address || user.department || 'Not recorded';
  }
  return user.work_address || [user.department, user.position].filter(Boolean).join(' / ') || 'Not recorded';
};

const UserManagement = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('superadmin');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [permissionUser, setPermissionUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'superadmin') {
      fetchUsers();
    }
  }, [fetchUsers, token, user?.role]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, query]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const generateInvitePassword = () => {
    const bytes = new Uint32Array(2);
    window.crypto?.getRandomValues?.(bytes);
    return `Ndis-${bytes[0].toString(36)}-${bytes[1].toString(36)}`;
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const openAddEmployee = async () => {
    setFormError('');
    setEmployeeNumber('Generating…');
    setShowModal(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/users/next-employee-number`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Could not generate employee number');
      setEmployeeNumber(data.employee_number);
    } catch (requestError) {
      setEmployeeNumber('Unavailable');
      setFormError(requestError.message);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const email = formData.email.trim().toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const phoneDigits = formData.phone.replace(/\D/g, '').replace(/^975/, '');
      if (!emailPattern.test(email)) {
        throw new Error('Enter a valid email address, for example name@company.com.');
      }
      if (!/^(17|77)\d{6}$/.test(phoneDigits)) {
        throw new Error('Enter a valid Bhutan mobile number starting with 17 or 77.');
      }

      const [firstName, ...lastNameParts] = formData.name.trim().split(/\s+/);

      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email,
          password: formData.password || generateInvitePassword(),
          role: formData.role,
          first_name: firstName || formData.name.trim(),
          last_name: lastNameParts.join(' ') || '-',
          phone: `+975${phoneDigits}`,
          department: 'Not assigned',
          position: `${formData.role} user`,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          hire_date: new Date(formData.hire_date).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add user');
      }

      await fetchUsers();
      setShowModal(false);
      setFormData(defaultFormData());
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeRole = roleTabs.find((role) => role.id === activeTab) || roleTabs[0];
  const filteredUsers = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    return users
      .filter((user) => user.role === activeRole.role)
      .filter((user) => {
        if (!searchTerm) return true;
        return [user.name, user.employee_id, user.email, user.phone, user.department, user.position]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm));
      });
  }, [activeRole.role, query, users]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  const goToPreviousPage = () => setPage((current) => Math.max(1, current - 1));
  const goToNextPage = () => setPage((current) => Math.min(pageCount, current + 1));

  const openPermissions = (targetUser) => {
    setPermissionUser(targetUser);
    setSelectedPermissions(targetUser.module_permissions || []);
    setPermissionError('');
  };

  const togglePermission = (permission) => {
    setSelectedPermissions((current) => current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission]);
  };

  const savePermissions = async () => {
    if (!permissionUser) return;
    setPermissionSaving(true);
    setPermissionError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/users/${permissionUser.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Failed to save module permissions');
      setUsers((current) => current.map((item) => item.id === permissionUser.id
        ? { ...item, module_permissions: data.module_permissions }
        : item));
      setPermissionUser(null);
    } catch (saveError) {
      setPermissionError(saveError.message);
    } finally {
      setPermissionSaving(false);
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="user-mgmt-state user-mgmt-state--denied">
        User Management is available only to the Super Admin.
      </div>
    );
  }

  if (loading) return <div className="user-mgmt-state">Loading users...</div>;
  if (error) return <div className="user-mgmt-state user-mgmt-state--error">Error: {error}</div>;

  return (
    <div className="user-mgmt-container">
      <header className="user-mgmt-header">
        <div>
          <p className="user-mgmt-kicker">Access control</p>
          <h1>User Management</h1>
        </div>
        <button className="invite-btn" onClick={openAddEmployee} type="button">
          <LuUserPlus /> Add Employee
        </button>
      </header>

      <nav className="role-tabs" aria-label="User categories" role="tablist">
        {roleTabs.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              className={`role-tab role-tab--${role.tone} ${activeTab === role.id ? 'active' : ''}`}
              onClick={() => setActiveTab(role.id)}
              role="tab"
              aria-selected={activeTab === role.id}
            >
              <Icon className="tab-icon" />
              {role.label}
            </button>
          );
        })}
      </nav>

      <section className="user-table-card" aria-label={`${activeRole.label} users`}>
        <div className="table-toolbar">
          <label className="filter-pill" aria-label="Filter users">
            <LuFilter className="filter-icon" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter users"
            />
          </label>
          <span className="page-indicator">Page: {page} / {pageCount}</span>
        </div>

        <div className="ndis-table-wrap">
          <table className="ndis-user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>CID</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Permanent Address</th>
                <th>Work Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length ? (
                visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="user-name-cell">{user.name}</td>
                    <td>{user.employee_id || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.phone || '-'}</td>
                    <td>{formatAddress(user, 'permanent')}</td>
                    <td>{formatAddress(user, 'work')}</td>
                    <td>
                      <button
                        type="button"
                        className={`status-toggle ${user.is_active ? 'active' : ''}`}
                        aria-label={`${user.name} is ${user.is_active ? 'active' : 'inactive'}`}
                        title={user.is_active ? 'Active' : 'Inactive'}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </td>
                    <td>
                      <button
                        className="action-btn edit"
                        title={user.role === 'superadmin' ? 'Super Admin has all permissions' : 'Manage module permissions'}
                        aria-label={`Manage module permissions for ${user.name}`}
                        disabled={user.role === 'superadmin'}
                        type="button"
                        onClick={() => openPermissions(user)}
                      >
                        <LuShieldCheck aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-users" colSpan="8">
                    <LuMicroscope />
                    <strong>No users found</strong>
                    <span>Try another category or filter term.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="table-footer">
          <span>Total: {filteredUsers.length} items</span>
          <div className="pagination" aria-label="Pagination">
            <button type="button" onClick={goToPreviousPage} disabled={page === 1}>
              <LuChevronLeft /> Prev
            </button>
            <button type="button" onClick={goToNextPage} disabled={page === pageCount}>
              Next <LuChevronRight />
            </button>
          </div>
        </footer>
      </section>

      <Modal
        open={showModal}
        onClose={closeModal}
        title="Add Employee"
        size="lg"
        footer={(
          <>
            <Button variant="secondary" disabled={submitting} onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={handleAddSubmit}>Add Employee</Button>
          </>
        )}
      >
        <form onSubmit={handleAddSubmit} className="user-form-grid">
          <FormField label="Role" required>
            <select name="role" value={formData.role} onChange={handleInputChange} required>
              <option value="">Select Role</option>
              <option value="superadmin">Super Admin</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
          </FormField>
          <FormField label="Employee No." hint="Generated automatically by the system">
            <input value={employeeNumber} readOnly aria-readonly="true" className="employee-number-field" />
          </FormField>
          <FormField label="Phone Number" required hint="Use a Bhutan mobile number starting with 17 or 77">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              inputMode="numeric"
              pattern="(?:\+975[\s-]?)?(?:17|77)[0-9]{6}"
              title="Enter 8 digits starting with 17 or 77, optionally prefixed by +975"
              placeholder="17XXXXXX or +975 17XXXXXX"
            />
          </FormField>

          <FormField label="Email" required hint="Example: name@company.com">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
              maxLength="254"
              placeholder="name@company.com"
            />
          </FormField>
          <FormField label="Name" required>
            <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter full name" />
          </FormField>
          <FormField label="Gender" required>
            <select name="gender" value={formData.gender} onChange={handleInputChange} required>
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </FormField>

          {formError ? <p className="user-form-error" role="alert">{formError}</p> : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(permissionUser)}
        onClose={() => !permissionSaving && setPermissionUser(null)}
        title="Module permissions"
        size="md"
        footer={(
          <>
            <Button variant="secondary" disabled={permissionSaving} onClick={() => setPermissionUser(null)}>Cancel</Button>
            <Button variant="primary" loading={permissionSaving} onClick={savePermissions}>Save permissions</Button>
          </>
        )}
      >
        {permissionUser ? (
          <div className="permission-editor">
            <div className="permission-editor__person">
              <LuShieldCheck aria-hidden="true" />
              <div><strong>{permissionUser.name}</strong><span>{permissionUser.email}</span></div>
            </div>
            <p>Select the dashboard modules this user can open. Changes apply the next time their session refreshes.</p>
            <div className="permission-editor__grid">
              {permissionOptions.map((permission) => {
                const Icon = permission.icon;
                const checked = selectedPermissions.includes(permission.id);
                return (
                  <label key={permission.id} className={`permission-card ${checked ? 'is-selected' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.id)} />
                    <Icon aria-hidden="true" />
                    <span><strong>{permission.label}</strong><small>{permission.description}</small></span>
                  </label>
                );
              })}
            </div>
            {permissionError ? <p className="user-form-error" role="alert">{permissionError}</p> : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default UserManagement;
