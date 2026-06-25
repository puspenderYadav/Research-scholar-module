## My Contributions

- Developed over 30% of the project implementation.
- Designed and implemented core backend modules.
- Built multiple frontend components and integrated REST APIs.
- Contributed to database design, testing, and debugging.

> Note: This repository is a fork of the original team repository.


# Research Scholars Management Portal

A comprehensive full-stack web application for managing PhD and M.Sc. research scholars at IIT Mandi.

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Backend](https://img.shields.io/badge/backend-Flask%203.0-blue)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2018-61dafb)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL-336791)]()

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [User Roles](#user-roles)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Research Scholars Management Portal streamlines the complete lifecycle of research scholars with:

- **Automated Workflows** - Multi-stage approval processes
- **Role-Based Access** - 7 distinct user roles
- **Real-Time Notifications** - In-app and email alerts
- **Document Management** - Secure file uploads
- **Progress Tracking** - Scholar milestone monitoring

---

## Features

### Core Functionality
- Scholar profile management (auto-created at admission)
- Supervisor and co-supervisor assignment
- Committee formation (DC and APC)
- Comprehensive exams scheduling
- Seminar management (PhD: 2, M.Sc.: 1)
- Synopsis submission workflow
- Progress reports with ratings
- Thesis defense workflow
- Travel grant applications
- Leave management (30 days/year)

### Key Workflows

**Progress Report:** Scholar → Supervisor → Committee → DC/APC → Dean

**Synopsis Approval:** Scholar → Supervisor → Committee → DC/APC → Dean

**Thesis Defense:** Draft → Examiner Assignment → Defense → Final Submission

**Travel Grant:** Scholar → Supervisor → Committee → AD Research → Dean

**Leave Application:** Scholar → Supervisor → School Chair (if >7 days)

---

## Tech Stack

### Backend
- Flask 3.0.0
- PostgreSQL 12+
- SQLAlchemy 3.1.1
- Flask-JWT-Extended
- Flask-Mail
- Flask-Migrate

### Frontend
- React 18.2.0
- Vite 5.0.0
- Tailwind CSS 3.3.5
- Axios 1.6.0
- React Router 6.20.0

---

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/research_portal
# SECRET_KEY=your-secret-key
# JWT_SECRET_KEY=your-jwt-secret
# MAIL_SERVER=smtp.gmail.com
# MAIL_PORT=587
# MAIL_USERNAME=your-email@gmail.com
# MAIL_PASSWORD=your-app-password

# Initialize database
flask db upgrade

# Run server
python run.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
---

## Project Structure

```
research-portal/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models (18+)
│   │   ├── routes/          # API endpoints (21 modules, 143 endpoints)
│   │   ├── utils/           # Helper functions
│   │   └── static/uploads/  # File storage
│   ├── migrations/          # Database migrations
│   ├── config.py            # Configuration
│   ├── run.py               # Entry point
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components (13)
│   │   ├── pages/           # Page components (29)
│   │   ├── contexts/        # Auth context
│   │   └── services/        # API client
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## API Overview

### Base URL
```
http://localhost:5000/api
```

### Authentication
```
Authorization: Bearer <access_token>
```

### Key Endpoints

| Module | Base | Description |
|--------|------|-------------|
| Auth | `/api/auth` | Login, register, tokens |
| Scholars | `/api/scholars` | Scholar management |
| Progress | `/api/progress-reports` | Progress reports |
| Synopsis | `/api/synopsis` | Synopsis workflow |
| Thesis | `/api/thesis` | Thesis defense |
| Travel | `/api/travel-grants` | Grant applications |
| Leaves | `/api/leaves` | Leave system |
| Notifications | `/api/notifications` | Alerts |
| Calendar | `/api/calendar` | Events |
| Dean | `/api/dean` | Admin portal |


---

## User Roles

### 1. Scholar
- View own profile
- Submit reports, synopsis, thesis
- Apply for grants and leave
- View calendar and notifications

### 2. Supervisor
- Manage supervised scholars
- Review and approve submissions
- Schedule meetings and seminars
- Assign committees

### 3. Committee Member (DC/APC)
- Review assigned scholar work
- Approve at committee stage

### 4. School Chair
- School-level oversight
- Approve extended leaves
- View analytics

### 5. AD Research
- Institute-wide research view
- Approve travel grants

### 6. Dean Academics
- Full system access
- Final approvals
- User management
- System configuration

### 7. Research Office
- Administrative functions
- Bulk operations
- Document management

---

## Deployment

### Production on Render

**Backend:**
1. Create Web Service
2. Connect GitHub repo
3. Build: `pip install -r requirements.txt`
4. Start: `gunicorn "app:create_app('production')"`
5. Add environment variables

**Frontend:**
1. Create Static Site
2. Build: `npm run build`
3. Publish: `dist`

**Database:**
- Create PostgreSQL on Render
- Copy connection string to backend env

### Environment Variables

```env
DATABASE_URL=postgresql://...
SECRET_KEY=<random-string>
JWT_SECRET_KEY=<random-string>
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=app-password
FRONTEND_URL=https://your-frontend.onrender.com
```

---

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d research_portal
```

### CORS Errors
Update `backend/app/__init__.py` with correct frontend URL in CORS config.

### Module Not Found
```bash
# Activate virtual environment first
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
```

### Email Not Sending
- Enable 2FA on Gmail
- Generate App Password
- Use app password (not account password)

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## Project Stats

| Metric | Value |
|--------|-------|
| Backend Modules | 21 |
| API Endpoints | 143 |
| Frontend Pages | 29 |
| Database Models | 18+ |
| User Roles | 7 |
| Lines of Code | 15,000+ |

---

**Version 1.0.0** | **November 2025** | **IIT Mandi**

