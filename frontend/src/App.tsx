import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ChatPage from './components/ChatPage';
import { AppProvider } from './context/AppContext';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userId, setUserId] = useState<number | null>(
    localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null,
  );

  const handleLogin = useCallback((newToken: string, newUserId: number) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', String(newUserId));
    setToken(newToken);
    setUserId(newUserId);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUserId(null);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/chat" /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={token ? <Navigate to="/chat" /> : <RegisterPage onLogin={handleLogin} />} />
        <Route
          path="/chat"
          element={
            token && userId ? (
              <AppProvider token={token} userId={userId}>
                <ChatPage onLogout={handleLogout} />
              </AppProvider>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to={token ? '/chat' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
