import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

function getYoutubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return match ? match[1] : null;
}

export default function VideosPage({ isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '', duration: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getVideos(id).then(setVideos).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const submit = async () => {
    if (!form.title || !form.url) return alert('Title and URL are required.');
    setSaving(true);
    try {
      await api.createVideo({ ...form, subject: id });
      setForm({ title: '', description: '', url: '', duration: '' });
      setShowForm(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (vid) => {
    if (!confirm('Delete this video?')) return;
    await api.deleteVideo(vid);
    setVideos(v => v.filter(x => x._id !== vid));
  };

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>🎬 Videos</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>New Video</h3>
          {['title', 'url', 'description', 'duration'].map(field => (
            <input key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1) + (field === 'url' ? ' (YouTube or direct link)' : field === 'duration' ? ' (e.g. 12:34, optional)' : '')}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              style={inputStyle}
            />
          ))}
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save Video'}
          </button>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && videos.length === 0 && <div className="empty">No videos yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {videos.map(v => {
          const ytId = getYoutubeId(v.url);
          return (
            <div key={v._id} className="card">
              {/* Thumbnail */}
              {(v.thumbnail || ytId) && (
                <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={v.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt={v.title}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                  />
                  <span style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(0,0,0,.7)', color: '#fff',
                    borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                  }}>
                    {v.duration || '▶'}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{v.title}</div>
                  {v.description && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{v.description}</div>}
                </div>
                {isAdmin && (
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0, marginLeft: 8 }}
                    onClick={() => del(v._id)}>Delete</button>
                )}
              </div>
              <a href={v.url} target="_blank" rel="noreferrer"
                className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
                ▶ Watch
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 14, fontFamily: 'var(--font)', marginBottom: 12, outline: 'none',
};
