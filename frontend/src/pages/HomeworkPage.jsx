import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function HomeworkPage({ isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState({ title: '', description: '', dueDate: '', file: null });
  const [subForm, setSubForm] = useState({ note: '', file: null });
  const [saving, setSaving]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', adminFeedback: '' });

  const load = () => api.getHomework(id).then(setHomework).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const openHW = async (hw) => {
    const { homework: full, mySubmission } = await api.getHomeworkItem(hw._id);
    setSelected({ ...full, mySubmission });
    if (isAdmin) {
      const subs = await api.getSubmissions(hw._id);
      setSubmissions(subs);
    }
  };

  const createHW = async () => {
    if (!form.title) return alert('Title required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('subject', id);
      fd.append('title', form.title);
      fd.append('description', form.description);
      if (form.dueDate) fd.append('dueDate', form.dueDate);
      if (form.file) fd.append('file', form.file);
      await api.createHomework(fd);
      setForm({ title: '', description: '', dueDate: '', file: null });
      setShowForm(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const submitHW = async () => {
    if (!subForm.file && !subForm.note) return alert('Please add a file or note.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (subForm.file) fd.append('file', subForm.file);
      if (subForm.note) fd.append('note', subForm.note);
      await api.submitHomework(selected._id, fd);
      await openHW(selected); // refresh
      setSubForm({ note: '', file: null });
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const grade = async (subId) => {
    await api.gradeSubmission(subId, gradeForm);
    const subs = await api.getSubmissions(selected._id);
    setSubmissions(subs);
    setGrading(null);
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div style={{ padding: '20px 16px' }}>
        <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ marginBottom: 20 }}>← Back</button>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>{selected.title}</h2>
          {selected.description && <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 10 }}>{selected.description}</p>}
          {selected.dueDate && (
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: isOverdue(selected.dueDate) ? '#FEE2E2' : '#EEF2FF',
              color: isOverdue(selected.dueDate) ? 'var(--danger)' : 'var(--accent)',
            }}>
              {isOverdue(selected.dueDate) ? '⚠️ Overdue' : '📅'} Due: {new Date(selected.dueDate).toLocaleDateString()}
            </span>
          )}
          {selected.fileUrl && (
            <a href={selected.fileUrl} target="_blank" rel="noreferrer"
              className="btn btn-ghost" style={{ marginTop: 12, display: 'inline-flex' }}>
              {selected.fileType === 'pdf' ? '📄 View Assignment PDF' : '🖼 View Attachment'}
            </a>
          )}
        </div>

        {/* Student submission */}
        {!isAdmin && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Your Submission</h3>
            {selected.mySubmission ? (
              <div>
                <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: selected.mySubmission.status === 'graded' ? '#D1FAE5' : '#FEF3C7',
                  color: selected.mySubmission.status === 'graded' ? '#065F46' : '#92400E', marginBottom: 10 }}>
                  {selected.mySubmission.status === 'graded' ? '✅ Graded' : '⏳ Submitted — awaiting grade'}
                </div>
                {selected.mySubmission.note && <p style={{ fontSize: 14, marginBottom: 8 }}>Note: {selected.mySubmission.note}</p>}
                {selected.mySubmission.fileUrl && <a href={selected.mySubmission.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ display: 'inline-flex', marginBottom: 8 }}>View your file</a>}
                {selected.mySubmission.status === 'graded' && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12, marginTop: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>Grade: {selected.mySubmission.grade}</div>
                    {selected.mySubmission.adminFeedback && <div style={{ fontSize: 13, marginTop: 4 }}>Feedback: {selected.mySubmission.adminFeedback}</div>}
                  </div>
                )}
              </div>
            ) : (
              <>
                <textarea placeholder="Add a note (optional)" value={subForm.note} rows={3}
                  onChange={e => setSubForm(f => ({ ...f, note: e.target.value }))} style={inputStyle} />
                <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 12 }}>
                  Attach file (PDF or image):
                  <input type="file" accept=".pdf,image/*" style={{ display: 'block', marginTop: 4 }}
                    onChange={e => setSubForm(f => ({ ...f, file: e.target.files[0] }))} />
                </label>
                <button className="btn btn-primary" onClick={submitHW} disabled={submitting}>
                  {submitting ? 'Submitting…' : '📤 Submit Homework'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Admin: view all submissions */}
        {isAdmin && (
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Submissions ({submissions.length})</h3>
            {submissions.length === 0 && <div className="empty">No submissions yet.</div>}
            {submissions.map(sub => (
              <div key={sub._id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{sub.studentName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(sub.submittedAt).toLocaleString()}</div>
                    {sub.note && <p style={{ fontSize: 13, marginTop: 6 }}>{sub.note}</p>}
                    {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ marginTop: 8, display: 'inline-flex', fontSize: 12 }}>View file</a>}
                  </div>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: sub.status === 'graded' ? '#D1FAE5' : '#FEF3C7',
                    color: sub.status === 'graded' ? '#065F46' : '#92400E' }}>
                    {sub.status}
                  </span>
                </div>
                {sub.status === 'graded' ? (
                  <div style={{ marginTop: 8, background: 'var(--surface2)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 600 }}>Grade: {sub.grade}</div>
                    {sub.adminFeedback && <div style={{ fontSize: 13 }}>{sub.adminFeedback}</div>}
                  </div>
                ) : (
                  grading === sub._id ? (
                    <div style={{ marginTop: 10 }}>
                      <input placeholder="Grade (e.g. A, 85/100)" value={gradeForm.grade}
                        onChange={e => setGradeForm(f => ({ ...f, grade: e.target.value }))} style={inputStyle} />
                      <textarea placeholder="Feedback (optional)" value={gradeForm.adminFeedback} rows={2}
                        onChange={e => setGradeForm(f => ({ ...f, adminFeedback: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" onClick={() => grade(sub._id)}>Save Grade</button>
                        <button className="btn btn-ghost" onClick={() => setGrading(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ marginTop: 10, fontSize: 13 }}
                      onClick={() => { setGrading(sub._id); setGradeForm({ grade: '', adminFeedback: '' }); }}>
                      ✏️ Grade
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>📋 Homework</h2>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Add'}</button>}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>New Assignment</h3>
          <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
          <textarea placeholder="Description (optional)" value={form.description} rows={3}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
          <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Due Date:</label>
          <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inputStyle} />
          <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
            Attach file (optional):
            <input type="file" accept=".pdf,image/*" style={{ display: 'block', marginTop: 4 }}
              onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} />
          </label>
          <button className="btn btn-primary" onClick={createHW} disabled={saving}>{saving ? 'Saving…' : 'Post Assignment'}</button>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && homework.length === 0 && <div className="empty">No assignments yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {homework.map(hw => (
          <div key={hw._id} className="card" style={{ cursor: 'pointer' }} onClick={() => openHW(hw)}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{hw.title}</div>
            {hw.description && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{hw.description.slice(0, 80)}{hw.description.length > 80 ? '…' : ''}</div>}
            {hw.dueDate && (
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: isOverdue(hw.dueDate) ? '#FEE2E2' : '#EEF2FF',
                color: isOverdue(hw.dueDate) ? 'var(--danger)' : 'var(--accent)',
              }}>
                {isOverdue(hw.dueDate) ? '⚠️ Overdue' : '📅'} {new Date(hw.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font)', marginBottom: 12, outline: 'none' };
