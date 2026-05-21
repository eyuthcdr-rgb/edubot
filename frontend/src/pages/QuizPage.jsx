import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function QuizPage({ isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState(null);   // active quiz object
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]  = useState({ title: '', questions: [emptyQ()] });
  const [saving, setSaving] = useState(false);

  function emptyQ() { return { question: '', options: ['', '', '', ''], answer: 0, explanation: '' }; }

  const load = () => api.getQuizzes(id).then(setQuizzes).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const startQuiz = async (quiz) => {
    const full = await api.getQuiz(quiz._id);
    setActive(full);
    setAnswers(new Array(full.questions.length).fill(null));
    setResults(null);
  };

  const submit = async () => {
    if (answers.includes(null)) return alert('Please answer all questions.');
    const res = await api.submitQuiz(active._id, answers);
    setResults(res);
  };

  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQ()] }));

  const saveQuiz = async () => {
    if (!form.title) return alert('Quiz title required.');
    setSaving(true);
    try {
      await api.createQuiz({ subject: id, title: form.title, questions: form.questions });
      setForm({ title: '', questions: [emptyQ()] });
      setShowForm(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (qid) => {
    if (!confirm('Delete this quiz?')) return;
    await api.deleteQuiz(qid);
    setQuizzes(q => q.filter(x => x._id !== qid));
  };

  // ── Taking a quiz ────────────────────────────────────────────────────────────
  if (active) {
    if (results) {
      const pct = Math.round((results.score / results.total) * 100);
      return (
        <div style={{ padding: '20px 16px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 20 }}>Quiz Results</h2>
          <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{pct >= 70 ? '🎉' : '📖'}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: pct >= 70 ? 'var(--success)' : 'var(--warning)' }}>
              {results.score}/{results.total}
            </div>
            <div style={{ color: 'var(--text2)', marginTop: 4 }}>{pct}% correct</div>
          </div>
          {active.questions.map((q, i) => (
            <div key={i} className="card" style={{ marginBottom: 10, borderLeft: `4px solid ${results.results[i].correct ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{i + 1}. {q.question}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Your answer: <b>{q.options?.[answers[i]] || '—'}</b> {results.results[i].correct ? '✅' : '❌'}
              </div>
              {!results.results[i].correct && (
                <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>
                  Correct: {q.options?.[results.results[i].correctAnswer]}
                </div>
              )}
              {results.results[i].explanation && (
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6, fontStyle: 'italic' }}>
                  💡 {results.results[i].explanation}
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" onClick={() => setActive(null)} style={{ marginTop: 8 }}>
            ← Back to Quizzes
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px 16px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 20 }}>{active.title}</h2>
        {active.questions.map((q, i) => (
          <div key={i} className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{i + 1}. {q.question}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(q.options || []).map((opt, j) => (
                <button key={j}
                  onClick={() => setAnswers(a => { const c = [...a]; c[i] = j; return c; })}
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: '2px solid',
                    borderColor: answers[i] === j ? 'var(--accent)' : 'var(--border)',
                    background: answers[i] === j ? '#EEF2FF' : 'var(--surface)',
                    fontFamily: 'var(--font)', fontSize: 14, textAlign: 'left', cursor: 'pointer',
                    fontWeight: answers[i] === j ? 600 : 400,
                    color: 'var(--text)',
                  }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }} onClick={submit}>
          Submit Quiz
        </button>
      </div>
    );
  }

  // ── Quiz list ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>❓ Quizzes</h2>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Add'}</button>}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>New Quiz</h3>
          <input placeholder="Quiz title" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
          {form.questions.map((q, qi) => (
            <div key={qi} style={{ background: 'var(--bg)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Question {qi + 1}</div>
              <input placeholder="Question" value={q.question}
                onChange={e => setForm(f => { const qs = [...f.questions]; qs[qi] = { ...qs[qi], question: e.target.value }; return { ...f, questions: qs }; })}
                style={inputStyle} />
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input type="radio" name={`correct-${qi}`} checked={q.answer === oi}
                    onChange={() => setForm(f => { const qs = [...f.questions]; qs[qi] = { ...qs[qi], answer: oi }; return { ...f, questions: qs }; })} />
                  <input placeholder={`Option ${oi + 1}`} value={opt}
                    onChange={e => setForm(f => { const qs = [...f.questions]; const opts = [...qs[qi].options]; opts[oi] = e.target.value; qs[qi] = { ...qs[qi], options: opts }; return { ...f, questions: qs }; })}
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                </div>
              ))}
              <input placeholder="Explanation (optional)" value={q.explanation}
                onChange={e => setForm(f => { const qs = [...f.questions]; qs[qi] = { ...qs[qi], explanation: e.target.value }; return { ...f, questions: qs }; })}
                style={{ ...inputStyle, marginTop: 6 }} />
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Select the radio button next to the correct option.</div>
            </div>
          ))}
          <button className="btn btn-ghost" onClick={addQuestion} style={{ marginBottom: 12 }}>+ Add Question</button>
          <button className="btn btn-primary" onClick={saveQuiz} disabled={saving}>{saving ? 'Saving…' : 'Save Quiz'}</button>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && quizzes.length === 0 && <div className="empty">No quizzes yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {quizzes.map(q => (
          <div key={q._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{q.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                  {q.questions?.length || 0} questions
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isAdmin && (
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => del(q._id)}>Delete</button>
                )}
                <button className="btn btn-primary" style={{ padding: '8px 14px' }} onClick={() => startQuiz(q)}>Start</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 14, fontFamily: 'var(--font)', marginBottom: 12, outline: 'none',
};
