import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('AuthToken');
      if (token) {
        try {
          const response = await api.get('/user');
          setUser(response.data.userCredentials);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('AuthToken');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = (token, redirectTo = '/') => {
    localStorage.setItem('AuthToken', `Bearer ${token}`);
    // A refresh will trigger the useEffect and fetch the user
    window.location.href = redirectTo;
  };

  const logout = () => {
    localStorage.removeItem('AuthToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
