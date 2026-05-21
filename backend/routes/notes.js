import { Router } from 'express';
import Note from '../models/Note.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// GET /api/notes?subject=id — get notes for a subject
router.get('/', telegramAuth, requireApproved, async (req, res) => {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  const notes = await Note.find(filter).sort('-pinned -createdAt').populate('subject', 'name');
  res.json(notes);
});

// GET /api/notes/:id — single note
router.get('/:id', telegramAuth, requireApproved, async (req, res) => {
  const note = await Note.findById(req.params.id).populate('subject', 'name icon');
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// POST /api/notes — create note with optional file (admin only)
router.post('/', telegramAuth, requireAdmin, upload.single('file'), async (req, res) => {
  const { subject, title, content, pinned } = req.body;
  const note = await Note.create({
    subject,
    title,
    content,
    pinned: pinned === 'true',
    fileUrl:  req.file?.path || '',
    fileType: req.file ? (req.file.mimetype === 'application/pdf' ? 'pdf' : 'image') : '',
    addedBy:  req.dbUser.telegramId,
  });
  res.status(201).json(note);
});

// PUT /api/notes/:id — update note (admin only)
router.put('/:id', telegramAuth, requireAdmin, upload.single('file'), async (req, res) => {
  const update = { ...req.body };
  if (req.file) {
    update.fileUrl  = req.file.path;
    update.fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
  }
  const note = await Note.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// DELETE /api/notes/:id (admin only)
router.delete('/:id', telegramAuth, requireAdmin, async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
