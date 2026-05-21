import { Router } from 'express';
import User from '../models/User.js';
import { telegramAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/users/me — current user profile
router.get('/me', telegramAuth, async (req, res) => {
  res.json(req.dbUser);
});

// GET /api/users — list all users (admin only)
router.get('/', telegramAuth, requireAdmin, async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json(users);
});

// PATCH /api/users/:telegramId/approve — approve a student (admin only)
router.patch('/:telegramId/approve', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { status: 'approved' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:telegramId/block — block a student (admin only)
router.patch('/:telegramId/block', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { status: 'blocked' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:telegramId/make-admin (admin only)
router.patch('/:telegramId/make-admin', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { role: 'admin', status: 'approved' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
