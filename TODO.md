# DUNIS API Route Prefix Fix

## Current Status
- [x] Analyzed api.js - identified double prefix on auth, missing on others
- [x] Confirmed backend routes /api/*
- [x] Searched for direct API calls - all use api.js utility

## Plan Steps ✅ COMPLETED
- [x] Edit frontend/src/utils/api.js - ALL 50+ endpoints fixed ✓
  - [x] Auth: '/auth/*' (→ /api/auth/* via baseURL)
  - [x] Courses/Users/Dashboard/Media/Site/Chatbot: all '/api/*' ✓
- [x] Verified no direct axios calls (all use api.js)

## Next Steps
- [ ] Test locally: cd frontend && npm run dev, test login
- [ ] Deploy: git add . && git commit -m "fix(api): consistent /api prefixes for all endpoints" && git push
- [ ] Production test: Login should hit /api/auth/login (no 404)

## Next Steps
- [ ] Test locally: npm run dev (frontend), login should work
- [ ] Deploy: git add . && git commit -m "fix: api endpoint prefixes" && git push → Vercel redeploy
- [ ] Verify production: https://edy-*.vercel.app login → no 404
