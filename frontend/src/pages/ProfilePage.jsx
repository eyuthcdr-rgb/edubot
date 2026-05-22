import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function ProfilePage() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ fullName: '', academicLevel: '', bio: '' });
  const [saving, setSaving]   = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getMe().then(u => {
      setUser(u);
      setForm({ fullName: u.fullName || '', academicLevel: u.academicLevel || '', bio: u.bio || '' });
    }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.fullName)      fd.append('fullName',      form.fullName);
      if (form.academicLevel) fd.append('academicLevel', form.academicLevel);
      if (form.bio)           fd.append('bio',           form.bio);
      const updated = await api.updateProfile(fd);
      setUser(updated);
      setEditing(false);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    try {
      await api.sendFeedback(feedback);
      setFeedback('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  if (loading) return <div className="spinner" style={{ marginTop: 60 }} />;

  const initials = (user?.fullName || user?.firstName || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ padding: '20px 16px' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        ← Back
      </button>

      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {user?.profilePicUrl ? (
          <img src={user.profilePicUrl} alt="Profile"
            style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
        ) : (
          <div style={{
            width: 90, height: 90, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 auto',
          }}>
            {initials}
          </div>
        )}
        <h2 style={{ marginTop: 12, fontFamily: 'var(--font-serif)', fontSize: 20 }}>
          {user?.fullName || user?.firstName}
        </h2>
        <span style={{
          display: 'inline-block', marginTop: 4, padding: '3px 12px',
          borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: user?.status === 'approved' ? '#D1FAE5' : '#FEF3C7',
          color: user?.status === 'approved' ? '#065F46' : '#92400E',
        }}>
          {user?.status}
        </span>
      </div>

      {/* Profile details */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 600 }}>Profile Details</h3>
          <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }}
            onClick={() => setEditing(e => !e)}>
            {editing ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>

        {editing ? (
          <>
            <input placeholder="Full Name" value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              style={inputStyle} />
            <input placeholder="Academic Level (e.g. Grade 10)" value={form.academicLevel}
              onChange={e => setForm(f => ({ ...f, academicLevel: e.target.value }))}
              style={inputStyle} />
            <textarea placeholder="Bio (optional)" value={form.bio} rows={3}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical' }} />
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '📛 Full Name',       value: user?.fullName || '—' },
              { label: '🎓 Academic Level',  value: user?.academicLevel || '—' },
              { label: '🔖 Username',        value: `@${user?.username || 'none'}` },
              { label: '📅 Joined',          value: user?.createdAt ? new Date(user.createdAt).toDateString() : '—' },
              { label: '💬 Bio',             value: user?.bio || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 130 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback section */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 12 }}>💬 Send Feedback</h3>
        <textarea
          placeholder="Share your thoughts, report issues, or suggest improvements..."
          value={feedback}
          rows={4}
          onChange={e => setFeedback(e.target.value)}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        {sent && (
          <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>
            ✅ Feedback sent! Thank you.
          </div>
        )}
        <button className="btn btn-primary" onClick={sendFeedback} disabled={sending || !feedback.trim()}>
          {sending ? 'Sending…' : 'Send Feedback'}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 14, fontFamily: 'var(--font)', marginBottom: 12, outline: 'none',
};
