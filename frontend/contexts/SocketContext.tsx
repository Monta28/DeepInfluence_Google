'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  // Create a single socket instance for the whole app lifecycle
  useEffect(() => {
    if (socketRef.current) {
      setSocket(socketRef.current);
      return;
    }

    const baseUrl =
      (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim()) ||
      (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/?api\/?$/, '')) ||
      'http://localhost:3001';

    const s = io(baseUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
    });

    // Authenticate on (re)connect if a token is present
    const authenticateIfPossible = () => {
      try {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token');
        if (token) s.emit('authenticate', token);
      } catch {}
    };
    s.on('connect', authenticateIfPossible);

    socketRef.current = s;
    setSocket(s);

    // Clean up on full page unload; keep across React dev strict re-mounts
    const onBeforeUnload = () => {
      try {
        s.removeAllListeners();
        s.close();
      } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      // Intentionally do not close here to avoid StrictMode double-effect closing
    };
  }, []);

  // If user becomes available later, attempt auth
  useEffect(() => {
    if (!socketRef.current) return;
    try {
      if (socketRef.current.connected && typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) socketRef.current.emit('authenticate', token);
      }
    } catch {}
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
