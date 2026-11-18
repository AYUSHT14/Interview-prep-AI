# 🧠 PrepAI — AI-Powered Interview Preparation Platform

Full-stack web app that simulates real job interviews using AI — with instant feedback and scoring.

## ✨ Features

- **Mock Interviews** — AI generates role-specific questions and evaluates your answers
- **MCQ Quizzes** — Multiple-choice practice with instant grading
- **Resume Review** — AI analyzes your resume and gives improvement suggestions
- **AI Coach Chat** — Chat with an AI interview coach
- **Interview History** — Track past sessions with scores and feedback
- **Secure Auth** — JWT-based authentication with bcrypt password hashing

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router v7, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + JSON file fallback |
| AI | xAI Grok API |
| Auth | JWT + bcrypt |
| Deployment | Railway (Backend) + Vercel (Frontend) |

## 📁 Project Structure

```
interview-prep-app/
├── backend/
│   ├── config/db.js           # MongoDB connection + fallback
│   ├── middleware/auth.js     # JWT auth middleware
│   ├── models/                # User & Interview schemas
│   ├── routes/                # API endpoints
│   ├── services/              # AI service wrappers (Grok)
│   └── server.js              # Entry point
├── frontend/
│   └── src/
│       ├── pages/             # All screens (Login, Dashboard, InterviewRoom, etc.)
│       ├── services/api.js    # Axios client with JWT interceptor
│       └── App.jsx            # Routing & layout
└── package.json               # Root scripts
```

## 🚀 Setup

```bash
npm run install:all
cp backend/.env.example backend/.env
# Fill in your keys in backend/.env
npm run dev
```

## 🌐 Deployment

Deploy the app as one Render web service. Express serves the built React app and API from the same origin, so the browser does not need a separate API URL.

1. Push this repository to GitHub and create a Render Blueprint using `render.yaml`.
2. Set `MONGODB_URI` to a persistent MongoDB Atlas connection string and `GROK_API_KEY` to a Groq or xAI key in the Render dashboard. Render generates `JWT_SECRET` from the Blueprint.
3. Deploy the service and share its Render URL.

The JSON database fallback is for local development only. Render's local filesystem is ephemeral, so production signups and interview history require a working MongoDB connection.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login & get token |
| GET | `/api/auth/me` | Get user profile |
| POST | `/api/interviews` | Start mock interview |
| POST | `/api/interviews/:id/answer` | Submit answer |
| GET | `/api/interviews/history` | Interview history |
| POST | `/api/interviews/resume` | AI resume review |
| POST | `/api/interviews/coach-chat` | AI coach chat |
| POST | `/api/interviews/mcq` | Start MCQ quiz |
