const BASE = import.meta.env.VITE_API_URL;

function getInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': getInitData(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function uploadForm(path, formData, method = 'POST') {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'x-telegram-init-data': getInitData() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export const api = {
  // User
  getMe:           ()              => request('/api/users/me'),
  updateProfile:   (fd)            => uploadForm('/api/users/me', fd, 'PUT'),
  sendFeedback:    (text, file)    => { const fd = new FormData(); fd.append('text', text); if (file) fd.append('file', file); return uploadForm('/api/users/feedback', fd); },

  // Admin users
  getUsers:        (page, search)  => request(`/api/users?page=${page||1}&search=${encodeURIComponent(search||'')}`),
  getUser:         (tid)           => request(`/api/users/${tid}`),
  approveUser:     (tid)           => request(`/api/users/${tid}/approve`,  { method: 'PATCH' }),
  blockUser:       (tid)           => request(`/api/users/${tid}/block`,    { method: 'PATCH' }),
  unblockUser:     (tid)           => request(`/api/users/${tid}/unblock`,  { method: 'PATCH' }),

  // Subjects
  getSubjects:     ()              => request('/api/subjects'),
  createSubject:   (data)          => request('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubject:   (id)            => request(`/api/subjects/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes:        (sid)           => request(`/api/notes?subject=${sid}`),
  createNote:      (fd)            => uploadForm('/api/notes', fd),
  deleteNote:      (id)            => request(`/api/notes/${id}`, { method: 'DELETE' }),

  // Videos
  getVideos:       (sid)           => request(`/api/videos?subject=${sid}`),
  createVideo:     (data)          => request('/api/videos', { method: 'POST', body: JSON.stringify(data) }),
  deleteVideo:     (id)            => request(`/api/videos/${id}`, { method: 'DELETE' }),

  // Quizzes
  getQuizzes:      (sid)           => request(`/api/quizzes?subject=${sid}`),
  getQuiz:         (id)            => request(`/api/quizzes/${id}`),
  startQuiz:       (id)            => request(`/api/quizzes/${id}/start`, { method: 'POST' }),
  saveQuiz:        (id, answers, timeRemaining) => request(`/api/quizzes/${id}/save`, { method: 'PATCH', body: JSON.stringify({ answers, timeRemaining }) }),
  submitQuiz:      (id, answers)   => request(`/api/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  createQuiz:      (fd)            => uploadForm('/api/quizzes', fd),
  deleteQuiz:      (id)            => request(`/api/quizzes/${id}`, { method: 'DELETE' }),

  // Homework
  getHomework:     (sid)           => request(`/api/homework?subject=${sid}`),
  getHomeworkItem: (id)            => request(`/api/homework/${id}`),
  createHomework:  (fd)            => uploadForm('/api/homework', fd),
  deleteHomework:  (id)            => request(`/api/homework/${id}`, { method: 'DELETE' }),
  submitHomework:  (id, fd)        => uploadForm(`/api/homework/${id}/submit`, fd),
  getSubmissions:  (id)            => request(`/api/homework/${id}/submissions`),
  gradeSubmission: (subId, data)   => request(`/api/homework/submissions/${subId}/grade`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Questions / Forum
  getQuestions:    (sid)           => request(`/api/questions?subject=${sid}`),
  askQuestion:     (fd)            => uploadForm('/api/questions', fd),
  answerQuestion:  (id, text)      => request(`/api/questions/${id}/answer`, { method: 'POST', body: JSON.stringify({ text }) }),
  pinQuestion:     (id)            => request(`/api/questions/${id}/pin`,    { method: 'PATCH' }),
  resolveQuestion: (id)            => request(`/api/questions/${id}/resolve`, { method: 'PATCH' }),
  pinAnswer:       (qid, aid)      => request(`/api/questions/${qid}/answers/${aid}/pin`, { method: 'PATCH' }),
  deleteQuestion:  (id)            => request(`/api/questions/${id}`, { method: 'DELETE' }),

  // Analytics
  getMyStats:      ()              => request('/api/analytics/me'),
  getAdminStats:   ()              => request('/api/analytics/admin'),
};
