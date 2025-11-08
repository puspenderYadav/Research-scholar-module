# Research Scholars Management Portal

A comprehensive full-stack web application for managing PhD and M.Sc. research scholars throughout their academic journey, from admission to thesis defense.

## 🎯 Overview

This system streamlines the entire research scholar lifecycle with automated workflows, real-time notifications, and transparent tracking for all stakeholders including scholars, supervisors, committee members, and administrators.

## 📁 Project Structure

```
research-portal/
├── backend/                    # Flask REST API
│   ├── app/                   # Application code
│   │   ├── models/           # Database models (12 models)
│   │   ├── routes/           # API endpoints (40+ endpoints)
│   │   ├── utils/            # Utilities & services
│   │   └── static/           # File uploads
│   ├── migrations/            # Database migrations
│   ├── config.py             # Configuration
│   ├── run.py                # Entry point
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # Backend documentation
│
├── frontend/                   # React + Vite application
│   ├── src/                  # Source code
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── contexts/         # React contexts
│   │   └── assets/           # CSS, images
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   └── README.md             # Frontend documentation
│
├── API_DOCUMENTATION.md        # Complete API reference
├── ARCHITECTURE.md             # System architecture diagrams
├── PROJECT_SUMMARY.md          # Comprehensive project overview
├── QUICKSTART.md               # 10-minute quick start guide
└── README.md                   # This file
```

## 🚀 Tech Stack

### Backend
- **Flask 3.0** - Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy 3.1** - ORM
- **JWT (Flask-JWT-Extended)** - Authentication
- **Flask-Mail** - Email notifications
- **Flask-Migrate** - Database migrations

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS 3** - Utility-first CSS
- **date-fns** - Date utilities

## ✨ Key Features

### 🎓 Academic Management
- Student profile management (auto-created at admission)
- Supervisor & committee assignments (DC & ADC)
- Comprehensive exam tracking with notifications
- Seminar scheduling (PhD: 2, MSc: 1)
- Synopsis submission with version control
- Progress report system with ratings
- Thesis submission and defense scheduling

### ✈️ Travel Grant Workflow
Multi-stage approval process with real-time tracking:
```
Student → Supervisor → DC → School Chair → AD Research → Dean Academics
```
Each stage includes:
- Approve / Reject / Request Changes options
- Comments and feedback
- Timestamped actions
- Automatic notifications

### 📧 Notification System
- Real-time in-app notifications
- Automatic email alerts
- Priority-based alerts (low/medium/high/urgent)
- Notification types: exam, seminar, submission, approval, deadline
- Unread badge counter

### 📅 Calendar Integration
- Unified calendar view for all stakeholders
- Exam schedules
- Seminar dates
- Thesis defense dates
- Deadline tracking
- Date filtering

### 🔐 Security & Authorization
- JWT-based authentication (access + refresh tokens)
- Role-based access control (RBAC) decorators
- Secure file upload with validation
- Password hashing (Werkzeug)
- SQL injection prevention (ORM)
- CORS configuration

## 👥 User Roles

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **Scholar** | Personal data | Submit documents, track progress, request supervisor change |
| **Supervisor** | Supervised scholars | Review submissions (Accept/Suggest Changes/Reject), schedule events |
| **DC Member** | Assigned scholars | Review progress, approve travel grants |
| **ADC Member** | Read-only | View scholar information |
| **School Chair** | School-wide | View school data, approve travel grants |
| **AD Research** | Institute-wide | Access all research data, approve travel grants |
| **Dean Academics** | Full system | Complete control, assign supervisors/committees, final approvals |

## 🏃 Quick Start

### Prerequisites

Before starting, make sure you have the following installed:

