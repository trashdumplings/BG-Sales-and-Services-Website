import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from '@/utils/PrivateRoute'

const mockUseAuth = vi.fn()
vi.mock('@/stores/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderAt(path, { user, loading = false } = {}) {
  mockUseAuth.mockReturnValue({ user, loading })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<div>Dashboard Root</div>} />
          <Route path="/dashboard/superadmin" element={<div>SuperAdmin Dashboard</div>} />
          <Route path="/dashboard/hr" element={<div>HR Dashboard</div>} />
          <Route path="/dashboard/employee" element={<div>Employee Dashboard</div>} />
          <Route path="/dashboard/products" element={<div>Products Module</div>} />
          <Route path="/dashboard/inventory" element={<div>Inventory Module</div>} />
          <Route path="/dashboard/reports" element={<div>Reports Module</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('shows a loading state while auth is resolving', () => {
    renderAt('/dashboard/employee', { user: null, loading: true })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', () => {
    renderAt('/dashboard/employee', { user: null })
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects /dashboard root to the user role dashboard', () => {
    renderAt('/dashboard', { user: { role: 'hr', module_permissions: [] } })
    expect(screen.getByText('HR Dashboard')).toBeInTheDocument()
  })

  it('lets a user open their own role dashboard', () => {
    renderAt('/dashboard/employee', { user: { role: 'employee', module_permissions: [] } })
    expect(screen.getByText('Employee Dashboard')).toBeInTheDocument()
  })

  it('bounces an employee away from the superadmin dashboard', () => {
    renderAt('/dashboard/superadmin', { user: { role: 'employee', module_permissions: [] } })
    expect(screen.getByText('Employee Dashboard')).toBeInTheDocument()
  })

  it('bounces an hr user away from another role dashboard', () => {
    renderAt('/dashboard/superadmin', { user: { role: 'hr', module_permissions: [] } })
    expect(screen.getByText('HR Dashboard')).toBeInTheDocument()
  })

  it('lets superadmin into any module without explicit permissions', () => {
    renderAt('/dashboard/inventory', { user: { role: 'superadmin', module_permissions: [] } })
    expect(screen.getByText('Inventory Module')).toBeInTheDocument()
  })

  it('denies an employee without the products permission', () => {
    renderAt('/dashboard/products', { user: { role: 'employee', module_permissions: [] } })
    expect(screen.getByText('Employee Dashboard')).toBeInTheDocument()
  })

  it('allows an employee with an explicit products permission', () => {
    renderAt('/dashboard/products', { user: { role: 'employee', module_permissions: ['products'] } })
    expect(screen.getByText('Products Module')).toBeInTheDocument()
  })

  it('grants hr implicit access to reports without an explicit permission', () => {
    renderAt('/dashboard/reports', { user: { role: 'hr', module_permissions: [] } })
    expect(screen.getByText('Reports Module')).toBeInTheDocument()
  })

  it('does not grant hr implicit access to inventory', () => {
    renderAt('/dashboard/inventory', { user: { role: 'hr', module_permissions: [] } })
    expect(screen.getByText('HR Dashboard')).toBeInTheDocument()
  })
})
