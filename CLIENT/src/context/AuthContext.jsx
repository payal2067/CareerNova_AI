import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/ApiConfig';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedToken) {
      setToken(storedToken);
    }

    setLoading(false);
  }, []);

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);

    if (res.data?.data) {
      const nextUser = res.data.data;
      const nextToken = res.data.token || token;

      setUser(nextUser);
      setToken(nextToken);
      localStorage.setItem('user', JSON.stringify(nextUser));
      if (nextToken) localStorage.setItem('token', nextToken);
    }

    return res.data;
  };

  const login = (userData, authToken = null) => {
    setUser(userData);
    setToken(authToken || token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (authToken) localStorage.setItem('token', authToken);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    register,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
