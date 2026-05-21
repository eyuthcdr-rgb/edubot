import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function NotesPage({ isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', content: '', file: null });
  const [saving, setSaving]     = useState(false);

  const load = () => api.getNotes(id).then(setNotes).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const submit = async () => {
    if (!form.title || !form.content) return alert('Title and content are required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('subject', id);
      fd.append('title', form.title);
      fd.append('content', form.content);
      if (form.file) fd.append('file', form.file);
      await api.createNote(fd);
      setForm({ title: '', content: '', file: null });
      setShowForm(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    await api.deleteNote(noteId);
    setNotes(n => n.filter(x => x._id !== noteId));
  };

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>📝 Notes</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>New Note</h3>
          <input
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={inputStyle}
          />
          <textarea
            placeholder="Content (supports markdown-style text)"
            value={form.content}
            rows={5}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <label style={{ display: 'block', marginBottom: 12, fontSize: 13, color: 'var(--text2)' }}>
            Attach PDF or image (optional):
            <input type="file" accept=".pdf,image/*" style={{ display: 'block', marginTop: 4 }}
              onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} />
          </label>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && notes.length === 0 && <div className="empty">No notes yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notes.map(n => (
          <div key={n._id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === n._id ? null : n._id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {n.pinned && <span className="tag" style={{ background: '#FEF3C7', color: '#92400E', marginBottom: 6, display: 'inline-block' }}>📌 Pinned</span>}
                <div style={{ fontWeight: 600, fontSize: 15 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </div>
              </div>
              {isAdmin && (
                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={e => { e.stopPropagation(); del(n._id); }}>
                  Delete
                </button>
              )}
            </div>
            {expanded === n._id && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.content}</p>
                {n.fileUrl && (
                  <a href={n.fileUrl} target="_blank" rel="noreferrer"
                    className="btn btn-ghost" style={{ marginTop: 12, display: 'inline-flex' }}>
                    {n.fileType === 'pdf' ? '📄 View PDF' : '🖼 View Image'}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 14, fontFamily: 'var(--font)',
  marginBottom: 12, outline: 'none',
};
