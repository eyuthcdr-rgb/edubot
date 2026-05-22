import { Router } from 'express';
import Homework from '../models/Homework.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// GET /api/homework?subject=id
router.get('/', telegramAuth, requireApproved, async (req, res) => {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  const homework = await Homework.find(filter).sort('-createdAt').populate('subject', 'name');
  res.json(homework);
});

// GET /api/homework/:id
router.get('/:id', telegramAuth, requireApproved, async (req, res) => {
  const hw = await Homework.findById(req.params.id).populate('subject', 'name icon');
  if (!hw) return res.status(404).json({ error: 'Homework not found' });

  // Check if student already submitted
  const mySubmission = await Submission.findOne({
    homework: req.params.id,
    student: req.dbUser.telegramId,
  });

  res.json({ homework: hw, mySubmission: mySubmission || null });
});

// POST /api/homework — create (admin)
router.post('/', telegramAuth, requireAdmin, upload.single('file'), async (req, res) => {
  const { subject, title, description, dueDate } = req.body;
  const hw = await Homework.create({
    subject, title, description,
    dueDate: dueDate ? new Date(dueDate) : null,
    fileUrl:  req.file?.path || '',
    fileType: req.file ? (req.file.mimetype === 'application/pdf' ? 'pdf' : 'image') : '',
    addedBy:  req.dbUser.telegramId,
  });
  res.status(201).json(hw);
});

// DELETE /api/homework/:id (admin)
router.delete('/:id', telegramAuth, requireAdmin, async (req, res) => {
  await Homework.findByIdAndDelete(req.params.id);
  await Submission.deleteMany({ homework: req.params.id });
  res.json({ ok: true });
});

// POST /api/homework/:id/submit — student submits homework
router.post('/:id/submit', telegramAuth, requireApproved, upload.single('file'), async (req, res) => {
  const hw = await Homework.findById(req.params.id);
  if (!hw) return res.status(404).json({ error: 'Homework not found' });

  // Check duplicate
  const existing = await Submission.findOne({ homework: req.params.id, student: req.dbUser.telegramId });
  if (existing) return res.status(400).json({ error: 'You already submitted this homework.' });

  if (!req.file && !req.body.note) return res.status(400).json({ error: 'File or note required.' });

  const user = await User.findOne({ telegramId: req.dbUser.telegramId });

  const sub = await Submission.create({
    homework:    req.params.id,
    student:     req.dbUser.telegramId,
    studentName: user?.fullName || user?.firstName || 'Unknown',
    fileUrl:     req.file?.path || '',
    fileType:    req.file ? (req.file.mimetype === 'application/pdf' ? 'pdf' : 'image') : '',
    note:        req.body.note || '',
  });
  res.status(201).json(sub);
});

// GET /api/homework/:id/submissions — admin views all submissions
router.get('/:id/submissions', telegramAuth, requireAdmin, async (req, res) => {
  const submissions = await Submission.find({ homework: req.params.id }).sort('-submittedAt');
  res.json(submissions);
});

// PATCH /api/homework/submissions/:subId/grade — admin grades a submission
router.patch('/submissions/:subId/grade', telegramAuth, requireAdmin, async (req, res) => {
  const { grade, adminFeedback } = req.body;
  const sub = await Submission.findByIdAndUpdate(
    req.params.subId,
    { grade, adminFeedback, status: 'graded' },
    { new: true }
  );
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  res.json(sub);
});

export default router;
