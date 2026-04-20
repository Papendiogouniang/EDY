# ⚡ Quick Deployment Guide

## 🖥️ Local Development (5 minutes)

```bash
# 1. Clone
git clone https://github.com/your-org/dunis-elearning.git && cd dunis-elearning

# 2. Configure
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY

# 3. Backend
cd backend && npm install && npm run dev &

# 4. Frontend
cd ../frontend && npm install && npm start

# 5. Seed demo data (new terminal)
cd backend && npm run seed
```
→ Open http://localhost:3000

---

## 🐳 Docker (10 minutes)

```bash
cp .env.example .env && nano .env

# Production
docker compose up --build -d
docker compose exec backend node utils/seed.js

# Development (hot reload)
docker compose -f docker-compose.dev.yml up --build
```
→ Open http://localhost

---

## ☁️ AWS EC2 (30 minutes)

```bash
# On your EC2 instance (Ubuntu 22.04, t3.medium+)
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER && newgrp docker

git clone https://github.com/your-org/dunis-elearning.git && cd dunis-elearning
cp .env.example .env && nano .env
# Set CLIENT_URL=https://elearning.yourdomain.com

docker compose up --build -d
docker compose exec backend node utils/seed.js

# SSL with Let's Encrypt
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d elearning.yourdomain.com
```

---

## ☁️ AWS ECS Fargate (CI/CD)

```bash
export AWS_REGION=eu-west-1
export ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repos
aws ecr create-repository --repository-name dunis-backend
aws ecr create-repository --repository-name dunis-frontend

# Store secrets
aws secretsmanager create-secret --name "dunis/mongodb-uri"       --secret-string "YOUR_MONGODB_URI"
aws secretsmanager create-secret --name "dunis/jwt-secret"        --secret-string "YOUR_JWT_SECRET"
aws secretsmanager create-secret --name "dunis/anthropic-api-key" --secret-string "YOUR_ANTHROPIC_KEY"

# Push images
aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t $ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/dunis-backend:latest ./backend && docker push $_
docker build -t $ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/dunis-frontend:latest ./frontend && docker push $_

# Deploy (after ECS cluster + task definitions created — see README.md)
aws ecs update-service --cluster dunis-elearning --service dunis-backend  --force-new-deployment
aws ecs update-service --cluster dunis-elearning --service dunis-frontend --force-new-deployment
```

→ After first deployment, push to `main` branch → GitHub Actions auto-deploys.

---

## 🔑 Demo Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dunis.africa` | `Admin@2024` |
| Teacher | `fatou.diallo@dunis.africa` | `Teacher@2024` |
| Student | `aminata.sarr@dunis.africa` | `Student@2024` |

---

## 🚨 Troubleshooting

**MongoDB connection failed**
```bash
# Check URI format
# Must be: mongodb+srv://user:pass@cluster.mongodb.net/dbname
# Whitelist your IP in Atlas Network Access
```

**Email login rejected**
```bash
# Only @dunis.africa emails work
# Change ALLOWED_EMAIL_DOMAIN in .env to use a different domain
```

**Chatbot not responding**
```bash
# Check ANTHROPIC_API_KEY in .env
# Verify key at console.anthropic.com
```

**Docker port conflict**
```bash
docker compose down
sudo lsof -i :80 -i :5000  # find conflicting process
```

**Frontend can't reach API**
```bash
# Dev: set proxy in frontend/package.json → "proxy": "http://localhost:5000"
# Prod: set REACT_APP_API_URL=https://yourdomain.com/api
```
