# DUNIS Africa — First Time Setup Guide

## Step 1: Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dunis_elearning
JWT_SECRET=any_random_secret_string_here
ANTHROPIC_API_KEY=sk-ant-...   (optional - for AI chatbot)
PORT=5000
```

## Step 2: Create Admin Account (first run only)

```bash
cd backend
npm install
npm run seed
```

This creates these accounts:



## Step 3: Start the Backend

```bash
cd backend
npm run dev   # runs on http://localhost:5000
```

## Step 4: Start the Frontend

```bash
cd frontend
npm install
npm start     # runs on http://localhost:3000
```

## Step 5: Login as Admin

Go to http://localhost:3000


## Step 6: Create User Accounts

As admin, go to **Users → Create Account** to add:
- Teachers (they log in with the email + password you set)
- Students (they log in with the email + password you set)

No public registration — only admin creates accounts.

## Deployment (Vercel + Railway)

### Backend (Railway):
1. Upload `backend/` folder
2. Set environment variables (MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY, CLIENT_URL)
3. Note your backend URL

### Frontend (Vercel):
1. Upload `frontend/` folder  
2. Set `REACT_APP_API_URL=https://your-backend.railway.app/api`
3. Build command: `CI=false npm run build` (already in package.json)
