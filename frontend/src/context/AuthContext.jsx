import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    console.log('Checking auth, token exists:', !!token);

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Verifying token...');
      const response = await api.verifyToken();
      console.log('Token verification response:', response);

      if (response.valid) {
        setUser(response.user);
      } else {
        console.log('Token invalid, removing from storage');
        localStorage.removeItem('token');
        localStorage.removeItem('currentProfile');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('currentProfile');
    } finally {
      setLoading(false);
    }
  };

  const login = async (nickname, password) => {
    console.log('Logging in with:', nickname);
    try {
      const response = await api.login({ nickname, password });
      console.log('Login response:', response);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (nickname, password, confirmPassword) => {
    console.log('Registering:', nickname);
    try {
      const response = await api.register({ nickname, password, confirmPassword });
      console.log('Register response:', response);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const verifyPassword = async (password) => {
    try {
      const result = await api.verifyUserPassword(password);
      return result.valid;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('currentProfile');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};