| Requirement | Version | Download Link |
|------------|---------|---------------|
| **Python** | 3.8 or higher | [python.org](https://www.python.org/downloads/) |
| **PostgreSQL** | 12 or higher | [postgresql.org](https://www.postgresql.org/download/) |
| **Node.js** | 16 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | Comes with Node.js | - |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### 🔧 Complete Setup Guide

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/research-scholars-portal.git
cd research-scholars-portal
```

## Step 2: Backend Setup (Detailed)

### 2.1 Create PostgreSQL Database

```bash
# Start PostgreSQL service (if not running)
# Linux:
sudo service postgresql start

# macOS:
brew services start postgresql

# Windows: PostgreSQL should start automatically

# Create database
psql -U postgres
# In psql shell:
CREATE DATABASE research_portal;
\q
```

### 2.2 Set Up Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On Linux/Mac:
source venv/bin/activate

# You should see (venv) in your terminal prompt
```

### 2.3 Install Python Dependencies

```bash
# Make sure virtual environment is activated
pip install -r requirements.txt
```

### 2.4 Configure Environment Variables

```bash
# Copy the example environment file
# On Windows:
copy .env.example .env

# On Linux/Mac:
cp .env.example .env

# Edit .env file with your settings
# Use notepad, vim, or any text editor
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Important**: Update these values in `.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/research_portal

# JWT Secret (generate a random string)
JWT_SECRET_KEY=your-super-secret-key-here

# Email Configuration (for notifications)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

**Note**: For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833).

### 2.5 Initialize Database

```bash
# Create database tables
flask db upgrade

# Optional: Seed database with test data
python run.py
# The run.py file will automatically create test users on first run
```

### 2.6 Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
python run.py
```

✅ **Backend is now running on: http://localhost:5000**

You should see output like:
```
 * Running on http://0.0.0.0:5000
 * Debugger is active!
```

---

## Step 3: Frontend Setup (Detailed)

### 3.1 Navigate to Frontend Directory

```bash
# Open a NEW terminal window/tab
cd frontend
```

### 3.2 Install Node Dependencies

```bash
# This may take 2-3 minutes
npm install
```

### 3.3 Configure Frontend Environment (Optional)

```bash
# Copy the example environment file
# On Windows:
copy .env.example .env

# On Linux/Mac:
cp .env.example .env
```

The default `.env` file contains:
```env
VITE_API_URL=http://localhost:5000/api
```

This should work as-is. Only change if your backend runs on a different port.

### 3.4 Start Frontend Development Server

```bash
npm run dev
```

✅ **Frontend is now running on: http://localhost:3000**

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## Step 4: Access the Application

1. **Open your browser** and go to: **http://localhost:3000**
2. **Login** with any of the test credentials below
3. **Explore** different roles and features!

---

## 🔑 Test Credentials

After starting the backend, use these credentials to test different roles:

| Role | Email | Password |
|------|-------|----------|
| **Scholar (PhD)** | scholar1@university.edu | scholar123 |
| **Scholar (MSc)** | scholar2@university.edu | scholar123 |
| **Supervisor** | supervisor1@university.edu | supervisor123 |
| **School Chair** | chair.cs@university.edu | chair123 |
| **AD Research** | ad.research@university.edu | adresearch123 |
| **Dean Academics** | dean@university.edu | dean123 |

### First-Time Login

1. Go to http://localhost:3000
2. Select your role from the dropdown
3. Enter email and password
4. Click "Sign In"

---

## 🎯 Quick Verification Checklist

After setup, verify everything is working:

- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Can login with test credentials
- [ ] No errors in browser console (F12)
- [ ] No errors in backend terminal
- [ ] PostgreSQL database exists and has tables

---

## 🔄 Daily Development Workflow

Every time you work on the project:

### Terminal 1 - Backend:
```bash
cd backend
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac
python run.py
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Keep both terminals running while developing!

## 📚 Documentation

- **[Backend README](backend/README.md)** - Backend setup, API details, Flask commands
- **[Frontend README](frontend/README.md)** - Frontend setup, React components, development
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Quick Start Guide](QUICKSTART.md)** - Get started in 10 minutes
- **[System Architecture](ARCHITECTURE.md)** - Architecture diagrams and data flows
- **[Project Summary](PROJECT_SUMMARY.md)** - Comprehensive feature overview

## 🔄 API Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"scholar1@university.edu","password":"password123"}'
```

Response includes `access_token`, `refresh_token`, and user data.

### Get Scholar Profile

```bash
curl -X GET http://localhost:5000/api/scholars/my-profile \
  -H "Authorization: Bearer <access_token>"
```

### Submit Travel Grant

```bash
curl -X POST http://localhost:5000/api/travel-grants \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "Conference Presentation",
    "destination": "New York, USA",
    "conference_name": "IEEE Conference 2025",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05",
    "amount_requested": 2500.00
  }'
