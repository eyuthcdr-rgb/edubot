# 📚 EduBot — Complete Setup Guide (All 14 Steps)

---

## PHASE 1 — ACCOUNTS & TOOLS

---

### ✅ STEP 1 — Create Your Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send: `/newbot`
3. Choose a name for your bot, e.g. `My Edu Platform`
4. Choose a username ending in `bot`, e.g. `myeduplatform_bot`
5. BotFather gives you a **bot token** like:
   `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
6. **Copy and save this token** — you'll need it in `.env`

---

### ✅ STEP 2 — Create the Student Telegram Group

1. Open Telegram → tap the pencil icon → **New Group**
2. Give it a name like `My Edu Platform - Students`
3. Add your bot to the group
4. Go to group settings → **Administrators** → add your bot → give it these permissions:
   - ✅ Add members
   - ✅ Invite users via link
5. Send any message in the group, then visit:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
6. Look for `"chat":{"id":` — the group ID starts with `-100...`
7. **Save this group ID** (negative number)

Also get **your own Telegram ID**:
- Search for **@userinfobot** on Telegram → send `/start` → it shows your ID

---

### ✅ STEP 3 — Sign Up for MongoDB Atlas (Free Database)

1. Go to **https://mongodb.com/atlas**
2. Sign up for free
3. Create a **free M0 cluster** (choose any region)
4. Under **Database Access** → Add a database user (username + password)
5. Under **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`)
6. Click **Connect** on your cluster → **Drivers** → copy the connection string:
   `mongodb+srv://username:password@cluster.mongodb.net/edubot`
7. Replace `<password>` with your actual password

---

### ✅ STEP 4 — Sign Up for Cloudinary (Free File Storage)

1. Go to **https://cloudinary.com** → Sign up free
2. From the dashboard, copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Save these — they go in your `.env` file

---

### ✅ STEP 5 — Install Node.js and VS Code

1. Download **Node.js LTS** from https://nodejs.org (click the LTS button)
2. Install it (click Next through the installer)
3. Download **VS Code** from https://code.visualstudio.com
4. Verify Node.js installed — open your terminal and run:
   ```
   node --version
   npm --version
   ```
   You should see version numbers.

---

## PHASE 2 — SET UP THE PROJECT

---

### ✅ STEP 6 — Set Up the Bot Backend

1. Open VS Code → open the `edubot` folder (File → Open Folder)
2. Open the terminal inside VS Code (Terminal → New Terminal)
3. Navigate into the backend folder:
   ```bash
   cd backend
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Copy the env template:
   ```bash
   cp .env.example .env
   ```
6. Open `.env` and fill in ALL your values:
   ```
   BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ADMIN_CHAT_ID=123456789          ← your personal Telegram ID
   GROUP_CHAT_ID=-1001234567890     ← your group ID (negative number)
   MONGODB_URI=mongodb+srv://...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   BACKEND_URL=http://localhost:3000  ← change after deploying to Render
   FRONTEND_URL=http://localhost:5173  ← change after deploying to Vercel
   JWT_SECRET=make_this_a_long_random_string_here_at_least_32_chars
   ```
7. **Test locally** (optional):
   ```bash
   npm run dev
   ```
   You should see:
   ```
   ✅ MongoDB connected
   🚀 Dev server on http://localhost:3000
   🤖 Bot polling started
   ```

---

### ✅ STEP 7 — Understand the Backend API

The backend (`index.js`) does two things:

**A) Telegram Bot** — handles these commands:
| Command | Who | What it does |
|---------|-----|--------------|
| `/start` | Student | Registers them, notifies admin |
| `/approve <id>` | Admin only | Approves student, sends them group invite |
| `/block <id>` | Admin only | Blocks a student |
| `/students` | Admin only | Lists last 20 registered students |

**B) REST API** — these endpoints:
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/subjects` | Students | List all subjects |
| POST | `/api/subjects` | Admin | Create a subject |
| DELETE | `/api/subjects/:id` | Admin | Delete a subject |
| GET | `/api/notes?subject=ID` | Students | Get notes for a subject |
| POST | `/api/notes` | Admin | Create note (supports file upload) |
| DELETE | `/api/notes/:id` | Admin | Delete a note |
| GET | `/api/videos?subject=ID` | Students | Get videos for a subject |
| POST | `/api/videos` | Admin | Add a video |
| DELETE | `/api/videos/:id` | Admin | Delete a video |
| GET | `/api/quizzes?subject=ID` | Students | List quizzes |
| GET | `/api/quizzes/:id` | Students | Get quiz questions |
| POST | `/api/quizzes/:id/submit` | Students | Submit answers, get score |
| POST | `/api/quizzes` | Admin | Create quiz |
| GET | `/api/users` | Admin | List all users |
| PATCH | `/api/users/:id/approve` | Admin | Approve user |
| PATCH | `/api/users/:id/block` | Admin | Block user |
| GET | `/api/users/me` | All | Get own profile |

