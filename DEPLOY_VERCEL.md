# DUNIS Africa — Vercel Deployment Guide

## Step 1: Deploy Backend (Railway / Render)

1. Upload the `backend/` folder to Railway or Render
2. Set environment variables:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secret_key
   ANTHROPIC_API_KEY=sk-ant-...
   CLIENT_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
3. Note your backend URL (e.g. https://dunis-api.railway.app)

## Step 2: Deploy Frontend to Vercel

1. Import the `frontend/` folder on Vercel
2. **Build settings** (auto-detected for Create React App):
   - Build Command: `CI=false npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
3. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-url/api
   ```
4. Click Deploy

## Common Issues

- **Build fails with ESLint errors** → Already fixed with `CI=false` in build script
- **API 404 errors** → Check REACT_APP_API_URL is set correctly
- **Login redirects** → vercel.json rewrites handle SPA routing
- **CORS errors** → Set CLIENT_URL in backend env to your Vercel URL
