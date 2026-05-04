# 🎓 DUNIS Africa E-Learning Platform

**Official e-learning platform of DUNIS Africa (Dakar University of International Studies)**

> Beyond Boundaries, Go Further — [dunis.africa](https://dunis.africa)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Quick Start (Local)](#quick-start-local)
6. [Docker Deployment](#docker-deployment)
7. [AWS Deployment](#aws-deployment)
8. [Environment Variables](#environment-variables)
9. [API Reference](#api-reference)
10. [Demo Accounts](#demo-accounts)
11. [Roles & Permissions](#roles--permissions)

---

## Overview

DUNIS Africa E-Learning is a full-stack platform serving students, teachers, and administrators across 4 African campuses. Key constraints:

- **Email domain**: Only `@dunis.africa` accounts can register/login
- **Language**: All courses are taught in **English**
- **Roles**: `student` | `teacher` | `admin` — each with a dedicated dashboard
- **AI**: Claude-powered chatbot for academic assistance

---

## Features

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| Video lessons (YouTube/Vimeo) | ✅ | ✅ (create) | ✅ |
| Reading materials (Markdown) | ✅ | ✅ (create) | ✅ |
| Assignment submission & grading | ✅ (submit) | ✅ (grade) | ✅ |
| Quizzes with auto-grading | ✅ | ✅ (create) | ✅ |
| Live class scheduling (Meet/Zoom) | ✅ (join) | ✅ (schedule) | ✅ |
| Progress tracking & completion % | ✅ | ✅ (view class) | ✅ |
| Level system (Beginner→Expert) | ✅ | — | ✅ |
| Certificates (auto-issued) | ✅ | — | ✅ |

| Notifications (real-time) | ✅ | ✅ | ✅ |
| User management | — | — | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Styling | Custom CSS with CSS variables (no framework) |
| Backend | Node.js 18, Express 4 |
| Database | MongoDB Atlas |
| AI / Chatbot | Anthropic Claude (claude-sonnet) |
| Authentication | JWT (JSON Web Tokens) |
| Video | React Player (YouTube / Vimeo / direct) |
| Container | Docker + Docker Compose |
| Web server | Nginx (production frontend) |
| Cloud | AWS EC2 + ECR + ALB (recommended) |

---

## Project Structure

```
dunis-elearning/
├── backend/
│   ├── models/
│   │   ├── User.js            # @dunis.africa enforced, roles, level system
│   │   ├── Course.js          # Courses + embedded Lessons + Meets
│   │   └── index.js           # Quiz, Assignment, Certificate, Enrollment, Progress, Notification
│   ├── routes/
│   │   ├── auth.js            # Register/Login with @dunis.africa validation
│   │   ├── courses.js         # CRUD, class roster, meets scheduling, enrollment
│   │   ├── learning.js        # Progress, assignments, quizzes, certificates, notifications
│   │   ├── dashboard.js       # Student / Teacher / Admin dashboards
│   │   ├── users.js           # Admin user management
│   │   └── chatbot.js         # 
│   ├── middleware/
│   │   └── auth.js            # JWT protect + role authorize
│   ├── utils/
│   │   └── seed.js            # Demo data seeder
│   ├── server.js
│   ├── Dockerfile             # Multi-stage production build
│   ├── Dockerfile.dev         # Development with nodemon
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/        # BaseLayout, StudentLayout, TeacherLayout, AdminLayout
│   │   │   └── Chatbot/       # AI assistant panel
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── auth/          # LoginPage, RegisterPage
│   │   │   ├── student/       # Dashboard, Courses, CourseDetail, LessonPage, QuizPage, Certificates, Profile
│   │   │   ├── teacher/       # Dashboard, MyCourses, Classroom, CourseEditor, Profile
│   │   │   ├── admin/         # Dashboard, Users, Courses
│   │   │   └── shared/        # Profile (shared between roles)
│   │   └── utils/
│   │       └── api.js         # Axios instance + all API calls
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile             # Multi-stage: build React → serve with Nginx
│   ├── Dockerfile.dev
│   └── nginx.conf             # SPA routing + API proxy + gzip
│
├── docker-compose.yml         # Production
├── docker-compose.dev.yml     # Development with hot reload
├── .env.example               # Root env template
└── README.md
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account (free tier works)
- Anthropic API key

### 1. Clone and configure

```bash
git clone https://github.com/your-org/dunis-elearning.git
cd dunis-elearning
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/dunis_elearning
JWT_SECRET=change_this_to_a_long_random_string_in_production
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxx
ALLOWED_EMAIL_DOMAIN=dunis.africa
CLIENT_URL=http://localhost:3000
```

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Seed demo data (optional but recommended)

```bash
cd backend
npm run seed
```

This creates demo accounts — see [Demo Accounts](#demo-accounts).

### 5. Start development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm start
```

Open: **http://localhost:3000**

---

## Docker Deployment

### Development (with hot reload)

```bash
# 1. Create .env at project root
cp backend/.env.example .env
# Edit .env with your values

# 2. Start
docker-compose -f docker-compose.dev.yml up --build

# Backend:  http://localhost:5000
# Frontend: http://localhost:3000
```

### Production (optimized build)

```bash
# 1. Set environment variables
cp backend/.env.example .env
nano .env  # Fill in all production values

# 2. Build and start
docker-compose up --build -d

# 3. Check status
docker-compose ps
docker-compose logs -f

# Frontend: http://localhost (port 80)
# Backend:  http://localhost:5000
```

### Useful Docker commands

```bash
# View logs
docker-compose logs backend -f
docker-compose logs frontend -f

# Restart a service
docker-compose restart backend

# Run seed inside container
docker-compose exec backend node utils/seed.js

# Stop everything
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild a single service
docker-compose up --build backend -d

# Shell into backend container
docker-compose exec backend sh
```

### Docker Health Checks

Both services include health checks:
- **Backend**: `GET /api/health` every 30s
- **Frontend**: `GET /index.html` every 30s

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' dunis_backend | python3 -m json.tool
```

---

## AWS Deployment

### Architecture Overview

```
Internet → Route 53 (DNS)
         → ACM (SSL Certificate)
         → ALB (Application Load Balancer, port 443)
              ├── /api/* → ECS Task: backend (port 5000)
              └── /*     → ECS Task: frontend (port 80)

ECS Fargate (no servers to manage)
ECR (Docker image registry)
MongoDB Atlas (external, no AWS)
```

### Option A: AWS ECS Fargate (Recommended)

#### Step 1 — Install AWS CLI and configure

```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configure
aws configure
# AWS Access Key ID: AKIAXXXXXXXX
# AWS Secret Access Key: xxxxxxxx
# Default region: eu-west-1  (or us-east-1, af-south-1, etc.)
# Default output format: json
```

#### Step 2 — Create ECR repositories

```bash
export AWS_REGION=eu-west-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create repos
aws ecr create-repository --repository-name dunis-backend  --region $AWS_REGION
aws ecr create-repository --repository-name dunis-frontend --region $AWS_REGION

echo "Backend ECR:  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dunis-backend"
echo "Frontend ECR: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dunis-frontend"
```

#### Step 3 — Build and push Docker images

```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push backend
cd backend
docker build -t dunis-backend .
docker tag dunis-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dunis-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dunis-backend:latest

# Build and push frontend
cd ../frontend
docker build -t dunis-frontend .
docker tag dunis-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dunis-frontend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dunis-frontend:latest
```

#### Step 4 — Create AWS Secrets Manager entries

```bash
# Store sensitive values securely
aws secretsmanager create-secret \
  --name "dunis/mongodb-uri" \
  --secret-string "mongodb+srv://user:pass@cluster.mongodb.net/dunis_elearning"

aws secretsmanager create-secret \
  --name "dunis/jwt-secret" \
  --secret-string "your-super-long-random-jwt-secret-key"

aws secretsmanager create-secret \
  --name "dunis/anthropic-api-key" \
  --secret-string "sk-ant-api03-xxxxxxxxxx"
```

#### Step 5 — Create ECS Task Definition (backend)

Save as `ecs-backend-task.json`:

```json
{
  "family": "dunis-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "dunis-backend",
      "image": "ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/dunis-backend:latest",
      "portMappings": [{ "containerPort": 5000, "protocol": "tcp" }],
      "environment": [
        { "name": "NODE_ENV",              "value": "production" },
        { "name": "PORT",                  "value": "5000" },
        { "name": "ALLOWED_EMAIL_DOMAIN",  "value": "dunis.africa" },
        { "name": "JWT_EXPIRE",            "value": "7d" },
        { "name": "CLIENT_URL",            "value": "https://elearning.dunis.africa" }
      ],
      "secrets": [
        { "name": "MONGODB_URI",       "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:dunis/mongodb-uri" },
        { "name": "JWT_SECRET",        "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:dunis/jwt-secret" },
        { "name": "ANTHROPIC_API_KEY", "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:dunis/anthropic-api-key" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/dunis-backend",
          "awslogs-region": "eu-west-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -qO- http://localhost:5000/api/health || exit 1"],
        "interval": 30, "timeout": 10, "retries": 3, "startPeriod": 40
      }
    }
  ]
}
```

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-backend-task.json \
  --region $AWS_REGION
```

#### Step 6 — Create ECS Cluster and Services

```bash
# Create cluster
aws ecs create-cluster --cluster-name dunis-elearning --region $AWS_REGION

# Create CloudWatch log groups
aws logs create-log-group --log-group-name /ecs/dunis-backend
aws logs create-log-group --log-group-name /ecs/dunis-frontend

# Create backend service (after creating ALB + target groups)
aws ecs create-service \
  --cluster dunis-elearning \
  --service-name dunis-backend \
  --task-definition dunis-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=dunis-backend,containerPort=5000" \
  --region $AWS_REGION
```

#### Step 7 — Setup ALB (Application Load Balancer)

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name dunis-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --region $AWS_REGION

# Create target groups
aws elbv2 create-target-group \
  --name dunis-backend-tg \
  --protocol HTTP --port 5000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /api/health \
  --region $AWS_REGION

aws elbv2 create-target-group \
  --name dunis-frontend-tg \
  --protocol HTTP --port 80 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /index.html \
  --region $AWS_REGION

# Create HTTPS listener with SSL certificate from ACM
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...:targetgroup/dunis-frontend-tg/... \
  --region $AWS_REGION

# Add rule to route /api/* to backend
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:...:listener/... \
  --priority 10 \
  --conditions '[{"Field":"path-pattern","Values":["/api/*"]}]' \
  --actions '[{"Type":"forward","TargetGroupArn":"arn:...:targetgroup/dunis-backend-tg/..."}]' \
  --region $AWS_REGION
```

#### Step 8 — Configure Route 53

```bash
# After ALB is created, get its DNS name
aws elbv2 describe-load-balancers \
  --names dunis-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text

# Create A record in Route 53 pointing elearning.dunis.africa → ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "elearning.dunis.africa",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "ALB_HOSTED_ZONE_ID",
          "DNSName": "dunis-alb-xxxx.eu-west-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

---

### Option B: AWS EC2 (Simpler, single server)

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t3.medium recommended)
# 2. Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (API)

# 3. SSH into instance
ssh -i "dunis-key.pem" ubuntu@your-ec2-ip

# 4. Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
newgrp docker

# 5. Clone your repo
git clone https://github.com/your-org/dunis-elearning.git
cd dunis-elearning

# 6. Configure environment
cp backend/.env.example .env
nano .env
# Fill: MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY
# Set: CLIENT_URL=http://your-ec2-ip or https://your-domain.com

# 7. Start with Docker Compose
docker compose up --build -d

# 8. Seed demo data
docker compose exec backend node utils/seed.js

# 9. Setup Nginx as reverse proxy with SSL (optional)
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d elearning.dunis.africa
```

**Nginx config for EC2** (`/etc/nginx/sites-available/dunis`):

```nginx
server {
    server_name elearning.dunis.africa;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/elearning.dunis.africa/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/elearning.dunis.africa/privkey.pem;
}

server {
    if ($host = elearning.dunis.africa) { return 301 https://$host$request_uri; }
    listen 80;
    server_name elearning.dunis.africa;
    return 404;
}
```

---

### CI/CD Pipeline (GitHub Actions)

Save as `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: eu-west-1
  ECR_BACKEND: dunis-backend
  ECR_FRONTEND: dunis-frontend

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_BACKEND:${{ github.sha }} -t $ECR_REGISTRY/$ECR_BACKEND:latest .
          docker push $ECR_REGISTRY/$ECR_BACKEND:${{ github.sha }}
          docker push $ECR_REGISTRY/$ECR_BACKEND:latest

      - name: Build and push frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd frontend
          docker build -t $ECR_REGISTRY/$ECR_FRONTEND:${{ github.sha }} -t $ECR_REGISTRY/$ECR_FRONTEND:latest .
          docker push $ECR_REGISTRY/$ECR_FRONTEND:${{ github.sha }}
          docker push $ECR_REGISTRY/$ECR_FRONTEND:latest

      - name: Deploy backend to ECS
        run: |
          aws ecs update-service \
            --cluster dunis-elearning \
            --service dunis-backend \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}

      - name: Deploy frontend to ECS
        run: |
          aws ecs update-service \
            --cluster dunis-elearning \
            --service dunis-frontend \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster dunis-elearning \
            --services dunis-backend dunis-frontend \
            --region ${{ env.AWS_REGION }}
```

**Required GitHub Secrets**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | Yes | Environment | `production` |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | ✅ | JWT signing key (min 32 chars) | `random-long-string` |
| `JWT_EXPIRE` | No | Token expiry | `7d` |
| `ALLOWED_EMAIL_DOMAIN` | No | Email domain restriction | `dunis.africa` |
| `ANTHROPIC_API_KEY` | ✅ | Claude AI key | `sk-ant-api03-...` |
| `CLIENT_URL` | Yes | Frontend URL for CORS | `https://elearning.dunis.africa` |
| `SMTP_HOST` | No | Email server | `smtp.gmail.com` |
| `SMTP_USER` | No | Email address | `noreply@dunis.africa` |
| `SMTP_PASS` | No | Email password | `app-password` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://elearning.dunis.africa/api` |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register with `@dunis.africa` email |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | 🔒 | Get current user |
| PUT | `/api/auth/update-profile` | 🔒 | Update profile |
| PUT | `/api/auth/change-password` | 🔒 | Change password |

### Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/courses` | 🔒 | Public catalog |
| GET | `/api/courses/my` | 🔒 Teacher | Teacher's courses |
| GET | `/api/courses/enrolled` | 🔒 | Student's enrollments |
| GET | `/api/courses/:id` | 🔒 | Course detail |
| POST | `/api/courses` | 🔒 Teacher | Create course |
| PUT | `/api/courses/:id` | 🔒 Teacher | Update course |
| DELETE | `/api/courses/:id` | 🔒 Admin | Delete course |
| POST | `/api/courses/:id/lessons` | 🔒 Teacher | Add lesson |
| PUT | `/api/courses/:id/lessons/:lid` | 🔒 Teacher | Update lesson |
| DELETE | `/api/courses/:id/lessons/:lid` | 🔒 Teacher | Delete lesson |
| POST | `/api/courses/:id/meets` | 🔒 Teacher | Schedule live session |
| GET | `/api/courses/:id/students` | 🔒 Teacher | Class roster with progress |
| POST | `/api/courses/:id/enroll` | 🔒 | Enroll in course |
| GET | `/api/courses/:id/enrollment-check` | 🔒 | Check enrollment status |

### Learning

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/progress` | 🔒 | Mark lesson complete |
| GET | `/api/progress/:courseId` | 🔒 | Get course progress |
| POST | `/api/assignments/submit` | 🔒 Student | Submit assignment |
| GET | `/api/assignments/course/:id` | 🔒 Teacher | All course submissions |
| GET | `/api/assignments/my/:courseId` | 🔒 Student | My submissions |
| PUT | `/api/assignments/:id/grade` | 🔒 Teacher | Grade assignment |
| GET | `/api/quizzes/course/:courseId` | 🔒 | Course quizzes |
| GET | `/api/quizzes/:id` | 🔒 | Quiz detail |
| POST | `/api/quizzes` | 🔒 Teacher | Create quiz |
| POST | `/api/quizzes/:id/submit` | 🔒 Student | Submit quiz |
| GET | `/api/quizzes/:id/attempts` | 🔒 Student | My attempts |
| GET | `/api/quizzes/:id/all-attempts` | 🔒 Teacher | All student attempts |
| GET | `/api/certificates/my` | 🔒 | My certificates |
| GET | `/api/certificates/verify/:certId` | — | Verify certificate (public) |
| GET | `/api/notifications` | 🔒 | My notifications |
| PUT | `/api/notifications/read-all` | 🔒 | Mark all read |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/student` | 🔒 Student | Student stats + upcoming |
| GET | `/api/dashboard/teacher` | 🔒 Teacher | Teacher stats + class |
| GET | `/api/dashboard/admin` | 🔒 Admin | Platform-wide stats |

### Users (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | 🔒 Admin | All users (filterable) |
| GET | `/api/users/teachers/list` | 🔒 | All teachers |
| PUT | `/api/users/:id/role` | 🔒 Admin | Change user role |
| PUT | `/api/users/:id/toggle-active` | 🔒 Admin | Suspend/activate |
| DELETE | `/api/users/:id` | 🔒 Admin | Delete user |

### AI Chatbot

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chatbot/message` | 🔒 | Chat with AI assistant |
| POST | `/api/chatbot/explain` | 🔒 | Explain a concept |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | — | Server health check |

---

## Demo Accounts

After running `npm run seed` (in backend):

| Role | Email | Password |
|------|-------|----------|
| 🛡️ Admin | `admin@dunis.africa` | `Admin@2024` |
| 👨‍🏫 Teacher 1 | `fatou.diallo@dunis.africa` | `Teacher@2024` |
| 👨‍🏫 Teacher 2 | `moussa.kone@dunis.africa` | `Teacher@2024` |
| 🎓 Student 1 | `aminata.sarr@dunis.africa` | `Student@2024` |
| 🎓 Student 2 | `ibrahima.balde@dunis.africa` | `Student@2024` |
| 🎓 Student 3 | `mariama.diop@dunis.africa` | `Student@2024` |

> **Note:** Only `@dunis.africa` email addresses can register and login.

---

## Roles & Permissions

### Student (`/student/...`)
- View enrolled courses, video lessons, reading materials
- Submit assignments, take quizzes
- Join live sessions (meets)
- Track own progress and completion %
- Earn level-up points (Beginner → Intermediate → Advanced → Expert)
- Receive auto-generated certificates upon course completion
- Use AI academic assistant

### Teacher (`/teacher/...`)
- Create and publish courses
- Add/edit/delete lessons (video, reading, assignment)
- View class roster with individual student progress
- Grade student assignments with feedback
- Schedule live sessions (Google Meet, Zoom, Teams, other)
- Create quizzes with auto-grading
- Receive notifications when students submit work

### Admin (`/admin/...`)
- Full access to all above
- Manage all users (change roles, suspend/activate, delete)
- Publish/unpublish any course
- View platform-wide statistics

---

## Level System

Students earn points through course completion and quiz performance:

| Level | Points Required | Color |
|-------|----------------|-------|
| 🌱 Beginner | 0 — 499 | Green |
| 📈 Intermediate | 500 — 1,999 | Blue |
| 🔥 Advanced | 2,000 — 4,999 | Orange |
| ⭐ Expert | 5,000+ | Gold |

**Point sources:**
- Complete a lesson: **+10 pts**
- Complete a course: **+100 pts**
- Pass a quiz: **+score/5 pts** (e.g. 90% → +18 pts)
- Assignment graded ≥50: **+grade/10 pts**

---

## Certificate System

Certificates are **automatically issued** when a student:
1. Completes all lessons in a course (100% progress)
2. Receives a unique ID: `DUNIS-CERT-XXXXXXXX`

Certificates can be publicly verified at: `/api/certificates/verify/:certId`

---

## 🌍 Campuses

| Campus | Country |
|--------|---------|
| 🇸🇳 Dakar | Senegal |
| 🇨🇮 Abidjan | Côte d'Ivoire |
| 🇨🇲 Douala | Cameroon |
| 🇬🇲 Banjul | Gambia |
| 🌐 Online | Global |

---

## Support

- **Website**: [dunis.africa](https://dunis.africa)
- **Dakar**: +221 77 864 94 94
- **Abidjan**: +225 07 69 12 02 47
- **Douala**: +237 6 95 56 37 37

---

*DUNIS Africa E-Learning Platform v3 — Built for Africa, Ready for the World* 🌍
