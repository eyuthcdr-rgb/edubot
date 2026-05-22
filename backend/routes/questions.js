import { Router } from 'express';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// GET /api/questions?subject=id
router.get('/', telegramAuth, requireApproved, async (req, res) => {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  const questions = await Question.find(filter).sort('-isPinned -createdAt').populate('subject', 'name');
  res.json(questions);
});

// POST /api/questions — ask a question
router.post('/', telegramAuth, requireApproved, upload.single('image'), async (req, res) => {
  const { subject, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Question text required' });

  const user = await User.findOne({ telegramId: req.dbUser.telegramId });
  const q = await Question.create({
    subject,
    text,
    askedBy:    req.dbUser.telegramId,
    askerName:  user?.fullName || user?.firstName || 'Student',
    imageUrl:   req.file?.path || '',
  });
  res.status(201).json(q);
});

// POST /api/questions/:id/answer — post an answer
router.post('/:id/answer', telegramAuth, requireApproved, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Answer text required' });

  const user    = await User.findOne({ telegramId: req.dbUser.telegramId });
  const isAdmin = req.dbUser.role === 'admin';

  const answer = {
    answeredBy:   req.dbUser.telegramId,
    answererName: user?.fullName || user?.firstName || 'Student',
    text,
    isAdmin,
    isPinned: false,
  };

  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { $push: { answers: answer } },
    { new: true }
  );
  if (!question) return res.status(404).json({ error: 'Question not found' });

  res.json(question);
});

// PATCH /api/questions/:id/pin — admin pins a question
router.patch('/:id/pin', telegramAuth, requireAdmin, async (req, res) => {
  const q = await Question.findByIdAndUpdate(
    req.params.id,
    { isPinned: true },
    { new: true }
  );
  res.json(q);
});

// PATCH /api/questions/:id/resolve — mark as resolved
router.patch('/:id/resolve', telegramAuth, requireAdmin, async (req, res) => {
  const q = await Question.findByIdAndUpdate(
    req.params.id,
    { isResolved: true },
    { new: true }
  );
  res.json(q);
});

// PATCH /api/questions/:id/answers/:answerId/pin — admin pins an answer
router.patch('/:id/answers/:answerId/pin', telegramAuth, requireAdmin, async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  const ans = q.answers.id(req.params.answerId);
  if (!ans) return res.status(404).json({ error: 'Answer not found' });
  ans.isPinned = true;
  await q.save();
  res.json(q);
});

// DELETE /api/questions/:id (admin)
router.delete('/:id', telegramAuth, requireAdmin, async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