```

## 🏗️ Development

### Backend Development

```bash
cd backend

# Access Flask shell
flask shell

# Create migration
flask db migrate -m "Add new field"

# Apply migration
flask db upgrade

# Run in debug mode
export FLASK_ENV=development  # Linux/Mac
set FLASK_ENV=development     # Windows
python run.py
```

### Frontend Development

```bash
cd frontend

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚢 Production Deployment

### Backend with Gunicorn

```bash
cd backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

### Frontend Static Build

```bash
cd frontend
npm run build
# Deploy dist/ folder to static hosting (Netlify, Vercel, S3, etc.)
```

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🛠️ Troubleshooting

### Backend Issues

**Database connection error:**
```bash
# Check PostgreSQL is running
sudo service postgresql status  # Linux
# or
brew services list              # Mac

# Test connection
psql -U postgres -d research_portal
```

**Module not found:**
```bash
# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

**Port 3000 already in use:**
```javascript
// Change port in vite.config.js
server: { port: 3001 }
```

**API connection issues:**
- Ensure backend is running on port 5000
- Check `.env` file has correct `VITE_API_URL`
- Clear browser cache and localStorage
- Check browser console for errors

## 📊 System Statistics

- **Total API Endpoints**: 40+
- **Database Models**: 12
- **User Roles**: 7
- **Core Modules**: 10
- **Lines of Code**: 5,000+
- **React Components**: 15+
- **API Services**: 12

## 🎯 Core Workflows

### Document Review (3-Action System)
Applied to: Synopsis, Progress Reports, Thesis

- ✅ **Accept** - Approve document as-is
- 🔄 **Suggest Changes** - Request revisions with detailed feedback
- ❌ **Reject** - Decline submission with reasons

### Travel Grant Approval (6-Stage Process)
```
1. Student submits application
2. Supervisor reviews and approves
3. DC (Doctoral Committee) reviews
4. School Chair approves
5. AD Research approves
6. Dean Academics final approval
```

Each stage:
- View full application details
- Add comments
- Approve / Reject / Request Changes
- Automatic notification to next approver

## 📈 Database Schema

**12 Tables:**
- `users` - Base user authentication
- `scholars` - Student profiles
- `supervisors` - Faculty profiles
- `schools` - Academic departments
- `committees` + `committee_members` - DC/ADC management
- `exams` - Comprehensive exams
- `seminars` - Research seminars
- `synopsis` - Synopsis submissions
- `progress_reports` - Progress tracking
- `thesis` - Thesis submissions
- `travel_grants` + `travel_grant_approvals` - Grant workflow
- `notifications` - Notification system

**Key Relationships:**
- One-to-One: User ↔ Scholar, User ↔ Supervisor
- One-to-Many: Supervisor → Scholars, Scholar → Documents
- Many-to-Many: Committee ↔ Members

## 🧪 Testing

### Backend
```bash
cd backend
# Manual API testing
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"scholar1@university.edu","password":"password123"}'
```

### Frontend
```bash
cd frontend
# Test in browser
npm run dev
# Login with test credentials
```

## 🌟 Future Enhancements

- [ ] Advanced search and filtering
- [ ] Document version comparison
- [ ] Automated deadline reminders (Celery)
- [ ] Export reports to PDF/Excel
- [ ] Mobile responsive improvements
- [ ] Real-time chat support (WebSocket)
- [ ] Integration with institutional systems
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Rate limiting (Flask-Limiter)
- [ ] Redis caching for performance
- [ ] Comprehensive test suite (pytest, Jest)
- [ ] CI/CD pipeline (GitHub Actions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Specify License]

## 👨‍💻 Support

- **Email**: support@university.edu
- **Documentation**: See comprehensive docs in this repository
- **Issues**: GitHub Issues (if applicable)

## 🙏 Acknowledgments

Built with modern web technologies:
- Backend: Flask, PostgreSQL, SQLAlchemy
- Frontend: React, Vite, Tailwind CSS
- Authentication: JWT
- Notifications: Flask-Mail

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: November 2025

**🚀 Ready to deploy with proper backend and frontend separation!**
