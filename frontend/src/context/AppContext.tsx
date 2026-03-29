import React, { createContext, useContext, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AppContextValue {
  token: string;
  userId: number;
  socket: Socket;
  apiUrl: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}

interface AppProviderProps {
  token: string;
  userId: number;
  children: React.ReactNode;
}

export function AppProvider({ token, userId, children }: AppProviderProps) {
  const socketRef = useRef<Socket | null>(null);

  const socket = useMemo(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const s = io(API_URL, { auth: { token } });
    socketRef.current = s;
    return s;
  }, [token]);

  const value = useMemo(
    () => ({ token, userId, socket, apiUrl: API_URL }),
    [token, userId, socket],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
