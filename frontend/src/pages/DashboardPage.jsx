import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
      <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function DashboardPage({ isAdmin }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = isAdmin ? api.getAdminStats : api.getMyStats;
    fn().then(setStats).finally(() => setLoading(false));
  }, [isAdmin]);

  if (loading) return <div className="spinner" style={{ marginTop: 60 }} />;

  return (
    <div style={{ padding: '20px 16px' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 20 }}>← Back</button>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 20 }}>
        {isAdmin ? '📊 Admin Dashboard' : '📊 My Dashboard'}
      </h2>

      {isAdmin ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <StatCard icon="👥" label="Total Students"     value={stats.totalStudents}      color="var(--accent)" />
            <StatCard icon="🟢" label="Active Today"       value={stats.activeToday}         color="var(--success)" />
            <StatCard icon="⏳" label="Pending Approval"   value={stats.pendingApproval}     color="var(--warning)" />
            <StatCard icon="📝" label="Submissions to Grade" value={stats.pendingSubmissions} color="var(--danger)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatCard icon="🏆" label="Avg Quiz Score"     value={`${stats.averageQuizScore}%`} color="var(--accent2)" />
            <StatCard icon="❓" label="Quizzes Taken"      value={stats.totalQuizzesTaken}   color="var(--accent)" />
            <StatCard icon="📚" label="Total Subjects"     value={stats.totalSubjects}        color="var(--success)" />
          </div>

          {stats.pendingApproval > 0 && (
            <div className="card" style={{ marginTop: 20, borderLeft: '4px solid var(--warning)', cursor: 'pointer' }}
              onClick={() => navigate('/admin')}>
              <div style={{ fontWeight: 600 }}>⚠️ {stats.pendingApproval} student{stats.pendingApproval > 1 ? 's' : ''} waiting for approval</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Tap to go to Admin Panel →</div>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <StatCard icon="❓" label="Quizzes Taken"    value={stats.quizzesTaken}      color="var(--accent)" />
            <StatCard icon="🏆" label="Average Score"    value={`${stats.averageScore}%`} color={stats.averageScore >= 70 ? 'var(--success)' : 'var(--warning)'} />
            <StatCard icon="📋" label="Pending Homework" value={stats.pendingHomework}    color="var(--danger)" />
            <StatCard icon="✅" label="Graded Work"      value={stats.gradedWork}         color="var(--success)" />
          </div>

          {stats.recentAttempts?.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Recent Quiz Activity</h3>
              {stats.recentAttempts.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < stats.recentAttempts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 14 }}>{a.quiz?.title || 'Quiz'}</div>
                  <div style={{ fontWeight: 600, color: (a.score / a.total) >= 0.7 ? 'var(--success)' : 'var(--warning)' }}>
                    {a.score}/{a.total}
                  </div>
                </div>
              ))}
            </div>
          )}

          {stats.pendingHomework > 0 && (
            <div className="card" style={{ marginTop: 16, borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontWeight: 600 }}>📋 You have {stats.pendingHomework} pending assignment{stats.pendingHomework > 1 ? 's' : ''}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Go to your subjects to submit them.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
