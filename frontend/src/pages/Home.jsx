import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Home({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSubjects()
      .then(setSubjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Welcome back 👋</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif)' }}>
          {user?.firstName || 'Student'}
        </h1>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>📚 Your Subjects</h2>

      {loading && <div className="spinner" />}

      {!loading && subjects.length === 0 && (
        <div className="empty">No subjects yet. Ask your admin to add some.</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {subjects.map(s => (
          <button
            key={s._id}
            className="card"
            onClick={() => navigate(`/subject/${s._id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              textAlign: 'left', cursor: 'pointer', border: 'none',
              width: '100%', transition: 'transform .15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: s.color || 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>
              {s.icon || '📚'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{s.name}</div>
              {s.description && (
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{s.description}</div>
              )}
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text2)' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
