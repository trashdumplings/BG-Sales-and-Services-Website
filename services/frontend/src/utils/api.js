// Simple API client for FastAPI backend
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function extractErrorMessage(errorBody, fallback) {
  if (typeof errorBody?.detail === 'string') return errorBody.detail;
  if (typeof errorBody?.detail?.message === 'string') return errorBody.detail.message;
  return fallback;
}

export async function apiLogin(username, password, options = {}) {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);
  body.append('remember_me', options.rememberMe ? 'true' : 'false');
  if (options.challengeId) body.append('challenge_id', options.challengeId);
  if (options.challengeAnswer) body.append('challenge_answer', options.challengeAnswer);
  
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include', // allow cookies for refresh
      body
    });
    
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      const error = new Error(extractErrorMessage(t, 'Login failed'));
      error.status = res.status;
      error.captchaRequired = Boolean(t?.detail?.captcha_required);
      throw error;
    }
    return res.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      console.error('Network error:', error);
      throw new Error(`Unable to connect to server at ${API_BASE}. Please check if the backend server is running and CORS is configured correctly.`);
    }
    throw error;
  }
}

export async function apiRefresh() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function apiMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function apiLogout() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}

export async function apiLoginChallenge(username) {
  const body = new URLSearchParams();
  body.append('username', username);

  const res = await fetch(`${API_BASE}/auth/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    credentials: 'include',
    body
  });
  if (!res.ok) {
    const t = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(t, 'Could not create verification challenge'));
  }
  return res.json();
}

export async function apiSessions(token) {
  const res = await fetch(`${API_BASE}/auth/sessions`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function apiRevokeSession(token, sessionId) {
  const res = await fetch(`${API_BASE}/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to revoke session');
}

export async function apiProfile(token) {
  const res = await fetch(`${API_BASE}/api/profile/me`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error, 'Failed to load your profile'));
  }
  return res.json();
}