---

### ✅ STEP 8 — Deploy Backend to Render (Free Hosting)

1. **Push your project to GitHub:**
   ```bash
   cd ..   # go back to the root edubot folder
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Go to **https://github.com/new** → create a repo called `edubot`
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/edubot.git
   git branch -M main
   git push -u origin main
   ```

2. Go to **https://render.com** → Sign up → **New Web Service**
3. Connect your GitHub account → select the `edubot` repo
4. Fill in these settings:
   - **Name**: `edubot-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free
5. Add **all your environment variables** from `.env` (copy each one)
   - Add `NODE_ENV` = `production`
6. Click **Create Web Service**
7. Wait for deployment (~3-5 minutes)
8. Copy your live URL: `https://edubot-backend.onrender.com`

9. **Update your `.env`** (for reference):
   ```
   BACKEND_URL=https://edubot-backend.onrender.com
   ```

---

## PHASE 3 — BUILD THE FRONTEND

---

### ✅ STEP 9 — Set Up the Frontend

1. In VS Code terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```
2. Copy the env template:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env`:
   ```
   VITE_API_URL=https://edubot-backend.onrender.com
   ```
4. Test locally:
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

   > Note: Full auth (Telegram.WebApp.initData) only works inside Telegram.
   > For local testing, you can temporarily bypass auth in `middleware/auth.js`
   > by returning a mock user (comment out the hash check).

---

### ✅ STEP 10 — Deploy Frontend to Vercel (Free)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your `edubot` repo
3. Set these settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://edubot-backend.onrender.com`
5. Click **Deploy**
6. Copy your live URL: `https://edubot-frontend.vercel.app`

7. **Go back to Render** → your backend service → **Environment** → update:
   - `FRONTEND_URL` = `https://edubot-frontend.vercel.app`
   → Click **Save Changes** (Render auto-redeploys)

---

## PHASE 4 — CONNECT & GO LIVE

---

### ✅ STEP 11 — Set the Mini App URL on BotFather

This makes the "Open App" button appear in your bot.

1. Open Telegram → search **@BotFather**
2. Send: `/mybots`
3. Select your bot
4. Tap **Bot Settings** → **Menu Button**
5. Tap **Configure menu button**
6. Send your Vercel URL: `https://edubot-frontend.vercel.app`

Now when students open your bot, they'll see an **Open** button that launches the Mini App.

---

### ✅ STEP 12 — Register the Bot Webhook

Tell Telegram where to send messages (your Render server).

