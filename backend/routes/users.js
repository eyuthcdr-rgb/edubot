import { Router } from 'express';
import User from '../models/User.js';
import { telegramAuth, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// GET /api/users/me — current user profile
router.get('/me', telegramAuth, async (req, res) => {
  await User.findOneAndUpdate(
    { telegramId: req.dbUser.telegramId },
    { lastSeen: new Date() }
  );
  res.json(req.dbUser);
});

// PUT /api/users/me — update own profile
router.put('/me', telegramAuth, upload.single('profilePic'), async (req, res) => {
  const update = {};
  if (req.body.fullName)      update.fullName      = req.body.fullName;
  if (req.body.academicLevel) update.academicLevel = req.body.academicLevel;
  if (req.body.bio)           update.bio           = req.body.bio;
  if (req.file)               update.profilePicUrl = req.file.path;

  const user = await User.findOneAndUpdate(
    { telegramId: req.dbUser.telegramId },
    update,
    { new: true }
  );
  res.json(user);
});

// GET /api/users — list all users with search + pagination (admin only)
router.get('/', telegramAuth, requireAdmin, async (req, res) => {
  const page    = parseInt(req.query.page  || '1');
  const limit   = parseInt(req.query.limit || '20');
  const search  = req.query.search || '';

  const filter = search
    ? {
        $or: [
          { fullName:  { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { username:  { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/users/:telegramId — single student full profile (admin only)
router.get('/:telegramId', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOne({ telegramId: Number(req.params.telegramId) });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:telegramId/approve
router.patch('/:telegramId/approve', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { status: 'approved' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:telegramId/block
router.patch('/:telegramId/block', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { status: 'blocked' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:telegramId/unblock
router.patch('/:telegramId/unblock', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { status: 'approved' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:telegramId/make-admin
router.patch('/:telegramId/make-admin', telegramAuth, requireAdmin, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { telegramId: Number(req.params.telegramId) },
    { role: 'admin', status: 'approved' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /api/users/feedback — submit feedback (approved students)
router.post('/feedback', telegramAuth, upload.single('file'), async (req, res) => {
  const { text } = req.body;
  if (!text && !req.file) return res.status(400).json({ error: 'Feedback text or file required' });

  const feedbackEntry = {
    text:     text || '',
    fileUrl:  req.file?.path || '',
    fileType: req.file ? (req.file.mimetype === 'application/pdf' ? 'pdf' : 'image') : '',
  };

  const user = await User.findOneAndUpdate(
    { telegramId: req.dbUser.telegramId },
    { $push: { feedbackHistory: feedbackEntry } },
    { new: true }
  );

  res.json({ ok: true, feedback: feedbackEntry });
});

export default router;
