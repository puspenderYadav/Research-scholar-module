# Render Deployment Checklist

Use this checklist to deploy your Research Portal to Render.com

## Pre-Deployment

- [ ] GitHub account created
- [ ] Render.com account created (FREE)
- [ ] Code pushed to GitHub repository
- [ ] Tested locally (both backend and frontend work)

---

## 1. Create Database (5 minutes)

- [ ] Login to Render Dashboard: https://dashboard.render.com
- [ ] Click **New +** → **PostgreSQL**
- [ ] Name: `research-portal-db`
- [ ] Database: `research_portal`
- [ ] User: `research_user`
- [ ] Plan: **Free**
- [ ] Click **Create Database**
- [ ] **Copy Internal Database URL** (save it for next step!)

---

## 2. Deploy Backend (10 minutes)

- [ ] Click **New +** → **Web Service**
- [ ] Connect GitHub repository
- [ ] Select repository
- [ ] Configure:
  - [ ] Name: `research-portal-backend`
  - [ ] Root Directory: `backend`
  - [ ] Runtime: `Python 3`
  - [ ] Build Command: `pip install -r requirements.txt && flask db upgrade`
  - [ ] Start Command: `gunicorn --bind 0.0.0.0:$PORT run:app`
  - [ ] Plan: **Free**

### Environment Variables:

- [ ] `PYTHON_VERSION` = `3.11.0`
- [ ] `FLASK_ENV` = `production`
- [ ] `DATABASE_URL` = *[Paste Database URL from step 1]*
- [ ] `SECRET_KEY` = *[Generate: run `python -c "import secrets; print(secrets.token_urlsafe(32))"`]*
- [ ] `JWT_SECRET_KEY` = *[Generate another key]*
- [ ] `FRONTEND_URL` = `https://research-portal-frontend.onrender.com`

- [ ] Click **Create Web Service**
- [ ] Wait for deployment (~5-10 minutes)
- [ ] **Copy backend URL** (e.g., `https://research-portal-backend.onrender.com`)

### Initialize Admin Accounts:

- [ ] Go to backend service → **Shell** tab
- [ ] Run: `flask init-admin-accounts`
- [ ] Verify Dean Academics and AD Research accounts created

### Seed Database (Optional - for test data):

- [ ] Run: `flask seed-db`
- [ ] Verify test users and sample data created

---

## 3. Deploy Frontend (10 minutes)

- [ ] Click **New +** → **Static Site**
- [ ] Connect GitHub repository (same one)
- [ ] Configure:
  - [ ] Name: `research-portal-frontend`
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Publish Directory: `dist`

### Environment Variables:

- [ ] `VITE_API_URL` = `https://research-portal-backend.onrender.com/api` *[Use your backend URL]*

- [ ] Click **Create Static Site**
- [ ] Wait for deployment (~5-10 minutes)
- [ ] **Copy frontend URL** (e.g., `https://research-portal-frontend.onrender.com`)

---

## 4. Update Backend Settings (2 minutes)

- [ ] Go to backend service → **Environment** tab
- [ ] Update `FRONTEND_URL` to your actual frontend URL
- [ ] Click **Save Changes**
- [ ] Wait for auto-redeploy (~2-3 minutes)

---

## 5. Test Deployment (5 minutes)

- [ ] Open frontend URL in browser
- [ ] Login page loads correctly
- [ ] Try logging in with Dean Academics:
  - Email: `dean.academics@iitmandi.ac.in`
  - Password: `Dean@123`
  - Role: **Dean Academics**
- [ ] Dashboard loads
- [ ] Try logging in with AD Research:
  - Email: `ad.research@iitmandi.ac.in`
  - Password: `ADResearch@123`
  - Role: **AD Research**
- [ ] Profile page works
- [ ] Navigation works
- [ ] No console errors

---

## Post-Deployment

- [ ] Change default passwords for production users
- [ ] Update branding (logo, university name)
- [ ] Configure email notifications (optional)
- [ ] Share login credentials with users
- [ ] Set up monitoring/alerts
- [ ] Add custom domain (optional)

---

## Your Deployment URLs

```
Frontend:  https://______________________.onrender.com
Backend:   https://______________________.onrender.com
Database:  [Internal only]
```

---

## Quick Commands

### Generate Secret Keys:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Seed Database (via Render Shell):
```bash
flask seed-db
```

### View Logs:
Go to service → **Logs** tab

---

## Fixed Admin Credentials

**Production admin accounts (always available):**

| Role | Email | Password |
|------|-------|----------|
| **Dean Academics** | dean.academics@iitmandi.ac.in | Dean@123 |
| **AD Research** | ad.research@iitmandi.ac.in | ADResearch@123 |

## Default Test Credentials

After running `flask seed-db`:

| Role | Email | Password |
|------|-------|----------|
| Scholar 1 (PhD) | scholar1@university.edu | password123 |
| Scholar 2 (MSc) | scholar2@university.edu | password123 |
| Supervisor 1 | supervisor1@university.edu | password123 |
| Supervisor 2 | supervisor2@university.edu | password123 |
| School Chair | chair.cs@university.edu | password123 |

---

## Troubleshooting

### Backend slow to respond?
- Free tier spins down after 15 min inactivity
- First request takes 30-60 seconds

### CORS errors?
- Check `FRONTEND_URL` in backend environment variables
- Must match exact frontend URL

### Build failed?
- Check deployment logs
- Verify `PYTHON_VERSION` = `3.11.0`
- Check `requirements.txt` has all dependencies

---

**Total Time:** ~30 minutes
**Total Cost:** $0/month (FREE tier)

**Need help?** See [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md) for detailed instructions.
