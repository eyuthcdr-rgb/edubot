import { Router } from 'express';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// GET /api/quizzes?subject=id
router.get('/', telegramAuth, requireApproved, async (req, res) => {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  const quizzes = await Quiz.find(filter).sort('-createdAt').populate('subject', 'name').select('-questions.answer -questions.explanation');
  res.json(quizzes);
});

// GET /api/quizzes/:id
router.get('/:id', telegramAuth, requireApproved, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('subject', 'name icon').select('-questions.answer');
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  // Check for existing in-progress attempt
  const attempt = await QuizAttempt.findOne({
    quiz: req.params.id,
    student: req.dbUser.telegramId,
    status: 'in_progress',
  });

  res.json({ quiz, attempt: attempt || null });
});

// POST /api/quizzes/:id/start — start or resume attempt
router.post('/:id/start', telegramAuth, requireApproved, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  // Check existing attempt
  let attempt = await QuizAttempt.findOne({
    quiz: req.params.id,
    student: req.dbUser.telegramId,
    status: 'in_progress',
  });

  if (!attempt) {
    attempt = await QuizAttempt.create({
      quiz:          req.params.id,
      student:       req.dbUser.telegramId,
      answers:       new Array(quiz.questions.length).fill(null),
      total:         quiz.questions.length,
      timeRemaining: quiz.timeLimit || 0,
    });
  }

  res.json(attempt);
});

// PATCH /api/quizzes/:id/save — save progress (called every 30s)
router.patch('/:id/save', telegramAuth, requireApproved, async (req, res) => {
  const { answers, timeRemaining } = req.body;
  const attempt = await QuizAttempt.findOneAndUpdate(
    { quiz: req.params.id, student: req.dbUser.telegramId, status: 'in_progress' },
    { answers, timeRemaining },
    { new: true }
  );
  if (!attempt) return res.status(404).json({ error: 'No active attempt' });
  res.json({ ok: true });
});

// POST /api/quizzes/:id/submit
router.post('/:id/submit', telegramAuth, requireApproved, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const { answers } = req.body;
  let score = 0;
  const results = quiz.questions.map((q, i) => {
    const correct = answers[i] === q.answer;
    if (correct) score++;
    return { correct, correctAnswer: q.answer, explanation: q.explanation };
  });

  // Update attempt
  await QuizAttempt.findOneAndUpdate(
    { quiz: req.params.id, student: req.dbUser.telegramId, status: 'in_progress' },
    { answers, score, status: 'submitted', submittedAt: new Date() },
  );

  res.json({ score, total: quiz.questions.length, results });
});

// POST /api/quizzes — create quiz with optional question images (admin)
router.post('/', telegramAuth, requireAdmin, upload.array('images', 20), async (req, res) => {
  let { subject, title, questions, timeLimit } = req.body;
  if (typeof questions === 'string') questions = JSON.parse(questions);

  // Attach uploaded images to questions by index
  if (req.files?.length) {
    req.files.forEach(f => {
      const idx = parseInt(f.fieldname.replace('image_', ''));
      if (!isNaN(idx) && questions[idx]) questions[idx].imageUrl = f.path;
    });
  }

  const quiz = await Quiz.create({
    subject, title, questions,
    timeLimit: timeLimit ? parseInt(timeLimit) : 0,
    addedBy: req.dbUser.telegramId,
  });
  res.status(201).json(quiz);
});

// DELETE /api/quizzes/:id (admin)
router.delete('/:id', telegramAuth, requireAdmin, async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  await QuizAttempt.deleteMany({ quiz: req.params.id });
  res.json({ ok: true });
});

// GET /api/quizzes/:id/attempts — admin sees all attempts
router.get('/:id/attempts', telegramAuth, requireAdmin, async (req, res) => {
  const attempts = await QuizAttempt.find({ quiz: req.params.id }).sort('-createdAt');
  res.json(attempts);
});

export default router;
