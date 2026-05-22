import { Router } from 'express';
import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Submission from '../models/Submission.js';
import Homework from '../models/Homework.js';
import Subject from '../models/Subject.js';
import { telegramAuth, requireApproved, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics/me — student dashboard
router.get('/me', telegramAuth, requireApproved, async (req, res) => {
  const tid = req.dbUser.telegramId;

  const [attempts, submissions, pendingHW] = await Promise.all([
    QuizAttempt.find({ student: tid, status: 'submitted' }).populate('quiz', 'title subject'),
    Submission.find({ student: tid }),
    Homework.find(),
  ]);

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score / (a.total || 1)) * 100, 0) / attempts.length)
    : 0;

  const submittedHWIds = submissions.map(s => String(s.homework));
  const pending = pendingHW.filter(h => !submittedHWIds.includes(String(h._id)));

  res.json({
    quizzesTaken:    attempts.length,
    averageScore:    avgScore,
    pendingHomework: pending.length,
    gradedWork:      submissions.filter(s => s.status === 'graded').length,
    recentAttempts:  attempts.slice(-5).reverse(),
  });
});

// GET /api/analytics/admin — admin global dashboard
router.get('/admin', telegramAuth, requireAdmin, async (req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    activeToday,
    pendingApproval,
    allAttempts,
    pendingSubmissions,
    subjects,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', lastSeen: { $gte: oneDayAgo } }),
    User.countDocuments({ status: 'pending' }),
    QuizAttempt.find({ status: 'submitted' }),
    Submission.countDocuments({ status: 'submitted' }),
    Subject.find().select('name'),
  ]);

  const avgScore = allAttempts.length
    ? Math.round(allAttempts.reduce((s, a) => s + (a.score / (a.total || 1)) * 100, 0) / allAttempts.length)
    : 0;

  res.json({
    totalStudents,
    activeToday,
    pendingApproval,
    averageQuizScore: avgScore,
    totalQuizzesTaken: allAttempts.length,
    pendingSubmissions,
    totalSubjects: subjects.length,
  });
});

export default router;