export async function apiUpdateProfile(token, profile) {
  const res = await fetch(`${API_BASE}/api/profile/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(profile)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error, 'Failed to update your profile'));
  }
  return res.json();
}

export async function apiChangePassword(token, passwords) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(passwords)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error, 'Failed to change password'));
  }
}

export async function apiRegister(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Registration failed');
  }
  return res.json();
}

// Helper function to get auth headers
function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Employee Management APIs
export async function getEmployees(token, params = {}) {
  const queryParams = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/employees?${queryParams}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

export async function getEmployee(token, employeeId) {
  const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch employee');
  return res.json();
}

export async function createEmployee(token, employeeData) {
  const res = await fetch(`${API_BASE}/api/employees`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(employeeData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to create employee');
  }
  return res.json();
}

export async function updateEmployee(token, employeeId, employeeData) {
  const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(employeeData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to update employee');
  }
  return res.json();
}

export async function deleteEmployee(token, employeeId) {
  const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete employee');
}

// Inventory Management APIs
export async function getInventoryItems(token, params = {}) {
  const queryParams = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/inventory?${queryParams}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch inventory items');
  return res.json();
}

export async function getInventoryItem(token, itemId) {
  const res = await fetch(`${API_BASE}/api/inventory/${itemId}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch inventory item');
  return res.json();
}

export async function getInventoryItemBySku(token, sku) {
  const res = await fetch(`${API_BASE}/api/inventory/sku/${sku}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch inventory item');
  return res.json();
}

export async function createInventoryItem(token, itemData) {
  const res = await fetch(`${API_BASE}/api/inventory`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(itemData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to create inventory item');
  }
  return res.json();
}

export async function updateInventoryItem(token, itemId, itemData) {
  const res = await fetch(`${API_BASE}/api/inventory/${itemId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(itemData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to update inventory item');
  }
  return res.json();
}

export async function deleteInventoryItem(token, itemId) {
  const res = await fetch(`${API_BASE}/api/inventory/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete inventory item');
}

export async function adjustInventoryQuantity(token, itemId, quantityChange) {
  const res = await fetch(`${API_BASE}/api/inventory/${itemId}/adjust`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ quantity_change: quantityChange })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to adjust inventory quantity');
  }
  return res.json();
}

// Leave Management APIs
export async function getLeaves(token) {
  const res = await fetch(`${API_BASE}/api/leaves`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch leave requests');
  return res.json();
}

export async function getLeaveBalance(token) {
  const res = await fetch(`${API_BASE}/api/leaves/balance`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch leave balance');
  return res.json();
}

export async function createLeave(token, leaveData) {
  const res = await fetch(`${API_BASE}/api/leaves`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(leaveData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to submit leave request');
  }
  return res.json();
}

export async function approveLeave(token, leaveId) {
  const res = await fetch(`${API_BASE}/api/leaves/${leaveId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to approve leave');
  return res.json();
}

export async function rejectLeave(token, leaveId, reason) {
  const res = await fetch(`${API_BASE}/api/leaves/${leaveId}/reject?reason=${encodeURIComponent(reason)}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to reject leave');
  return res.json();
}

// Admin & System APIs
export async function getAuditLogs(token, params = {}) {
  const queryParams = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/admin/audit-logs?${queryParams}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function getSettings(token) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSetting(token, key, value) {
  const res = await fetch(`${API_BASE}/admin/settings/${key}?value=${encodeURIComponent(value)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to update setting');
  return res.json();
}

// Work Log APIs
export async function getWorkLogs(token, params = {}) {
  const queryParams = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/work-logs?${queryParams}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch work logs');
  return res.json();
}

export async function createWorkLog(token, logData) {
  const res = await fetch(`${API_BASE}/api/work-logs`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(logData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to create work log');
  }
  return res.json();
}

export async function getWorkLog(token, logId) {
  const res = await fetch(`${API_BASE}/api/work-logs/${logId}`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch work log');
  return res.json();
}

export async function updateWorkLog(token, logId, logData) {
  const res = await fetch(`${API_BASE}/api/work-logs/${logId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(logData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to update work log');
  }
  return res.json();
}

export async function deleteWorkLog(token, logId) {
  const res = await fetch(`${API_BASE}/api/work-logs/${logId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete work log');
}

export async function submitWorkLog(token, logId) {
  const res = await fetch(`${API_BASE}/api/work-logs/${logId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to submit work log');
  }
  return res.json();
}

export async function resubmitWorkLog(token, logId) {
  const res = await fetch(`${API_BASE}/api/work-logs/${logId}/resubmit`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || 'Failed to resubmit work log');
  }
  return res.json();
}

export async function getWorkLogReviewQueue(token) {
  const res = await fetch(`${API_BASE}/api/work-logs/review-queue`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch work log review queue');
  return res.json();
}

export async function approveWorkLog(token, logId, comment = '') {
  const res = await fetch(`${API_BASE}/api/work-logs/${logId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ reviewer_comment: comment })
  });
  if (!res.ok) throw new Error('Failed to approve work log');
  return res.json();
}

export async function rejectWorkLog(token, logId, comment = '') {
  const res = await fetch(`${API_BASE}/api/work-logs/${logId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ reviewer_comment: comment })
  });
  if (!res.ok) throw new Error('Failed to reject work log');
  return res.json();
}

// Reports APIs
export async function getMonthlySummary(token, year, month) {
  const queryParams = new URLSearchParams({ year, month });
  try {
    const res = await fetch(`${API_BASE}/api/reports/monthly-summary?${queryParams}`, {
      headers: getAuthHeaders(token),
      credentials: 'include'
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(error, res.status === 401 ? 'Your session expired. Please sign in again.' : 'Failed to fetch monthly summary'));
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new Error(`Unable to connect to reports service at ${API_BASE}. Please check if the backend server is running.`);
    }
    throw error;
  }
}

export async function getInventoryAlerts(token) {
  try {
    const res = await fetch(`${API_BASE}/api/reports/inventory-alerts`, {
      headers: getAuthHeaders(token),
      credentials: 'include'
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(error, res.status === 401 ? 'Your session expired. Please sign in again.' : 'Failed to fetch inventory alerts'));
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new Error(`Unable to connect to reports service at ${API_BASE}. Please check if the backend server is running.`);
    }
    throw error;
  }
}

// Public website product catalog and dashboard management APIs
export async function getPublicProducts() {
  const res = await fetch(`${API_BASE}/api/products/public`);
  if (!res.ok) throw new Error('Failed to fetch website products');
  return res.json();
}

export async function getPublicProduct(slug) {
  const res = await fetch(`${API_BASE}/api/products/public/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}

export async function recordProductInteraction(slug, eventType) {
  const res = await fetch(`${API_BASE}/api/products/public/${encodeURIComponent(slug)}/interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType })
  });
  if (!res.ok) throw new Error('Failed to record product interaction');
}

export async function getCatalogProducts(token) {
  const res = await fetch(`${API_BASE}/api/products`, {
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch product catalog');
  return res.json();
}

export async function uploadCatalogProductImage(token, imageFile) {
  const body = new FormData();
  body.append('image', imageFile);
  const res = await fetch(`${API_BASE}/api/products/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error, 'Failed to upload product image'));
  }
  return res.json();
}

export async function createCatalogProduct(token, productData) {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(productData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error, 'Failed to create product'));
  }
  return res.json();
}

export async function updateCatalogProduct(token, productId, productData) {
  const res = await fetch(`${API_BASE}/api/products/${productId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(productData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error, 'Failed to update product'));
  }
  return res.json();
}

export async function deleteCatalogProduct(token, productId) {
  const res = await fetch(`${API_BASE}/api/products/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete product');
}
