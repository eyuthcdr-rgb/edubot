import crypto from 'crypto';
import User from '../models/User.js';

// Validates the Telegram WebApp initData hash so we know the request is genuinely from Telegram
export async function telegramAuth(req, res, next) {
  try {
    const initData = req.headers['x-telegram-init-data'];
    if (!initData) return res.status(401).json({ error: 'Missing Telegram initData' });

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Sort keys alphabetically then build data-check-string
    const checkString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    if (expectedHash !== hash) return res.status(401).json({ error: 'Invalid Telegram data' });

    // Attach user info to request
    const userData = JSON.parse(params.get('user') || '{}');
    req.telegramUser = userData;

    // Find or create user in DB
    let user = await User.findOne({ telegramId: userData.id });
    if (!user) {
      user = await User.create({
        telegramId: userData.id,
        username:  userData.username || '',
        firstName: userData.first_name || '',
        lastName:  userData.last_name || '',
      });
    }
    req.dbUser = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Auth error', detail: err.message });
  }
}

// Require approved student or admin
export function requireApproved(req, res, next) {
  if (!req.dbUser || req.dbUser.status !== 'approved') {
    return res.status(403).json({ error: 'Your account is not approved yet.' });
  }
  next();
}

// Require admin role
export function requireAdmin(req, res, next) {
  if (!req.dbUser || req.dbUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
