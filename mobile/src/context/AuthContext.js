import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          const res = await apiRequest('/api/auth/me', 'GET', null, storedToken);
          setUser(res.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.log('loadStoredAuth error:', err.message);
        setUser(null);
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (emailOrPhone, password) => {
    const res = await apiRequest('/api/auth/login', 'POST', { emailOrPhone, password });
    setUser(res.user);
    setToken(res.accessToken);
    await AsyncStorage.setItem('token', res.accessToken);
  };

  const register = async (fullName, email, phone, password, role) => {
    const res = await apiRequest('/api/auth/register', 'POST', {
      fullName,
      email,
      phone,
      password,
      role,
    });
    setUser(res.user);
    setToken(res.accessToken);
    await AsyncStorage.setItem('token', res.accessToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        user,
        token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
