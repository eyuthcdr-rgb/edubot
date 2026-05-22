import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function ForumPage({ isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [showAsk, setShowAsk]     = useState(false);
  const [askForm, setAskForm]     = useState({ text: '', image: null });
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving]       = useState(false);

  const load = () => api.getQuestions(id).then(setQuestions).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const askQuestion = async () => {
    if (!askForm.text.trim()) return alert('Question text required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('subject', id);
      fd.append('text', askForm.text);
      if (askForm.image) fd.append('image', askForm.image);
      await api.askQuestion(fd);
      setAskForm({ text: '', image: null });
      setShowAsk(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const postAnswer = async () => {
    if (!answerText.trim()) return;
    await api.answerQuestion(selected._id, answerText);
    setAnswerText('');
    // Refresh selected
    const updated = await api.getQuestions(id);
    setQuestions(updated);
    const q = updated.find(q => q._id === selected._id);
    if (q) setSelected(q);
  };

  const pin = async (qid) => { await api.pinQuestion(qid); load(); };
  const resolve = async (qid) => { await api.resolveQuestion(qid); load(); };
  const del  = async (qid) => { if (!confirm('Delete?')) return; await api.deleteQuestion(qid); load(); setSelected(null); };
  const pinAns = async (qid, aid) => { await api.pinAnswer(qid, aid); const updated = await api.getQuestions(id); setQuestions(updated); const q = updated.find(q => q._id === qid); if (q) setSelected(q); };

  // ── Question detail ─────────────────────────────────────────────────────────
  if (selected) {
    const pinned = selected.answers?.filter(a => a.isPinned) || [];
    const rest   = selected.answers?.filter(a => !a.isPinned) || [];
    const sorted = [...pinned, ...rest];

    return (
      <div style={{ padding: '20px 16px' }}>
        <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ marginBottom: 20 }}>← Back</button>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {selected.isPinned && <span className="tag" style={{ background: '#EEF2FF', color: 'var(--accent)' }}>📌 Pinned</span>}
            {selected.isResolved && <span className="tag" style={{ background: '#D1FAE5', color: '#065F46' }}>✅ Resolved</span>}
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{selected.text}</div>
          {selected.imageUrl && <img src={selected.imageUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, maxHeight: 200, objectFit: 'cover' }} />}
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Asked by {selected.askerName} · {new Date(selected.createdAt).toLocaleDateString()}</div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {!selected.isPinned && <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => pin(selected._id)}>📌 Pin</button>}
              {!selected.isResolved && <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => resolve(selected._id)}>✅ Resolve</button>}
              <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => del(selected._id)}>Delete</button>
            </div>
          )}
        </div>

        <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
          {sorted.length} {sorted.length === 1 ? 'Answer' : 'Answers'}
        </h3>

        {sorted.map((a, i) => (
          <div key={i} className="card" style={{ marginBottom: 10, borderLeft: `4px solid ${a.isPinned ? 'var(--success)' : a.isAdmin ? 'var(--accent)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {a.isPinned ? '📌 ' : ''}{a.answererName} {a.isAdmin ? '👨‍🏫' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{a.text}</p>
            {isAdmin && !a.isPinned && (
              <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12, padding: '4px 10px' }}
                onClick={() => pinAns(selected._id, a._id)}>📌 Pin as best answer</button>
            )}
          </div>
        ))}

        {sorted.length === 0 && <div className="empty">No answers yet. Be the first!</div>}

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Post an Answer</h3>
          <textarea placeholder="Write your answer…" value={answerText} rows={4}
            onChange={e => setAnswerText(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          <button className="btn btn-primary" onClick={postAnswer} disabled={!answerText.trim()}>Post Answer</button>
        </div>
      </div>
    );
  }

  // ── Question list ───────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>💬 Forum</h2>
        <button className="btn btn-primary" onClick={() => setShowAsk(s => !s)}>{showAsk ? 'Cancel' : '+ Ask'}</button>
      </div>

      {showAsk && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Ask a Question</h3>
          <textarea placeholder="What would you like to know?" value={askForm.text} rows={4}
            onChange={e => setAskForm(f => ({ ...f, text: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
          <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 12 }}>
            Attach image (optional):
            <input type="file" accept="image/*" style={{ display: 'block', marginTop: 4 }}
              onChange={e => setAskForm(f => ({ ...f, image: e.target.files[0] }))} />
          </label>
          <button className="btn btn-primary" onClick={askQuestion} disabled={saving}>{saving ? 'Posting…' : 'Post Question'}</button>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && questions.length === 0 && <div className="empty">No questions yet. Ask the first one!</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map(q => (
          <div key={q._id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(q)}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              {q.isPinned && <span className="tag" style={{ background: '#EEF2FF', color: 'var(--accent)' }}>📌</span>}
              {q.isResolved && <span className="tag" style={{ background: '#D1FAE5', color: '#065F46' }}>✅</span>}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.text}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {q.askerName} · {q.answers?.length || 0} answers · {new Date(q.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font)', marginBottom: 12, outline: 'none' };