Open your browser and visit this URL (replace the values):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://edubot-backend.onrender.com/bot<YOUR_BOT_TOKEN>
```

You should get back:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

> The backend also sets this automatically when it starts in production mode.
> This is a manual backup just in case.

To check webhook status at any time:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

### ✅ STEP 13 — Add Your First Content (Admin)

Your admin account is automatically set up using the `ADMIN_CHAT_ID` you set.

**Add a subject using the Admin Panel in the app:**
1. Open your bot → tap Open → the Mini App loads
2. You'll see the ⚙️ Admin tab in the bottom navigation
3. Go to **Subjects** → fill in name, icon emoji, color → tap **Add Subject**

Or add via API (using a tool like Postman or curl):
```bash
curl -X POST https://edubot-backend.onrender.com/api/subjects \
  -H "Content-Type: application/json" \
  -H "x-telegram-init-data: <your_init_data>" \
  -d '{"name":"Mathematics","description":"Algebra and calculus","icon":"➗","color":"#4C6FFF"}'
```

**Add a note:**
- Go to Admin → open any subject → Notes → tap **+ Add** → fill in title and content

**Add a video:**
- Paste any YouTube URL → it auto-fetches the thumbnail

**Create a quiz:**
- Add questions with 4 options each → select the correct answer radio button → Save

---

### ✅ STEP 14 — Invite Your First Students

1. **Share your bot link** with students:
   `https://t.me/myeduplatform_bot`

2. Student opens the bot → sends `/start`

3. **You (admin) receive a message** in Telegram like:
   ```
   📬 New student registered!
   👤 Name: John Doe
   🆔 Telegram ID: 987654321
   Use /approve 987654321 to approve them.
   ```

4. **Reply to approve them**:
   ```
   /approve 987654321
   ```

5. The student receives:
   - ✅ Approval message
   - 🔗 A one-time invite link to the group
   - 📚 Open Learning Platform button

6. Student taps **Open Learning Platform** → Mini App opens → they can browse subjects, read notes, watch videos, and take quizzes!

---

## 🗂 Project File Structure

```
edubot/
├── backend/
│   ├── index.js              ← Main server + bot
│   ├── package.json
│   ├── .env.example
│   ├── models/
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── Note.js
│   │   ├── Video.js
│   │   └── Quiz.js
│   ├── routes/
│   │   ├── subjects.js
│   │   ├── notes.js
│   │   ├── videos.js
│   │   ├── quizzes.js
│   │   └── users.js
│   └── middleware/
│       ├── auth.js           ← Telegram WebApp auth
│       └── upload.js         ← Cloudinary file uploads
├── frontend/
│   ├── index.html            ← Loads Telegram SDK
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           ← Router + auth gate
│       ├── api.js            ← All API calls
│       ├── index.css
│       ├── hooks/
│       │   └── useTelegram.js
│       ├── components/
│       │   └── BottomNav.jsx
│       └── pages/
│           ├── Home.jsx      ← Subject list
│           ├── SubjectPage.jsx
│           ├── NotesPage.jsx
│           ├── VideosPage.jsx
│           ├── QuizPage.jsx
│           └── AdminPage.jsx ← Student + subject management
├── render.yaml               ← Render deployment config
├── vercel.json               ← Vercel deployment config
└── .gitignore
```

---

## 🛟 Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot not responding | Check webhook: `getWebhookInfo`. Re-run Render deployment. |
| "Missing Telegram initData" error | You're testing outside Telegram. Test inside Telegram only. |
| MongoDB connection error | Check your Atlas IP whitelist allows `0.0.0.0/0` |
| Render free tier sleeps | First request after idle takes ~30s to wake up. Upgrade to paid to avoid. |
| Can't create group invite link | Make sure your bot is admin with "Invite users via link" permission |
| File upload fails | Check Cloudinary credentials are correct in Render env vars |

---

## 🚀 What to Build Next

- 📊 Student progress tracking (store quiz scores per user)
- 🔔 Push notifications when new content is added
- 💬 Comments on notes (stored in DB)
- 🎓 Certificates on quiz completion
- 📅 Schedule/timetable page
- 🌙 Dark mode (auto-follows Telegram theme via `window.Telegram.WebApp.colorScheme`)
