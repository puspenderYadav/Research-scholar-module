# Deploy Research Portal to Render - Complete Guide

This guide will walk you through deploying the Research Scholars Management Portal to Render.com for FREE.

## Prerequisites

Before you begin:
- ✅ GitHub account
- ✅ Render.com account (sign up at https://render.com - FREE)
- ✅ Your project pushed to GitHub

## Deployment Overview

You will deploy:
1. **PostgreSQL Database** (FREE tier)
2. **Backend API** (Flask - FREE tier)
3. **Frontend** (React - FREE tier)

**Total Cost: $0/month** 🎉

---

## Step 1: Push Your Project to GitHub

### 1.1 Create a GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `research-scholars-portal`)
3. Choose **Public** or **Private** (both work with Render)
4. **DO NOT** initialize with README (you already have one)

### 1.2 Push Your Code

```bash
# Navigate to your project root
cd "C:\Users\paridhi mittal\OneDrive\Desktop\publi\research"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Render deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/research-scholars-portal.git

# Push to GitHub
git push -u origin main
```

---

## Step 2: Create PostgreSQL Database on Render

### 2.1 Login to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**

### 2.2 Configure Database

Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `research-portal-db` |
| **Database** | `research_portal` |
| **User** | `research_user` |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt, Singapore) |
| **PostgreSQL Version** | 15 (or latest) |
| **Plan** | **Free** |

### 2.3 Create Database

