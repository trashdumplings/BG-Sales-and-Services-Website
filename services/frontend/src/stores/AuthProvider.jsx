import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiLogin, apiRefresh, apiLogout, apiRegister } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const data = await apiRefresh();
    setToken(data.access_token);
    setUser(data.user);
    return data;
  }, []);

  useEffect(() => {
    // Try refresh on load
    (async () => {
      try {
        await refreshSession();
      } catch (_) {
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshSession]);

  useEffect(() => {
    if (!token) return undefined;

    const interval = window.setInterval(async () => {
      try {
        await refreshSession();
      } catch (_) {
        setUser(null);
        setToken(null);
      }
    }, 10 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [token, refreshSession]);

  const login = async (email, password, options = {}) => {
    const data = await apiLogin(email, password, options);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    await apiRegister(name, email, password);
    // After registration, automatically log in
    const data = await apiLogin(email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(() => ({ user, token, login, register, logout, loading, refreshSession }), [user, token, loading, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
