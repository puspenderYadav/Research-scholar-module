# Research Scholars Management Portal - Setup Guide

This guide will help you set up the Research Scholars Management Portal after cloning from GitHub.

## Prerequisites

Before starting, ensure you have:

- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **PostgreSQL 12+** installed and running
- Git installed

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd research
```

### 2. Backend Setup

#### Step 2.1: Create Virtual Environment

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### Step 2.2: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 2.3: Configure Environment Variables

Create a `.env` file from the example:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

**IMPORTANT:** Edit the `.env` file and update these critical settings:

```env
# Database Configuration - CHANGE THIS
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/research_portal

# Security Keys - CHANGE THESE
SECRET_KEY=your-unique-secret-key-here
JWT_SECRET_KEY=your-unique-jwt-secret-key-here

# Email Configuration (Optional - for notifications)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
```

**To generate secure secret keys**, you can use Python:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run this command twice to generate two different keys for `SECRET_KEY` and `JWT_SECRET_KEY`.

#### Step 2.4: Create PostgreSQL Database

```bash
# Method 1: Using createdb command
createdb research_portal

# Method 2: Using psql
psql -U postgres
CREATE DATABASE research_portal;
\q
```

#### Step 2.5: Initialize Database

Run migrations to create all tables:

```bash
flask db upgrade
```

#### Step 2.6: Seed Database with Test Data

**CRITICAL STEP:** Load initial users to avoid 401 errors:

```bash
flask seed-db
```

This creates test users with the following credentials:

| Role | Email | Password |
|------|-------|----------|
| Dean Academics | dean@university.edu | password123 |
| AD Research | ad.research@university.edu | adresearch123 |
| School Chair | chair.cs@university.edu | password123 |
| Supervisor 1 | supervisor1@university.edu | password123 |
| Supervisor 2 | supervisor2@university.edu | password123 |
| Scholar 1 (PhD) | scholar1@university.edu | password123 |
| Scholar 2 (MSc) | scholar2@university.edu | password123 |

#### Step 2.7: Start Backend Server

```bash
python run.py
```

The backend API will be available at: **http://localhost:5000**

### 3. Frontend Setup

Open a **new terminal window** and navigate to the frontend directory:

#### Step 3.1: Navigate to Frontend

```bash
cd frontend
```

#### Step 3.2: Install Dependencies

```bash
npm install
# or
yarn install
```

#### Step 3.3: Configure Environment Variables

Create a `.env` file:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` and verify the API URL (default should work):

```env
VITE_API_URL=http://localhost:5000/api
```

#### Step 3.4: Start Frontend Development Server

```bash
npm run dev
# or
yarn dev
```

The frontend will be available at: **http://localhost:3000**

### 4. Login and Test

1. Open your browser and go to **http://localhost:3000**
2. You should see the login page
3. Select a role from the dropdown
4. Enter credentials from the table above (e.g., scholar1@university.edu / password123)
5. Click "Sign In"

## Troubleshooting Common Issues

### Issue: 401 UNAUTHORIZED Error on Login

**Cause:** The database is not seeded with users, or the `.env` file is missing/incorrect.

**Solution:**

1. Ensure the backend `.env` file exists and has correct `DATABASE_URL`
2. Run database migrations: `flask db upgrade`
3. **Seed the database**: `flask seed-db`
4. Restart the backend server
5. Clear browser cache and try again

### Issue: Database Connection Error

**Cause:** PostgreSQL is not running or connection settings are wrong.

**Solution:**

```bash
# Check PostgreSQL status (Linux/Mac)
sudo service postgresql status

# Start PostgreSQL (Linux/Mac)
sudo service postgresql start

# Windows: Check services or restart PostgreSQL service
```

Verify your `DATABASE_URL` in `.env` matches your PostgreSQL credentials.

### Issue: Backend Import Errors

**Cause:** Virtual environment not activated or dependencies not installed.

**Solution:**

```bash
# Activate virtual environment
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Frontend Cannot Connect to Backend

**Cause:** Backend not running or wrong API URL.

**Solution:**

1. Ensure backend is running on port 5000
2. Check `VITE_API_URL` in frontend `.env`
3. Check browser console for CORS errors
4. Restart both servers

### Issue: Port Already in Use

**Backend (5000):**
Edit `run.py` and change the port:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

**Frontend (3000):**
Edit `vite.config.js` and change the port:
```javascript
server: {
  port: 3001,
  // ...
}
```

## Project Structure

```
research/
├── backend/              # Flask REST API
│   ├── app/             # Application code
│   ├── migrations/      # Database migrations
│   ├── .env            # Environment config (create this)
│   ├── .env.example    # Template
│   ├── config.py       # App configuration
│   ├── run.py          # Entry point
│   └── requirements.txt
│
├── frontend/            # React application
│   ├── src/            # Source code
│   ├── public/         # Static files
│   ├── .env           # Environment config (create this)
│   ├── .env.example   # Template
│   ├── package.json
│   └── vite.config.js
│
└── SETUP_GUIDE.md      # This file
```

## Development Workflow

### Making Database Changes

1. Modify models in `backend/app/models/`
2. Create migration: `flask db migrate -m "Description"`
3. Apply migration: `flask db upgrade`

### Adding New Features

1. **Backend:** Add routes in `backend/app/routes/`
2. **Frontend:** Add pages in `frontend/src/pages/`
3. Update API service in `frontend/src/services/api.js`

## Security Notes

- **NEVER commit `.env` files to Git** - they contain sensitive credentials
- Change default passwords immediately in production
- Generate strong secret keys for production deployment
- Use environment-specific configurations

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review backend logs in the terminal
3. Check browser console for frontend errors
4. Verify all prerequisites are installed
5. Ensure `.env` files are correctly configured

## Next Steps

After successful setup:

1. Read [backend/README.md](backend/README.md) for backend API documentation
2. Read [frontend/README.md](frontend/README.md) for frontend architecture
3. Explore the application with different user roles
4. Review the codebase to understand the structure

## Production Deployment

For production deployment, refer to:
- Backend deployment guide in `backend/README.md`
- Frontend deployment guide in `frontend/README.md`

Remember to:
- Use strong secret keys
- Set `FLASK_ENV=production`
- Configure proper CORS settings
- Use a production-grade database
- Enable HTTPS
- Set up proper logging and monitoring
