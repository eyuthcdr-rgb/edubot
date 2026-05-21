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

// For multipart (file upload) — no Content-Type header, browser sets it with boundary
async function upload(path, formData) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
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
  getMe:          ()           => request('/api/users/me'),

  // Subjects
  getSubjects:    ()           => request('/api/subjects'),
  createSubject:  (data)       => request('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubject:  (id)         => request(`/api/subjects/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes:       (subjectId)  => request(`/api/notes?subject=${subjectId}`),
  getNote:        (id)         => request(`/api/notes/${id}`),
  createNote:     (formData)   => upload('/api/notes', formData),
  deleteNote:     (id)         => request(`/api/notes/${id}`, { method: 'DELETE' }),

  // Videos
  getVideos:      (subjectId)  => request(`/api/videos?subject=${subjectId}`),
  createVideo:    (data)       => request('/api/videos', { method: 'POST', body: JSON.stringify(data) }),
  deleteVideo:    (id)         => request(`/api/videos/${id}`, { method: 'DELETE' }),

  // Quizzes
  getQuizzes:     (subjectId)  => request(`/api/quizzes?subject=${subjectId}`),
  getQuiz:        (id)         => request(`/api/quizzes/${id}`),
  submitQuiz:     (id, answers) => request(`/api/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  createQuiz:     (data)       => request('/api/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  deleteQuiz:     (id)         => request(`/api/quizzes/${id}`, { method: 'DELETE' }),

  // Admin
  getUsers:       ()           => request('/api/users'),
  approveUser:    (tid)        => request(`/api/users/${tid}/approve`, { method: 'PATCH' }),
  blockUser:      (tid)        => request(`/api/users/${tid}/block`,   { method: 'PATCH' }),
};
