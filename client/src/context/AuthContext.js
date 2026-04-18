import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('fmc_token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = (token, data) => {
    localStorage.setItem('fmc_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('fmc_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout, loading }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
