# Deployment Summary - Research Scholars Management Portal

## What I've Created for You

I've prepared everything you need to deploy your Research Portal to **Render.com** (100% FREE):

### 📁 Files Created

1. **[RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment guide
2. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Quick checklist format (30 minutes)
3. **[backend/build.sh](backend/build.sh)** - Build script for Render
4. **[backend/render.yaml](backend/render.yaml)** - Render configuration (optional)
5. **[backend/.gitignore](backend/.gitignore)** - Git ignore file for backend
6. **[backend/requirements.txt](backend/requirements.txt)** - Updated with gunicorn

---

## Quick Start (3 Steps)

### Step 1: Push to GitHub (5 min)

```bash
cd "C:\Users\paridhi mittal\OneDrive\Desktop\publi\research"
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Follow the Checklist (25 min)

Open **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** and follow each checkbox.

### Step 3: Test & Go Live (5 min)

Login with test credentials and verify everything works!

---

## What You'll Deploy

```
┌─────────────────────────────────────┐
│  Frontend (React + Vite)            │
│  FREE Static Site Hosting           │
│  URL: research-portal-frontend      │
│       .onrender.com                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend (Flask + Python)           │
│  FREE Web Service                   │
│  URL: research-portal-backend       │
│       .onrender.com                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Database (PostgreSQL)              │
│  FREE 1GB Storage                   │
│  Managed by Render                  │
└─────────────────────────────────────┘
```

---

## Deployment Order

1. **Database** → Create PostgreSQL instance
2. **Backend** → Deploy Flask API (connects to database)
3. **Frontend** → Deploy React app (connects to backend)
4. **Configure** → Update CORS settings
5. **Seed** → Create test users via Shell
6. **Test** → Login and verify

---

## Key Configuration

### Backend Environment Variables

```env
PYTHON_VERSION=3.11.0
FLASK_ENV=production
DATABASE_URL=[from Render database]
SECRET_KEY=[generate secure key]
JWT_SECRET_KEY=[generate secure key]
FRONTEND_URL=https://research-portal-frontend.onrender.com
```

### Frontend Environment Variables

```env
VITE_API_URL=https://research-portal-backend.onrender.com/api
```

---

## Free Tier Details

| Service | What You Get |
|---------|--------------|
| **PostgreSQL** | 1GB storage, 90-day retention |
| **Backend** | 512MB RAM, spins down after 15 min inactivity |
| **Frontend** | Unlimited bandwidth, always on, global CDN |
| **SSL** | FREE automatic HTTPS certificates |
| **Auto-deploy** | Push to GitHub = auto redeploy |

**Total Cost: $0/month**

---

## Important Notes

### ⚠️ Free Tier Spin-Down

The backend service will spin down after 15 minutes of no activity. The first request after spin-down takes **30-60 seconds** to wake up.

**Solutions:**
- Use keep-alive service (ping every 10 min)
- Upgrade to paid tier ($7/month for always-on)
- Accept the delay (acceptable for low-traffic apps)

### ⚠️ Database Expiration

Free PostgreSQL expires after **90 days**. You'll need to:
- Create a new database
- Migrate data
- Or upgrade to paid tier ($7/month for permanent storage)

---

## Fixed Admin Accounts

### Pre-configured Administrative Accounts

The system includes two fixed admin accounts for Dean Academics and AD Research:

**Dean Academics:**
- Email: `dean.academics@iitmandi.ac.in`
- Password: `Dean@123`
- Role: `dean_academics`

**AD Research:**
- Email: `ad.research@iitmandi.ac.in`
- Password: `ADResearch@123`
- Role: `ad_research`

### Creating Admin Accounts

After deploying the database and backend:

```bash
# In Render Shell or local terminal
flask init-admin-accounts
```

This command is **idempotent** (safe to run multiple times) and will:
- Create both admin accounts if they don't exist
- Skip creation if accounts already exist
- Display the credentials for confirmation

---

## After Deployment

### Security Tasks

1. ✅ Fixed admin accounts pre-configured (Dean Academics & AD Research)
2. Change default passwords for test users
3. Verify secret keys are strong
4. Set up email notifications
5. Review user permissions

### Optional Enhancements

1. Custom domain (e.g., `research.iitmandi.ac.in`)
2. Error monitoring (Sentry)
3. Analytics (Google Analytics)
4. Regular database backups

---

## Support & Documentation

- **Detailed Guide:** [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)
- **Quick Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Setup Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md) (for local development)
- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Run `flask seed-db` in backend Shell |
| CORS errors | Update `FRONTEND_URL` in backend env vars |
| Build fails | Check logs, verify Python version |
| Slow response | Free tier spin-down (wait 30-60s) |

---

## Next Steps

1. [ ] Read [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
2. [ ] Push code to GitHub
3. [ ] Sign up for Render.com
4. [ ] Follow checklist step-by-step
5. [ ] Test deployment
6. [ ] Share with users!

---

## Estimated Timeline

- **Preparation:** 10 minutes (push to GitHub)
- **Database setup:** 5 minutes
- **Backend deployment:** 10 minutes
- **Frontend deployment:** 10 minutes
- **Testing:** 5 minutes

**Total: ~40 minutes** from start to live application

---

## Cost Breakdown

| Tier | Monthly Cost | Features |
|------|--------------|----------|
| **Free** | $0 | Perfect for testing/small projects |
| **Paid** | $14 | Always-on, permanent storage, backups |

---

**You're all set! Follow the deployment guide and your portal will be live in under an hour!** 🚀
