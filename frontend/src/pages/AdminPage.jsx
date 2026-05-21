import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const TABS = ['Students', 'Subjects'];

export default function AdminPage() {
  const [tab, setTab] = useState('Students');
  const [users, setUsers]       = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sForm, setSForm]       = useState({ name: '', description: '', icon: '📚', color: '#4C6FFF' });
  const [saving, setSaving]     = useState(false);

  const loadUsers    = () => api.getUsers().then(setUsers);
  const loadSubjects = () => api.getSubjects().then(setSubjects);

  useEffect(() => {
    Promise.all([loadUsers(), loadSubjects()]).finally(() => setLoading(false));
  }, []);

  const approve = async (tid) => {
    await api.approveUser(tid);
    setUsers(u => u.map(x => x.telegramId === tid ? { ...x, status: 'approved' } : x));
  };

  const block = async (tid) => {
    if (!confirm('Block this student?')) return;
    await api.blockUser(tid);
    setUsers(u => u.map(x => x.telegramId === tid ? { ...x, status: 'blocked' } : x));
  };

  const addSubject = async () => {
    if (!sForm.name) return alert('Name required.');
    setSaving(true);
    try {
      const s = await api.createSubject(sForm);
      setSubjects(prev => [...prev, s]);
      setSForm({ name: '', description: '', icon: '📚', color: '#4C6FFF' });
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const delSubject = async (sid) => {
    if (!confirm('Delete this subject and all its content?')) return;
    await api.deleteSubject(sid);
    setSubjects(s => s.filter(x => x._id !== sid));
  };

  const statusColor = { pending: '#F59E0B', approved: '#10B981', blocked: '#EF4444' };

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 20 }}>⚙️ Admin Panel</h2>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14,
              background: tab === t ? 'var(--surface)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text2)',
              boxShadow: tab === t ? 'var(--shadow)' : 'none',
              cursor: 'pointer', transition: 'all .15s',
            }}>
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {/* Students tab */}
      {!loading && tab === 'Students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.length === 0 && <div className="empty">No students yet.</div>}
          {users.map(u => (
            <div key={u.telegramId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    @{u.username || 'no username'} · ID: {u.telegramId}
                  </div>
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: statusColor[u.status] + '22',
                    color: statusColor[u.status],
                  }}>
                    {u.status} {u.role === 'admin' ? '· admin' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {u.status === 'pending' && (
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => approve(u.telegramId)}>Approve</button>
                  )}
                  {u.status !== 'blocked' && u.role !== 'admin' && (
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => block(u.telegramId)}>Block</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjects tab */}
      {!loading && tab === 'Subjects' && (
        <div>
          {/* Add subject form */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Add Subject</h3>
            <input placeholder="Name (e.g. Mathematics)" value={sForm.name}
              onChange={e => setSForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            <input placeholder="Description (optional)" value={sForm.description}
              onChange={e => setSForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input placeholder="Icon emoji" value={sForm.icon}
                onChange={e => setSForm(f => ({ ...f, icon: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>Color:</label>
                <input type="color" value={sForm.color}
                  onChange={e => setSForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8 }} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={addSubject} disabled={saving}>
              {saving ? 'Saving…' : '+ Add Subject'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subjects.length === 0 && <div className="empty">No subjects yet.</div>}
            {subjects.map(s => (
              <div key={s._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: s.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 22, flexShrink: 0,
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  {s.description && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.description}</div>}
                </div>
                <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => delSubject(s._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 14, fontFamily: 'var(--font)', marginBottom: 12, outline: 'none',
};
