import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTelegram }   from './hooks/useTelegram.js';
import { api }           from './api.js';
import BottomNav         from './components/BottomNav.jsx';
import Home              from './pages/Home.jsx';
import SubjectPage       from './pages/SubjectPage.jsx';
import NotesPage         from './pages/NotesPage.jsx';
import VideosPage        from './pages/VideosPage.jsx';
import QuizPage          from './pages/QuizPage.jsx';
import AdminPage         from './pages/AdminPage.jsx';

export default function App() {
  const { tg } = useTelegram();
  const [user, setUser]     = useState(null);
  const [status, setStatus] = useState('loading'); // loading | pending | approved | blocked | error

  useEffect(() => {
    api.getMe()
      .then(u => { setUser(u); setStatus(u.status); })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text2)', fontSize: 14 }}>Loading…</p>
    </div>
  );

  if (status === 'pending') return (
    <div className="empty" style={{ marginTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <h2 style={{ marginBottom: 8 }}>Waiting for Approval</h2>
      <p>Your account is pending admin review.<br/>You'll get a message once approved.</p>
    </div>
  );

  if (status === 'blocked') return (
    <div className="empty" style={{ marginTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
      <h2 style={{ marginBottom: 8 }}>Access Blocked</h2>
      <p>Contact your admin for help.</p>
    </div>
  );

  if (status === 'error') return (
    <div className="empty" style={{ marginTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ marginBottom: 8 }}>Connection Error</h2>
      <p>Could not reach the server. Please try again.</p>
    </div>
  );

  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ paddingBottom: 72 }}>
      <Routes>
        <Route path="/"                    element={<Home user={user} />} />
        <Route path="/subject/:id"         element={<SubjectPage />} />
        <Route path="/subject/:id/notes"   element={<NotesPage isAdmin={isAdmin} />} />
        <Route path="/subject/:id/videos"  element={<VideosPage isAdmin={isAdmin} />} />
        <Route path="/subject/:id/quiz"    element={<QuizPage isAdmin={isAdmin} />} />
        {isAdmin && <Route path="/admin"   element={<AdminPage />} />}
        <Route path="*"                    element={<Navigate to="/" />} />
      </Routes>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
