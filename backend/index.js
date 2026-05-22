import 'express-async-errors';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Bot, webhookCallback, InlineKeyboard } from 'grammy';

import User       from './models/User.js';
import subjectRoutes  from './routes/subjects.js';
import noteRoutes     from './routes/notes.js';
import videoRoutes    from './routes/videos.js';
import quizRoutes     from './routes/quizzes.js';
import userRoutes     from './routes/users.js';
import homeworkRoutes from './routes/homework.js';
import questionRoutes from './routes/questions.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/subjects',  subjectRoutes);
app.use('/api/notes',     noteRoutes);
app.use('/api/videos',    videoRoutes);
app.use('/api/quizzes',   quizRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/homework',  homeworkRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const bot = new Bot(process.env.BOT_TOKEN);
const regState = new Map();

async function sendAppButton(ctx, user) {
  const keyboard = new InlineKeyboard()
    .webApp('📚 Open Learning Platform', process.env.FRONTEND_URL);
  await ctx.reply(
    `Welcome back, *${user.fullName || user.firstName}*! 🎓\n\nTap below to open the learning platform.`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  );
}

async function notifyAdmin(text) {
  try {
    await bot.api.sendMessage(process.env.ADMIN_CHAT_ID, text, { parse_mode: 'Markdown' });
  } catch (e) { console.error('Admin notify:', e.message); }
}

bot.command('start', async (ctx) => {
  const tgUser = ctx.from;
  let user = await User.findOne({ telegramId: tgUser.id });

  if (user?.status === 'blocked') return ctx.reply('❌ Your access has been blocked. Contact the admin.');
  if (user && user.regStep === 'done' && user.status === 'approved') return sendAppButton(ctx, user);
  if (user && user.regStep === 'done' && user.status === 'pending') {
    return ctx.reply(`👋 Hi *${user.fullName || user.firstName}*!\n\nYour registration is pending admin approval. ⏳`, { parse_mode: 'Markdown' });
  }

  if (!user) {
    user = await User.create({
      telegramId: tgUser.id,
      username:   tgUser.username  || '',
      firstName:  tgUser.first_name || '',
      lastName:   tgUser.last_name  || '',
      regStep:    'awaiting_name',
    });
  }

  regState.set(tgUser.id, user.regStep || 'awaiting_name');
  await ctx.reply(`👋 Welcome! Let's set up your student profile.\n\n*Step 1 of 3*\nPlease enter your *Full Name*:`, { parse_mode: 'Markdown' });
});

bot.command('profile', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from.id });
  if (!user || user.status !== 'approved') return ctx.reply('❌ You need an approved account.');

  const keyboard = new InlineKeyboard().webApp('📊 View Full Profile', `${process.env.FRONTEND_URL}/profile`);
  const text = `👤 *Your Profile*\n\n📛 Name: ${user.fullName || user.firstName}\n🎓 Level: ${user.academicLevel || 'Not set'}\n📅 Joined: ${user.createdAt.toDateString()}`;

  if (user.profilePicUrl) {
    await ctx.replyWithPhoto(user.profilePicUrl, { caption: text, parse_mode: 'Markdown', reply_markup: keyboard });
  } else {
    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }
});

bot.command('feedback', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from.id });
  if (!user || user.status !== 'approved') return ctx.reply('❌ You need an approved account.');
  regState.set(ctx.from.id, 'awaiting_feedback');
  await ctx.reply(`💬 *Send your feedback*\n\nType your message or send a photo/screenshot.`, { parse_mode: 'Markdown' });
});

bot.command('dashboard', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from.id });
  if (!user || user.status !== 'approved') return ctx.reply('❌ You need an approved account.');
  const keyboard = new InlineKeyboard().webApp('📊 Open Dashboard', `${process.env.FRONTEND_URL}/dashboard`);
  await ctx.reply('📊 *Your Learning Dashboard*\n\nTap below to view your full stats.', { parse_mode: 'Markdown', reply_markup: keyboard });
});

bot.command('approve', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_CHAT_ID)) return ctx.reply('❌ Admin only.');
  const parts = ctx.message.text.split(' ');
  const targetId = Number(parts[1]);
  if (!targetId) return ctx.reply('Usage: /approve <telegramId>');

  const user = await User.findOneAndUpdate({ telegramId: targetId }, { status: 'approved' }, { new: true });
  if (!user) return ctx.reply('❌ User not found.');

  let inviteText = '';
  try {
    const link = await bot.api.createChatInviteLink(process.env.GROUP_CHAT_ID, { member_limit: 1 });
    inviteText = `\n\n🔗 Join the student group: ${link.invite_link}`;
  } catch (e) { console.error('Invite link:', e.message); }

  const keyboard = new InlineKeyboard().webApp('📚 Open Learning Platform', process.env.FRONTEND_URL);
  await bot.api.sendMessage(targetId,
    `✅ *You've been approved!* Welcome, ${user.fullName || user.firstName}! 🎉${inviteText}\n\nTap below to start learning.`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  );
  ctx.reply(`✅ Approved ${user.fullName || user.firstName}.`);
});

bot.command('block', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_CHAT_ID)) return ctx.reply('❌ Admin only.');
  const targetId = Number(ctx.message.text.split(' ')[1]);
  if (!targetId) return ctx.reply('Usage: /block <telegramId>');
  const user = await User.findOneAndUpdate({ telegramId: targetId }, { status: 'blocked' }, { new: true });
  if (!user) return ctx.reply('❌ User not found.');
  ctx.reply(`🚫 Blocked ${user.fullName || user.firstName}.`);
});

