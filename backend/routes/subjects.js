import { Router } from 'express';
import Subject from '../models/Subject.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/subjects — list all subjects (approved students)
router.get('/', telegramAuth, requireApproved, async (req, res) => {
  const subjects = await Subject.find().sort('order');
  res.json(subjects);
});

// POST /api/subjects — create a subject (admin only)
router.post('/', telegramAuth, requireAdmin, async (req, res) => {
  const { name, description, icon, color, order } = req.body;
  const subject = await Subject.create({ name, description, icon, color, order });
  res.status(201).json(subject);
});

// PUT /api/subjects/:id — update a subject (admin only)
router.put('/:id', telegramAuth, requireAdmin, async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
});

// DELETE /api/subjects/:id — delete a subject (admin only)
router.delete('/:id', telegramAuth, requireAdmin, async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
