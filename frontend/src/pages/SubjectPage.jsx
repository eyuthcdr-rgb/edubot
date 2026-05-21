import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const tabs = [
  { key: 'notes',  label: '📝 Notes'  },
  { key: 'videos', label: '🎬 Videos' },
  { key: 'quiz',   label: '❓ Quiz'   },
];

export default function SubjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState('notes');

  const go = (tab) => {
    setActive(tab);
    navigate(`/subject/${id}/${tab}`);
  };

  return (
    <div style={{ padding: '20px 16px' }}>
      <button className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={() => navigate('/')}>
        ← Back
      </button>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, fontFamily: 'var(--font-serif)' }}>
        Choose a section
      </h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {tabs.map(t => (
          <button key={t.key} className="card btn" onClick={() => go(t.key)}
            style={{ fontSize: 16, justifyContent: 'flex-start', gap: 12, padding: 20 }}>
            {t.label}
            <span style={{ marginLeft: 'auto', color: 'var(--text2)' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