bot.command('unblock', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_CHAT_ID)) return ctx.reply('❌ Admin only.');
  const targetId = Number(ctx.message.text.split(' ')[1]);
  if (!targetId) return ctx.reply('Usage: /unblock <telegramId>');
  const user = await User.findOneAndUpdate({ telegramId: targetId }, { status: 'approved' }, { new: true });
  if (!user) return ctx.reply('❌ User not found.');
  ctx.reply(`✅ Unblocked ${user.fullName || user.firstName}.`);
});

bot.command('students', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_CHAT_ID)) return ctx.reply('❌ Admin only.');
  const users = await User.find({ role: 'student' }).sort('-createdAt').limit(20);
  if (!users.length) return ctx.reply('No students yet.');
  const list = users.map(u => `• ${u.fullName || u.firstName} @${u.username || 'none'} — ${u.status} [${u.telegramId}]`).join('\n');
  ctx.reply(`*Students (latest 20):*\n${list}`, { parse_mode: 'Markdown' });
});

bot.on('message', async (ctx) => {
  const tgUser = ctx.from;
  const text   = ctx.message.text;
  const photo  = ctx.message.photo;
  const state  = regState.get(tgUser.id);

  if (state === 'awaiting_feedback') {
    regState.delete(tgUser.id);
    let fileUrl = '';
    if (photo) {
      const fileId = photo[photo.length - 1].file_id;
      const file   = await bot.api.getFile(fileId);
      fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    }
    await User.findOneAndUpdate(
      { telegramId: tgUser.id },
      { $push: { feedbackHistory: { text: text || '', fileUrl, fileType: photo ? 'image' : '' } } }
    );
    const user = await User.findOne({ telegramId: tgUser.id });
    await notifyAdmin(`💬 *New Feedback*\n\nFrom: ${user?.fullName || tgUser.first_name} (@${tgUser.username || 'none'})\nID: ${tgUser.id}\n\nMessage: ${text || '(photo attached)'}`);
    return ctx.reply('✅ Thank you! Your feedback has been sent.');
  }

  let user = await User.findOne({ telegramId: tgUser.id });
  if (!user) return;

  const step = state || user.regStep;

  if (step === 'awaiting_name') {
    if (!text || text.startsWith('/')) return;
    await User.findOneAndUpdate({ telegramId: tgUser.id }, { fullName: text.trim(), regStep: 'awaiting_level' });
    regState.set(tgUser.id, 'awaiting_level');
    await ctx.reply(`✅ Great, *${text.trim()}*!\n\n*Step 2 of 3*\nWhat is your Academic Level or Grade?\n\nExamples: "Grade 10", "Year 2 University"`, { parse_mode: 'Markdown' });
    return;
  }

  if (step === 'awaiting_level') {
    if (!text || text.startsWith('/')) return;
    await User.findOneAndUpdate({ telegramId: tgUser.id }, { academicLevel: text.trim(), regStep: 'awaiting_photo' });
    regState.set(tgUser.id, 'awaiting_photo');
    await ctx.reply(`✅ Got it!\n\n*Step 3 of 3*\nPlease send your *Profile Picture*.\n\nOr send /skip for a default avatar.`, { parse_mode: 'Markdown' });
    return;
  }

  if (step === 'awaiting_photo') {
    let profilePicUrl = '';
    if (photo) {
      const fileId = photo[photo.length - 1].file_id;
      const file   = await bot.api.getFile(fileId);
      profilePicUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    } else if (!text?.startsWith('/')) {
      return ctx.reply('Please send a photo or type /skip to continue.');
    }

    user = await User.findOneAndUpdate({ telegramId: tgUser.id }, { profilePicUrl, regStep: 'done' }, { new: true });
    regState.set(tgUser.id, 'done');

    await notifyAdmin(`📬 *New Student Registered!*\n\n👤 Name: ${user.fullName}\n🎓 Level: ${user.academicLevel}\n🔖 Username: @${tgUser.username || 'none'}\n🆔 ID: ${tgUser.id}\n\nUse /approve ${tgUser.id} to approve them.`);
    await ctx.reply(`🎉 *Registration complete!*\n\nName: ${user.fullName}\nLevel: ${user.academicLevel}\n\nPending admin approval. You'll be notified once approved! ⏳`, { parse_mode: 'Markdown' });
    return;
  }
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await User.findOneAndUpdate(
      { telegramId: Number(process.env.ADMIN_CHAT_ID) },
      { role: 'admin', status: 'approved', regStep: 'done' },
      { upsert: true }
    );

    if (process.env.NODE_ENV === 'production') {
      const webhookPath = `/bot${process.env.BOT_TOKEN}`;
      app.use(webhookPath, webhookCallback(bot, 'express'));
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        bot.api.setWebhook(`${process.env.BACKEND_URL}${webhookPath}`)
          .then(() => console.log('✅ Webhook set'))
          .catch(console.error);
      });
    } else {
      app.listen(PORT, () => console.log(`🚀 Dev server on http://localhost:${PORT}`));
      bot.start();
      console.log('🤖 Bot polling started');
    }
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });
