import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbNotice, setDbNotice] = useState(null);

  // Restore authenticated session on mount via GET /api/auth/me
  const restoreSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.getMe();
      if (response && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 unauthenticated is normal on initial visit
      setUser(null);
      if (err.status === 503) {
        setDbNotice(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Sign In
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res && res.user) {
      setUser(res.user);
      return res.user;
    }
    throw new Error('Sign in succeeded but user profile was not returned.');
  };

  // Register
  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res && res.user) {
      setUser(res.user);
      return res.user;
    }
    throw new Error('Registration succeeded but user profile was not returned.');
  };

  // Sign Out
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout notification error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    loading,
    dbNotice,
    login,
    register,
    logout,
    refreshUser: restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
