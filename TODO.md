# TODO - Déploiement DUNIS E-Learning (Railway + Vercel)

## ✅ Étape 1: Corrections Problèmes Communs (ESLint, CORS, API 404)
- [ ] Vérifier `CI=false` dans frontend/package.json (déjà OK)
- [ ] Préparer .env templates pour CLIENT_URL et REACT_APP_API_URL

## ✅ Étape 2: Préparation Locale + Test
- [ ] Créer backend/.env avec MONGODB_URI, JWT_SECRET
- [ ] `cd backend && npm install && npm run seed`
- [ ] `cd frontend && npm install && npm start`
- [ ] Tester http://localhost:3000 (login admin@dunis.africa / Admin@2024)

## ⏳ Étape 3: Déploiement Backend (Railway)
- [ ] Créer compte railway.app
- [ ] Deploy backend/ → Set env vars (MONGODB_URI, JWT_SECRET, CLIENT_URL=temp)
- [ ] `railway run npm run seed`
- [ ] Noter BACKEND_URL (e.g. https://dunis-backend.railway.app)

## ⏳ Étape 4: Déploiement Frontend (Vercel)
- [ ] Créer compte vercel.com
- [ ] Deploy frontend/ → Set REACT_APP_API_URL=BACKEND_URL/api
- [ ] Update Railway CLIENT_URL=VERCEL_URL

## ⏳ Étape 5: Vérification Finale
- [ ] Test login, créer course, chatbot
- [ ] Health check: BACKEND_URL/api/health

**Prochaine étape après confirmation: Commencer par corrections locales.**

**Status: Plan approuvé - Problèmes courants à corriger en premier**
