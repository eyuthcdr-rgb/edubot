import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const TABS = ['Students', 'Subjects'];
const statusColor = { pending: '#F59E0B', approved: '#10B981', blocked: '#EF4444' };

export default function AdminPage() {
  const [tab, setTab]           = useState('Students');
  const [users, setUsers]       = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const [selected, setSelected] = useState(null); // selected student detail
  const [sForm, setSForm]       = useState({ name: '', description: '', icon: '📚', color: '#4C6FFF' });
  const [saving, setSaving]     = useState(false);

  const loadUsers = useCallback(async (p = 1, s = search) => {
    setLoading(true);
    try {
      const res = await api.getUsers(p, s);
      setUsers(res.users);
      setTotal(res.pages);
      setPage(p);
    } finally { setLoading(false); }
  }, [search]);

  const loadSubjects = () => api.getSubjects().then(setSubjects);

  useEffect(() => {
    loadUsers(1, '');
    loadSubjects();
  }, []);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => loadUsers(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const approve = async (tid) => {
    await api.approveUser(tid);
    setUsers(u => u.map(x => x.telegramId === tid ? { ...x, status: 'approved' } : x));
    if (selected?.telegramId === tid) setSelected(s => ({ ...s, status: 'approved' }));
  };

  const block = async (tid) => {
    if (!confirm('Block this student?')) return;
    await api.blockUser(tid);
    setUsers(u => u.map(x => x.telegramId === tid ? { ...x, status: 'blocked' } : x));
    if (selected?.telegramId === tid) setSelected(s => ({ ...s, status: 'blocked' }));
  };

  const unblock = async (tid) => {
    await api.unblockUser(tid);
    setUsers(u => u.map(x => x.telegramId === tid ? { ...x, status: 'approved' } : x));
    if (selected?.telegramId === tid) setSelected(s => ({ ...s, status: 'approved' }));
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
    if (!confirm('Delete this subject?')) return;
    await api.deleteSubject(sid);
    setSubjects(s => s.filter(x => x._id !== sid));
  };

  // ── Student detail view ────────────────────────────────────────────────────
  if (selected) {
    const initials = (selected.fullName || selected.firstName || '?')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
      <div style={{ padding: '20px 16px' }}>
        <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ marginBottom: 20 }}>
          ← Back to Students
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {selected.profilePicUrl ? (
            <img src={selected.profilePicUrl} alt="Profile"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 auto',
            }}>
              {initials}
            </div>
          )}
          <h2 style={{ marginTop: 10, fontFamily: 'var(--font-serif)', fontSize: 20 }}>
            {selected.fullName || selected.firstName}
          </h2>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '3px 12px',
            borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: statusColor[selected.status] + '22',
            color: statusColor[selected.status],
          }}>
            {selected.status}
          </span>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Student Details</h3>
          {[
            { label: '📛 Full Name',      value: selected.fullName || '—' },
            { label: '🎓 Academic Level', value: selected.academicLevel || '—' },
            { label: '🔖 Username',       value: `@${selected.username || 'none'}` },
            { label: '🆔 Telegram ID',    value: selected.telegramId },
            { label: '📅 Joined',         value: new Date(selected.createdAt).toDateString() },
            { label: '🕐 Last Seen',      value: selected.lastSeen ? new Date(selected.lastSeen).toLocaleString() : '—' },
            { label: '💬 Bio',            value: selected.bio || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 130 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {selected.status === 'pending' && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => approve(selected.telegramId)}>
              ✅ Approve
            </button>
          )}
          {selected.status !== 'blocked' && selected.role !== 'admin' && (
            <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => block(selected.telegramId)}>
              🚫 Block
            </button>
          )}
          {selected.status === 'blocked' && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => unblock(selected.telegramId)}>
              ✅ Unblock
            </button>
          )}
        </div>

        {/* Feedback history */}
        {selected.feedbackHistory?.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
              💬 Feedback History ({selected.feedbackHistory.length})
            </h3>
            {selected.feedbackHistory.map((f, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <p style={{ fontSize: 13 }}>{f.text || '(no text)'}</p>
                {f.fileUrl && (
                  <a href={f.fileUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent)' }}>View attachment</a>
                )}
                <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                  {new Date(f.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 20 }}>⚙️ Admin Panel</h2>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
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

      {/* ── Students tab ─────────────────────────────────────────────────────── */}
      {tab === 'Students' && (
        <>
          {/* Search */}
          <input
            placeholder="🔍 Search by name or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: 14 }}
          />

          {loading && <div className="spinner" />}

          {!loading && users.length === 0 && (
            <div className="empty">No students found.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => {
              const initials = (u.fullName || u.firstName || '?')
                .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={u.telegramId} className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(u)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {u.profilePicUrl ? (
                      <img src={u.profilePicUrl} alt=""
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{u.fullName || u.firstName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                        @{u.username || 'none'} · {u.academicLevel || 'No level set'}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: statusColor[u.status] + '22',
                      color: statusColor[u.status], flexShrink: 0,
                    }}>
                      {u.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" disabled={page === 1}
                onClick={() => loadUsers(page - 1)}>← Prev</button>
              <span style={{ lineHeight: '36px', fontSize: 13 }}>{page} / {totalPages}</span>
              <button className="btn btn-ghost" disabled={page === totalPages}
                onClick={() => loadUsers(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Subjects tab ─────────────────────────────────────────────────────── */}
      {tab === 'Subjects' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Add Subject</h3>
            <input placeholder="Name" value={sForm.name}
              onChange={e => setSForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            <input placeholder="Description (optional)" value={sForm.description}
              onChange={e => setSForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input placeholder="Icon emoji" value={sForm.icon}
                onChange={e => setSForm(f => ({ ...f, icon: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--text2)' }}>Color:</label>
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
            {subjects.map(s => (
              <div key={s._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
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
