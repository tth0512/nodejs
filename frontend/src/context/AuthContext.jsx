import { useCallback, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { AuthContext } from './utils/authContext.js';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await axiosClient.get('/auth/me');
      const user = response.data?.user ?? null;
      setCurrentUser(user);
      return user;
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const response = await axiosClient.get('/auth/me');
        if (isMounted) {
          setCurrentUser(response.data?.user ?? null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((user) => {
    setCurrentUser(user ?? null);
    setIsAuthLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      setCurrentUser(null);
      setIsAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, refreshUser, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
