import { Router } from 'express';
import Quiz from '../models/Quiz.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/quizzes?subject=id
router.get('/', telegramAuth, requireApproved, async (req, res) => {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  // Hide correct answers from students
  const quizzes = await Quiz.find(filter).sort('-createdAt').populate('subject', 'name').select('-questions.answer -questions.explanation');
  res.json(quizzes);
});

// GET /api/quizzes/:id — full quiz with answers hidden
router.get('/:id', telegramAuth, requireApproved, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('subject', 'name icon').select('-questions.answer');
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  res.json(quiz);
});

// POST /api/quizzes/:id/submit — submit answers, get score
router.post('/:id/submit', telegramAuth, requireApproved, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const { answers } = req.body; // array of chosen option indices
  let score = 0;
  const results = quiz.questions.map((q, i) => {
    const correct = answers[i] === q.answer;
    if (correct) score++;
    return { correct, correctAnswer: q.answer, explanation: q.explanation };
  });

  res.json({ score, total: quiz.questions.length, results });
});

// POST /api/quizzes — create quiz (admin only)
router.post('/', telegramAuth, requireAdmin, async (req, res) => {
  const { subject, title, questions } = req.body;
  const quiz = await Quiz.create({ subject, title, questions, addedBy: req.dbUser.telegramId });
  res.status(201).json(quiz);
});

// DELETE /api/quizzes/:id (admin only)
router.delete('/:id', telegramAuth, requireAdmin, async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
