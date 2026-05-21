import 'express-async-errors';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Bot, webhookCallback, InlineKeyboard } from 'grammy';

import User from './models/User.js';
import subjectRoutes from './routes/subjects.js';
import noteRoutes    from './routes/notes.js';
import videoRoutes   from './routes/videos.js';
import quizRoutes    from './routes/quizzes.js';
import userRoutes    from './routes/users.js';

// ── Express setup ─────────────────────────────────────────────────────────────
const app  = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/subjects', subjectRoutes);
app.use('/api/notes',    noteRoutes);
app.use('/api/videos',   videoRoutes);
app.use('/api/quizzes',  quizRoutes);
app.use('/api/users',    userRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Telegram Bot ──────────────────────────────────────────────────────────────
const bot = new Bot(process.env.BOT_TOKEN);

// /start — register student
bot.command('start', async (ctx) => {
  const tgUser = ctx.from;
  let user = await User.findOne({ telegramId: tgUser.id });

  if (!user) {
    user = await User.create({
      telegramId: tgUser.id,
      username:   tgUser.username || '',
      firstName:  tgUser.first_name || '',
      lastName:   tgUser.last_name  || '',
    });

    // Notify admin about new student
    await bot.api.sendMessage(
      process.env.ADMIN_CHAT_ID,
      `📬 *New student registered!*\n\n` +
      `👤 Name: ${tgUser.first_name} ${tgUser.last_name || ''}\n` +
      `🔖 Username: @${tgUser.username || 'none'}\n` +
      `🆔 Telegram ID: ${tgUser.id}\n\n` +
      `Use /approve ${tgUser.id} to approve them.`,
      { parse_mode: 'Markdown' }
    );
  }

  if (user.status === 'blocked') {
    return ctx.reply('❌ Your access has been blocked. Contact the admin.');
  }

  if (user.status === 'pending') {
    return ctx.reply(
      `👋 Welcome, *${tgUser.first_name}*!\n\n` +
      `Your registration is pending admin approval. You'll be notified once approved. ⏳`,
      { parse_mode: 'Markdown' }
    );
  }

  // Approved — show Mini App button
  const keyboard = new InlineKeyboard()
    .webApp('📚 Open Learning Platform', process.env.FRONTEND_URL);

  await ctx.reply(
    `Welcome back, *${tgUser.first_name}*! 🎓\n\nTap below to open the learning platform.`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  );
});

// /approve <telegramId> — admin approves a student
bot.command('approve', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_CHAT_ID)) {
    return ctx.reply('❌ Only the admin can use this command.');
  }

  const parts   = ctx.message.text.split(' ');
  const targetId = Number(parts[1]);
  if (!targetId) return ctx.reply('Usage: /approve <telegramId>');

  const user = await User.findOneAndUpdate(
    { telegramId: targetId },
    { status: 'approved' },
    { new: true }
  );
  if (!user) return ctx.reply('❌ User not found.');

  // Generate group invite link
  let inviteText = '';
  try {
    const link = await bot.api.createChatInviteLink(process.env.GROUP_CHAT_ID, {
      member_limit: 1,
      name: `${user.firstName} invite`,
    });
    inviteText = `\n\n🔗 Join the student group: ${link.invite_link}`;
  } catch (e) {
    console.error('Could not create invite link:', e.message);
  }

  // Notify the student
  const keyboard = new InlineKeyboard()
    .webApp('📚 Open Learning Platform', process.env.FRONTEND_URL);

  await bot.api.sendMessage(
    targetId,
    `✅ *You've been approved!* Welcome to the platform, ${user.firstName}! 🎉${inviteText}\n\nTap the button below to start learning.`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  );

  ctx.reply(`✅ Approved @${user.username || user.firstName} and sent them the invite.`);
});

// /block <telegramId> — admin blocks a student
bot.command('block', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_CHAT_ID)) {
    return ctx.reply('❌ Only the admin can use this command.');
  }
  const parts    = ctx.message.text.split(' ');
  const targetId = Number(parts[1]);
  if (!targetId) return ctx.reply('Usage: /block <telegramId>');

  const user = await User.findOneAndUpdate(
    { telegramId: targetId },
    { status: 'blocked' },
    { new: true }
  );
  if (!user) return ctx.reply('❌ User not found.');

  ctx.reply(`🚫 Blocked ${user.firstName} (${targetId}).`);
});

// /students — list all students (admin only)
bot.command('students', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_CHAT_ID)) {
    return ctx.reply('❌ Only the admin can use this command.');
  }
  const users = await User.find().sort('-createdAt').limit(20);
  if (!users.length) return ctx.reply('No students yet.');

  const list = users.map(u =>
    `• ${u.firstName} @${u.username || 'none'} — ${u.status} [${u.telegramId}]`
  ).join('\n');

  ctx.reply(`*Students (latest 20):*\n${list}`, { parse_mode: 'Markdown' });
});

// ── Connect DB and start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    // Set first admin (your own Telegram ID)
    await User.findOneAndUpdate(
      { telegramId: Number(process.env.ADMIN_CHAT_ID) },
      { role: 'admin', status: 'approved' },
      { upsert: true }
    );

    if (process.env.NODE_ENV === 'production') {
      // Webhook mode for production (Render)
      const webhookPath = `/bot${process.env.BOT_TOKEN}`;
      app.use(webhookPath, webhookCallback(bot, 'express'));
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        // Register webhook with Telegram
        bot.api.setWebhook(`${process.env.BACKEND_URL}${webhookPath}`)
          .then(() => console.log('✅ Webhook set'))
          .catch(console.error);
      });
    } else {
      // Long polling for local development
      app.listen(PORT, () => console.log(`🚀 Dev server on http://localhost:${PORT}`));
      bot.start();
      console.log('🤖 Bot polling started');
    }
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });
