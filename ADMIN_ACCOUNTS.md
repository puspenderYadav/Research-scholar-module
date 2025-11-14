# Admin Accounts Setup

## Overview

The Research Scholars Management Portal includes pre-configured admin accounts for Dean Academics and AD Research roles. These accounts are fixed and secure, using IIT Mandi email addresses.

---

## Fixed Admin Accounts

### Dean Academics
- **Email:** `dean.academics@iitmandi.ac.in`
- **Password:** `Dean@123`
- **Role:** `dean_academics`
- **Name:** Dean Academics

### AD Research
- **Email:** `ad.research@iitmandi.ac.in`
- **Password:** `ADResearch@123`
- **Role:** `ad_research`
- **Name:** AD Research

---

## Creating Admin Accounts

### Method 1: Using Flask CLI Command (Recommended)

After setting up the database, run:

```bash
flask init-admin-accounts
```

**Features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Passwords are securely hashed using bcrypt
- ✅ Checks if accounts exist before creating
- ✅ Displays credentials after creation
- ✅ Production-ready and secure

**Output:**
```
Initializing admin accounts...
✓ Created Dean Academics account: dean.academics@iitmandi.ac.in
✓ Created AD Research account: ad.research@iitmandi.ac.in

=== Admin Account Credentials ===
Dean Academics: dean.academics@iitmandi.ac.in / Dean@123
AD Research: ad.research@iitmandi.ac.in / ADResearch@123

Admin accounts initialized successfully!
```

### Method 2: Using Seed Database Command

If you want to create admin accounts along with test data:

```bash
flask seed-db
```

This will:
- Create admin accounts (Dean Academics and AD Research)
- Create sample schools
- Create test supervisors, scholars, and committees
- Display all test credentials

---

## Security Features

### Password Hashing
- Passwords are hashed using **Werkzeug's generate_password_hash**
- Uses **bcrypt** algorithm for secure storage
- Passwords are never stored in plaintext

### Account Protection
- Accounts are marked as `is_active=True` by default
- Email addresses are unique (indexed in database)
- Role-based access control enforced

### Idempotent Creation
- Running `flask init-admin-accounts` multiple times is safe
- Existing accounts are not modified or duplicated
- Command checks database before creation

---

## Usage

### Login Process

1. Go to the login page
2. Enter credentials:
   - **Dean Academics:** `dean.academics@iitmandi.ac.in` / `Dean@123`
   - **AD Research:** `ad.research@iitmandi.ac.in` / `ADResearch@123`
3. Select the appropriate role from dropdown
4. Click login

### Available Features by Role

**Dean Academics:**
- View all progress reports
- Approve final stage progress reports
- View scholar profiles
- Access comprehensive reports
- Manage academic workflows

**AD Research:**
- Approve travel grant applications
- View all scholars and supervisors
- Access research office dashboard
- Manage research-related approvals
- View comprehensive statistics

---

## Deployment Guide

### Local Development

```bash
cd backend
flask init-db
flask init-admin-accounts
flask run
```

### Production (Render.com)

1. Deploy backend service
2. Go to backend service → **Shell** tab
3. Run: `flask init-admin-accounts`
4. Verify accounts created
5. Test login from frontend

---

## Testing

A test script is provided to verify admin accounts:

```bash
cd backend
python test_admin_accounts.py
```

**Output:**
```
=== Admin Accounts Verification ===

✓ Dean Academics Found:
  Email: dean.academics@iitmandi.ac.in
  Name: Dean Academics
  Role: dean_academics
  Is Active: True
  Password Hash Exists: True
  Password 'Dean@123' Correct: True

✓ AD Research Found:
  Email: ad.research@iitmandi.ac.in
  Name: AD Research
  Role: ad_research
  Is Active: True
  Password Hash Exists: True
  Password 'ADResearch@123' Correct: True
```

---

## Password Policy

### Current Settings
- Minimum length: 6 characters (configured in backend)
- Must contain: letters and numbers
- Special characters allowed

### Recommended Changes for Production
1. Increase minimum length to 12 characters
2. Require uppercase, lowercase, numbers, and special characters
3. Implement password expiry (90 days)
4. Add password history (prevent reuse)
5. Enable multi-factor authentication (MFA)

---

## Modifying Credentials

### Changing Passwords

To change admin passwords, you can:

1. **Via Flask Shell:**
```bash
flask shell
>>> dean = User.query.filter_by(email='dean.academics@iitmandi.ac.in').first()
>>> dean.set_password('NewSecurePassword123!')
>>> db.session.commit()
```

2. **Via Code:**
Modify [run.py](backend/run.py) lines 77 and 94:
```python
dean.set_password('YourNewPassword')
ad_research.set_password('YourNewPassword')
```

### Changing Email Addresses

Modify [run.py](backend/run.py) lines 67 and 84:
```python
dean_email = 'new.dean@iitmandi.ac.in'
ad_research_email = 'new.adresearch@iitmandi.ac.in'
```

Then run:
```bash
flask init-admin-accounts
```

---

## Troubleshooting

### Account Already Exists
**Issue:** Running `flask init-admin-accounts` shows "already exists"

**Solution:** This is normal behavior. The command is idempotent and won't create duplicates.

### Login Fails with Correct Credentials
**Issue:** Admin login returns 401 Unauthorized

**Checks:**
1. Verify accounts exist: `flask shell` → `User.query.filter_by(role='dean_academics').all()`
2. Test password: `dean.check_password('Dean@123')`
3. Check database connection
4. Verify JWT_SECRET_KEY is set

### Password Not Working
**Issue:** Password verification fails

**Solution:**
```bash
flask shell
>>> dean = User.query.filter_by(email='dean.academics@iitmandi.ac.in').first()
>>> dean.set_password('Dean@123')
>>> db.session.commit()
```

---

## Security Recommendations

### For Production Deployment

1. **Change Default Passwords Immediately**
   - Use strong, unique passwords
   - Store in secure password manager
   - Share only with authorized personnel

2. **Enable HTTPS**
   - Render.com provides free SSL
   - Ensure all traffic uses HTTPS

3. **Environment Variables**
   - Store credentials in environment variables
   - Never commit passwords to Git
   - Use secret management tools

4. **Audit Logging**
   - Log all admin actions
   - Monitor for suspicious activity
   - Set up alerts for failed login attempts

5. **Regular Backups**
   - Backup database regularly
   - Test restore procedures
   - Keep backups secure and encrypted

---

## Files Modified

- [backend/run.py](backend/run.py) - Added `init_admin_accounts` CLI command
- [backend/test_admin_accounts.py](backend/test_admin_accounts.py) - Test script
- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Updated with admin info
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Added init step

---

## Support

For issues or questions:
1. Check [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)
2. Review [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. See [SETUP_GUIDE.md](SETUP_GUIDE.md) for local development

---

**Last Updated:** 2025-01-14
**Version:** 1.0
**Status:** Production Ready ✅
