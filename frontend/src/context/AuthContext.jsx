import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dunis_token');
    if (token) {
      getMe()
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = useCallback(async (emailOrObj, password) => {
    const creds = typeof emailOrObj === 'object' ? emailOrObj : { email: emailOrObj, password };
    const r = await apiLogin(creds);
    localStorage.setItem('dunis_token', r.data.token);
    setUser(r.data.user);
    toast.success(`Welcome back, ${r.data.user.firstName}! 🎓`);
    return r.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const r = await apiRegister(data);
    localStorage.setItem('dunis_token', r.data.token);
    setUser(r.data.user);
    toast.success('Account created! Welcome to DUNIS Africa 🎉');
    return r.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((u) => setUser(u), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
