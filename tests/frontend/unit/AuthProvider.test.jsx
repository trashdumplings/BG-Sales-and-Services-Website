import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/stores/AuthProvider'

const apiLogin = vi.fn()
const apiRefresh = vi.fn()
const apiLogout = vi.fn()
const apiRegister = vi.fn()

vi.mock('@/utils/api', () => ({
  apiLogin: (...args) => apiLogin(...args),
  apiRefresh: (...args) => apiRefresh(...args),
  apiLogout: (...args) => apiLogout(...args),
  apiRegister: (...args) => apiRegister(...args),
}))

function Probe() {
  const { user, loading, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={() => login('a@example.com', 'pw')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    apiLogin.mockReset()
    apiRefresh.mockReset()
    apiLogout.mockReset()
    apiRegister.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts loading and resolves to no user when refresh fails (no active session)', async () => {
    apiRefresh.mockRejectedValue(new Error('no session'))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('restores a session on mount when a refresh cookie is valid', async () => {
    apiRefresh.mockResolvedValue({ access_token: 'tok', user: { email: 'restored@example.com' } })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('restored@example.com'))
  })

  it('login sets the user from the API response', async () => {
    apiRefresh.mockRejectedValue(new Error('no session'))
    apiLogin.mockResolvedValue({ access_token: 'tok', user: { email: 'a@example.com' } })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await act(async () => {
      screen.getByText('login').click()
    })
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('a@example.com'))
  })

  it('logout clears the user', async () => {
    apiRefresh.mockResolvedValue({ access_token: 'tok', user: { email: 'restored@example.com' } })
    apiLogout.mockResolvedValue(undefined)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('restored@example.com'))
    await act(async () => {
      screen.getByText('logout').click()
    })
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'))
    expect(apiLogout).toHaveBeenCalledTimes(1)
  })

  it('silently logs the user out when the background refresh eventually fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    apiRefresh
      .mockResolvedValueOnce({ access_token: 'tok', user: { email: 'restored@example.com' } })
      .mockRejectedValueOnce(new Error('session expired'))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('restored@example.com'))

    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000 + 1000)
    })

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'))
  })
})
