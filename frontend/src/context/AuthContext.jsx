import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axiosClient from '../api/axiosClient.js';
import { AuthContext } from './utils/authContext.js';

const SOCKET_URL = 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const socketRef = useRef(null);

  // Connect socket and join personal room
  const connectSocket = useCallback((userId) => {
    if (socketRef.current?.connected) return; // already connected
    socketRef.current = io(SOCKET_URL, { withCredentials: true });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', userId);
    });
  }, []);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await axiosClient.get('/auth/me');
      const user = response.data?.user ?? null;
      setCurrentUser(user);
      if (user?._id) connectSocket(user._id);
      return user;
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  }, [connectSocket]);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const response = await axiosClient.get('/auth/me');
        if (isMounted) {
          const user = response.data?.user ?? null;
          setCurrentUser(user);
          if (user?._id) connectSocket(user._id);
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
  }, [connectSocket]);

  const login = useCallback((user) => {
    setCurrentUser(user ?? null);
    setIsAuthLoading(false);
    if (user?._id) connectSocket(user._id);
  }, [connectSocket]);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      disconnectSocket();
      setCurrentUser(null);
      setIsAuthLoading(false);
    }
  }, [disconnectSocket]);

  return (
    <AuthContext.Provider value={{
      currentUser, setCurrentUser, login, logout, refreshUser, isAuthLoading,
      socketRef,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
