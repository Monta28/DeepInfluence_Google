// frontend/src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (token: string | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const baseUrl =
      (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim()) ||
      (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/?api\/?$/, '')) ||
      'http://localhost:3001';
    const socket = io(baseUrl);
    if (token) {
      socket.emit('authenticate', token);
    }
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef.current;
};
