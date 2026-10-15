import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('shopsphere_token'));
  const [loading, setLoading] = useState(true);

  // Check existing token on application mount
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('shopsphere_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authService.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('shopsphere_token');
        setUser(null);
      }
    } catch (error) {
      console.warn('Session verification failed, logging out:', error.message);
      localStorage.removeItem('shopsphere_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Login handler
   */
  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    if (data.token) {
      localStorage.setItem('shopsphere_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  /**
   * Register handler
   */
  const register = async (name, email, password) => {
    const data = await authService.register({ name, email, password });
    if (data.token) {
      localStorage.setItem('shopsphere_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  /**
   * Logout handler
   */
  const logout = () => {
    localStorage.removeItem('shopsphere_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
