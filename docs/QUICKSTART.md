# Quick Start Guide

Get the Research Scholars Management Portal up and running in 10 minutes!

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip

## Installation Steps

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb research_portal

# Or using psql
psql -U postgres
CREATE DATABASE research_portal;
\q
```

### 3. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Minimum required:
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/research_portal
SECRET_KEY=your-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-change-this
```

### 4. Initialize Database

```bash
# Run migrations
flask db upgrade

# Load sample data (optional but recommended for testing)
flask seed-db
```

### 5. Start the Server

```bash
python run.py
```

The application will be available at: **http://localhost:5000**

## Test the Application

### Test Credentials

After running `flask seed-db`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Dean Academics | dean@university.edu | password123 |
| AD Research | ad.research@university.edu | password123 |
| School Chair | chair.cs@university.edu | password123 |
| Supervisor | supervisor1@university.edu | password123 |
| Scholar (PhD) | scholar1@university.edu | password123 |
| Scholar (MSc) | scholar2@university.edu | password123 |

### Quick API Test

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"scholar1@university.edu","password":"password123"}'

# Save the access_token from response, then:
curl -X GET http://localhost:5000/api/scholars/my-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Issues

### Database Connection Error

```
Could not connect to database
```

**Solution:** Check PostgreSQL is running and credentials in `.env` are correct.

```bash
# Check PostgreSQL status
sudo service postgresql status

# Or on Windows
pg_ctl status
```

### Import Errors

```
ModuleNotFoundError: No module named 'flask'
```

**Solution:** Activate virtual environment and install dependencies.

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Port Already in Use

```
Address already in use
```

**Solution:** Change port or kill the process using port 5000.

```bash
# Use different port
python run.py --port 5001

# Or find and kill process using port 5000 (Linux/Mac)
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Next Steps

1. **Explore the API**: Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. **Read Full Documentation**: See [README.md](README.md)
3. **Customize**: Modify templates in `app/templates/`
4. **Add Features**: Extend models and routes as needed

## Development Tips

### Database Migrations

When you modify models:

```bash
# Create migration
flask db migrate -m "Description of changes"

# Apply migration
flask db upgrade

# Rollback migration
flask db downgrade
```

### Flask Shell

Access Flask shell for database operations:

```bash
flask shell

# Inside shell
>>> from app.models import User, Scholar
>>> scholars = Scholar.query.all()
>>> print(scholars)
```

### Reset Database

```bash
# WARNING: This deletes all data!
flask db downgrade base
flask db upgrade
flask seed-db
```

## Project Structure Overview

```
research-portal/
├── app/                    # Application package
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   ├── utils/             # Utility functions
│   ├── templates/         # HTML templates
│   └── static/            # Static files & uploads
├── migrations/            # Database migrations
├── config.py             # Configuration
├── run.py                # Entry point
├── requirements.txt      # Dependencies
└── .env                  # Environment variables
```

## Support

- **Documentation**: [README.md](README.md)
- **API Reference**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Issues**: Contact system administrator

---

**Happy Coding!** 🚀
