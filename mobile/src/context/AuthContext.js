// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const validateToken = async (storedToken, attempt = 1, maxAttempts = 6) => {
    try {
      const res = await apiRequest('/api/auth/me', 'GET', null, storedToken, 5); // Increased retries
      setUser(res.user);
      setToken(storedToken);
      return true;
    } catch (err) {
      const isAuthError = err.message.includes('Token') || 
                          err.message.includes('expired') || 
                          err.message.includes('valid') ||
                          err.message === 'TOKEN_EXPIRED';

      if (isAuthError) {
        // Real invalid token → logout
        await AsyncStorage.removeItem('token');
        setUser(null);
        setToken(null);
        return false;
      }

      // Server sleeping or network issue → retry
      if (attempt < maxAttempts) {
        console.log(`Server waking up... retry ${attempt}/${maxAttempts} in 30s`);
        await new Promise(r => setTimeout(r, 30000)); // Increased to 30s
        return validateToken(storedToken, attempt + 1, maxAttempts);
      }

      // After max retries → keep token, assume user is logged in
      console.log('Server took too long. Assuming logged in.');
      setToken(storedToken);
      setUser(null); // We'll fetch user later when server is up
      return true;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          await validateToken(storedToken);
        }
      } catch (err) {
        console.log('Auth init error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (emailOrPhone, password) => {
    const res = await apiRequest('/api/auth/login', 'POST', { emailOrPhone, password });
    const newToken = res.accessToken;
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);

    // Pre-wake the server after login
    try {
      await validateToken(newToken); // This wakes it up and sets user
    } catch (err) {
      console.log('Post-login wake-up failed, but proceeding:', err);
    }

    setUser(res.user);
  };

  const register = async (fullName, email, phone, password, role) => {
    const res = await apiRequest('/api/auth/register', 'POST', { fullName, email, phone, password, role });
    const newToken = res.accessToken;
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);

    // Pre-wake the server after register
    try {
      await validateToken(newToken); // This wakes it up and sets user
    } catch (err) {
      console.log('Post-register wake-up failed, but proceeding:', err);
    }

    setUser(res.user);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ authLoading, user, token, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};