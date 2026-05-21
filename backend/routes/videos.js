import { Router } from 'express';
import Video from '../models/Video.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper: extract YouTube thumbnail from URL
function getYoutubeThumbnail(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
}

// GET /api/videos?subject=id
router.get('/', telegramAuth, requireApproved, async (req, res) => {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  const videos = await Video.find(filter).sort('-createdAt').populate('subject', 'name');
  res.json(videos);
});

// GET /api/videos/:id
router.get('/:id', telegramAuth, requireApproved, async (req, res) => {
  const video = await Video.findById(req.params.id).populate('subject', 'name icon');
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(video);
});

// POST /api/videos (admin only)
router.post('/', telegramAuth, requireAdmin, async (req, res) => {
  const { subject, title, description, url, duration } = req.body;
  const thumbnail = getYoutubeThumbnail(url);
  const video = await Video.create({
    subject, title, description, url, duration, thumbnail,
    addedBy: req.dbUser.telegramId,
  });
  res.status(201).json(video);
});

// PUT /api/videos/:id (admin only)
router.put('/:id', telegramAuth, requireAdmin, async (req, res) => {
  if (req.body.url) req.body.thumbnail = getYoutubeThumbnail(req.body.url);
  const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(video);
});

// DELETE /api/videos/:id (admin only)
router.delete('/:id', telegramAuth, requireAdmin, async (req, res) => {
  await Video.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
