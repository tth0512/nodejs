import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children, currentUser }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (currentUser) {
      // Connect to Socket.IO server
      const newSocket = io('http://localhost:5000', {
        withCredentials: true // Important for sending the HttpOnly cookie
      });

      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [currentUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
