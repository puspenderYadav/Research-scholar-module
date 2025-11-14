# Deployment Checklist

## Pre-Deployment Steps

### Environment Setup
- [ ] Copy `.env.example` to `.env` in backend folder
- [ ] Update `DATABASE_URL` with production database credentials
- [ ] Change `SECRET_KEY` to a secure random string
- [ ] Change `JWT_SECRET_KEY` to a secure random string
- [ ] Configure production email settings (SMTP)
- [ ] Update `FRONTEND_URL` to production domain

### Backend Configuration
- [ ] Install PostgreSQL and create database
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate virtual environment
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Run database migrations: `flask db upgrade`
- [ ] Create admin users (Dean, AD Research, etc.)
- [ ] Test backend: `python run.py`

### Frontend Configuration
- [ ] Copy `.env.example` to `.env` in frontend folder (if needed)
- [ ] Update `VITE_API_URL` to production API URL
- [ ] Install dependencies: `npm install`
- [ ] Build for production: `npm run build`
- [ ] Test production build: `npm run preview`

### Security Checklist
- [ ] All `.env` files added to `.gitignore`
- [ ] No test credentials in code
- [ ] No hardcoded secrets
- [ ] CORS configured for production domain only
- [ ] HTTPS/SSL certificates configured
- [ ] Database credentials secured
- [ ] File upload limits configured
- [ ] Rate limiting enabled (if applicable)

### Production Deployment
- [ ] Set up production database backups
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Deploy backend with Gunicorn or similar
- [ ] Deploy frontend to static hosting or Nginx
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up domain and DNS
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Test all critical workflows
- [ ] Create initial admin accounts

### Post-Deployment
- [ ] Monitor application logs
- [ ] Test email notifications
- [ ] Verify file uploads working
- [ ] Check all API endpoints
- [ ] Test authentication flows
- [ ] Verify database connections
- [ ] Monitor performance metrics
- [ ] Set up automated backups
- [ ] Document admin procedures
- [ ] Train initial users

## Quick Commands

### Backend
```bash
# Development
cd backend
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
python run.py

# Production
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app('production')"
```

### Frontend
```bash
# Development
cd frontend
npm run dev

# Production build
npm run build
```

### Database
```bash
# Backup
pg_dump -U postgres research_portal > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres research_portal < backup_YYYYMMDD.sql
```

## Support Contacts
- Technical Support: research@iitmandi.ac.in
- Documentation: See README.md and docs/ folder