1. Click **"Create Database"**
2. Wait 2-3 minutes for provisioning
3. **IMPORTANT:** Copy the **Internal Database URL** (you'll need this!)
   - It looks like: `postgresql://research_user:xxx@xxx.oregon-postgres.render.com/research_portal`

---

## Step 3: Deploy Backend (Flask API)

### 3.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository: `research-scholars-portal`

### 3.2 Configure Backend Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `research-portal-backend` |
| **Region** | Same as database (e.g., Oregon) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt && flask db upgrade` |
| **Start Command** | `gunicorn --bind 0.0.0.0:$PORT run:app` |
| **Plan** | **Free** |

### 3.3 Add Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `FLASK_ENV` | `production` |
| `DATABASE_URL` | *Paste the Internal Database URL from Step 2.3* |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `JWT_SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `FRONTEND_URL` | `https://research-portal-frontend.onrender.com` (we'll update this later) |
| `MAIL_SERVER` | `smtp.gmail.com` (or leave blank for now) |
| `MAIL_PORT` | `587` |
| `MAIL_USE_TLS` | `True` |
| `MAIL_USERNAME` | Your Gmail (optional) |
| `MAIL_PASSWORD` | Your Gmail app password (optional) |

**To generate secret keys locally:**
```bash
# Run this twice to get two different keys
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3.4 Deploy Backend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll see logs - wait for "Build successful" and "Live"
4. Your backend URL will be: `https://research-portal-backend.onrender.com`

### 3.5 Seed the Database

After deployment, run this command to create initial users:

1. Go to your service dashboard
2. Click **"Shell"** tab
3. Run: `flask seed-db`
4. You should see test users created

---

## Step 4: Deploy Frontend (React App)

### 4.1 Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository (same one)
3. Select your repository

### 4.2 Configure Frontend Service

| Field | Value |
|-------|-------|
| **Name** | `research-portal-frontend` |
| **Region** | Same as backend |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 4.3 Add Environment Variables

Click **"Advanced"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://research-portal-backend.onrender.com/api` |

**IMPORTANT:** Replace with your actual backend URL from Step 3.4!

### 4.4 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait 5-10 minutes for deployment
3. Your frontend URL will be: `https://research-portal-frontend.onrender.com`

---

## Step 5: Update Backend CORS Settings

### 5.1 Update FRONTEND_URL Environment Variable

1. Go to your **backend service** on Render
2. Click **"Environment"** tab
3. Find `FRONTEND_URL` variable
4. Update it to: `https://research-portal-frontend.onrender.com`
5. Click **"Save Changes"**
6. Backend will auto-redeploy (takes 2-3 minutes)

---

## Step 6: Test Your Deployment

### 6.1 Open Your App

1. Go to: `https://research-portal-frontend.onrender.com`
2. You should see the login page

### 6.2 Login with Test Credentials

Use these credentials created by `flask seed-db`:

| Role | Email | Password |
|------|-------|----------|
| Scholar | scholar1@university.edu | password123 |
| Supervisor | supervisor1@university.edu | password123 |
| Dean | dean@university.edu | password123 |

### 6.3 Verify Everything Works

- ✅ Login successful
- ✅ Dashboard loads
- ✅ Can view profile
- ✅ Navigation works

---

## Important Notes

### Free Tier Limitations

⚠️ **Backend Service (Free Tier):**
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 512 MB RAM
- Shared CPU

⚠️ **Database (Free Tier):**
- 1 GB storage
- Expires after 90 days (you'll need to create a new one)
- Automatic backups NOT included

⚠️ **Frontend (Static Site):**
- Unlimited bandwidth
- Global CDN
- Always on (no spin-down)

### Custom Domain (Optional)

To use your own domain:
1. Go to your frontend service → **"Settings"** → **"Custom Domain"**
2. Add your domain (e.g., `research.iitmandi.ac.in`)
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` in backend environment variables

---

## Troubleshooting

### Issue: Backend takes long to respond
**Cause:** Free tier spins down after 15 minutes inactivity
**Solution:**
- Upgrade to paid tier ($7/month) for always-on service
- Or use a keep-alive service (ping your backend every 10 minutes)

### Issue: Database connection error
**Cause:** Wrong DATABASE_URL
**Solution:**
1. Go to database service
2. Copy **Internal Database URL**
3. Update backend environment variable
4. Redeploy backend

### Issue: CORS errors
**Cause:** Wrong FRONTEND_URL in backend
**Solution:**
1. Update `FRONTEND_URL` to exact frontend URL
2. Check `config.py` CORS settings
3. Redeploy backend

### Issue: Build fails on backend
**Cause:** Missing dependencies or wrong Python version
**Solution:**
1. Check `PYTHON_VERSION` is set to `3.11.0`
2. Verify `requirements.txt` is correct
3. Check build logs for specific error

### Issue: Frontend shows blank page
**Cause:** Wrong API URL
**Solution:**
1. Check browser console for errors
2. Verify `VITE_API_URL` environment variable
3. Rebuild frontend

---

## Maintenance

### Update Your App

When you make changes:

```bash
# Commit changes
git add .
git commit -m "Update feature XYZ"

# Push to GitHub
git push origin main
```

Render will **automatically redeploy** both frontend and backend!

### View Logs

1. Go to service dashboard
2. Click **"Logs"** tab
3. See real-time logs

### Backup Database

**Manual Backup:**
1. Go to database service
2. Click **"Manual Backup"**

**Note:** Free tier doesn't have automatic backups. For production, upgrade to paid tier.

---

## Upgrade to Paid Plans (Optional)

If your project grows:

| Service | Free | Paid |
|---------|------|------|
| **Backend** | 512MB RAM, spins down | $7/mo: 512MB, always on |
| **Database** | 1GB, 90 days | $7/mo: 1GB, always on, backups |
| **Frontend** | FREE (unlimited) | FREE |

**Total for production:** ~$14/month

---

## Security Checklist

Before going live:

- ✅ Change all default passwords
- ✅ Use strong SECRET_KEY and JWT_SECRET_KEY
- ✅ Set up email notifications (MAIL_* variables)
- ✅ Enable HTTPS (automatic on Render)
- ✅ Review CORS settings
- ✅ Set up monitoring/alerts
- ✅ Test all user roles thoroughly

---

## Next Steps

1. **Custom branding:** Update logo, colors, university name
2. **Email setup:** Configure Gmail SMTP for notifications
3. **Monitoring:** Set up error tracking (Sentry, etc.)
4. **Documentation:** Share login credentials with users
5. **Backup:** Set up regular database backups

---

## Support

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Project Issues:** Create issue on your GitHub repo

---

## Summary of Your Deployed URLs

After deployment, you'll have:

```
Frontend:  https://research-portal-frontend.onrender.com
Backend:   https://research-portal-backend.onrender.com
Database:  (internal only, accessed by backend)
```

**Congratulations! Your Research Portal is now live! 🎉**
