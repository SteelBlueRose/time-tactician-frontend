"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['x-auth-token'] = token;
      try {
        const [userRes, pointsRes] = await Promise.all([
          api.get('/user/me'),
          api.get('/user/points')
        ]);
        console.log('User response:', userRes.data);
        console.log('Points response:', pointsRes.data);
        setUser(userRes.data);
        setPoints(pointsRes.data.points);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to fetch user data", error);
        localStorage.removeItem('token');
        setUser(null);
        setPoints(0);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = async (token) => {
    localStorage.setItem('token', token);
    await fetchUserData();
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    setUser(null);
    setPoints(0);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const value = {
    user,
    points,
    isAuthenticated,
    loading,
    login,
    logout,
    fetchUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
