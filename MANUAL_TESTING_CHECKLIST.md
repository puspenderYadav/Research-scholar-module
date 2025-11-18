# Manual Testing Checklist - All Modules

## How to Use This Checklist
- [ ] = Not tested yet
- [x] = Tested and working
- [!] = Issue found

---

## 1. Backend Server

### Server Startup
- [ ] Backend starts without errors: `cd backend && python run.py`
- [ ] Database connection successful
- [ ] No migration warnings
- [ ] Server running on `http://localhost:5000`

### Database Check
```bash
cd backend
python -c "from app import create_app, db; app = create_app(); print('OK')"
```
- [ ] Database accessible
- [ ] All tables present

---

## 2. Frontend Server

### Frontend Startup
- [ ] Frontend starts without errors: `cd frontend && npm start`
- [ ] No compilation errors
- [ ] Server running on `http://localhost:3000`
- [ ] Opens in browser automatically

---

## 3. Authentication & Login

### Scholar Login
- [ ] Can login as scholar
- [ ] Dashboard loads correctly
- [ ] Navigation menu shows correct options
- [ ] Logout works

### Supervisor Login
- [ ] Can login as supervisor
- [ ] Dashboard loads correctly
- [ ] Navigation menu shows correct options
- [ ] Can see supervised scholars

### Admin/Dean Login
- [ ] Can login as Dean Academics
- [ ] Can login as DC member
- [ ] Can login as APC member
- [ ] All admin functions accessible

---

## 4. Scholar Module

### Profile
- [ ] Scholar profile displays correctly
- [ ] Enrollment number shown
- [ ] Program information correct
- [ ] Supervisor assignment shown
- [ ] Co-supervisor shown (if assigned)

### Dashboard
- [ ] Shows current status
- [ ] Displays pending tasks
- [ ] Notifications visible
- [ ] Quick actions work

---

## 5. Progress Reports

### Submission
- [ ] Scholar can upload progress report
- [ ] File upload works (PDF)
- [ ] Form validation works
- [ ] Success message shows

### Approval Workflow
- [ ] Supervisor sees pending report
- [ ] Supervisor can approve/reject
- [ ] Sequential workflow works
  - [ ] Supervisor approval
  - [ ] DC/APC approval
  - [ ] Final approval
- [ ] Status updates correctly

### Notifications
- [ ] Scholar notified when reviewed
- [ ] Supervisor notified of submission
- [ ] DC/APC notified when needed

---

## 6. Synopsis Module

### Submission
- [ ] Scholar can submit synopsis
- [ ] File upload works
- [ ] Form fields validated

### Approval Workflow
- [ ] Supervisor review works
- [ ] DC/APC review works
- [ ] Status updates correctly
- [ ] Notifications sent

---

## 7. Seminars Module

### Seminar Management
- [ ] Scholar can view seminars
- [ ] Can schedule seminar
- [ ] Seminar types displayed:
  - [ ] Pre-synopsis
  - [ ] Post-synopsis
  - [ ] Annual
- [ ] Status tracking works

### Approvals
- [ ] Supervisor can approve seminar
- [ ] Committee members notified
- [ ] Status updates correctly

---

## 8. Comprehensive Exams

### Exam Management
- [ ] Scholar can view exam status
- [ ] Exam scheduling works
- [ ] Results can be recorded
- [ ] Status tracking accurate

### Permissions
- [ ] Only authorized users can create exams
- [ ] DC/APC can update results
- [ ] Scholar can view results

---

## 9. Thesis Module (PRE-DEFENSE)

### Initial Submission
- [ ] Scholar can submit thesis
- [ ] Submission types work:
  - [ ] Initial
  - [ ] Minor Revision
  - [ ] Major Revision
- [ ] File upload works (PDF only)
- [ ] Success message displays

### Supervisor Approval
- [ ] Supervisor sees pending thesis
- [ ] Can approve/reject/request changes
- [ ] Comments field works
- [ ] Notifications sent

### External Examiners
- [ ] Supervisor can upload CSV
- [ ] CSV format validated
- [ ] Examiners created in database
- [ ] Deadline set (90 days default)
- [ ] Notification emails sent

### Examiner Reports
- [ ] Examiners receive email with link
- [ ] Can submit report via token link
- [ ] Can upload PDF report
- [ ] Recommendations recorded:
  - [ ] Accept
  - [ ] Minor revision
  - [ ] Major revision
  - [ ] Reject

### Defense Scheduling
- [ ] Shows when at least 1 examiner accepts
- [ ] Supervisor sees "Schedule Defense" button
- [ ] Can enter date, time, venue
- [ ] Defense created successfully
- [ ] Scholar and committee notified

---

## 10. Thesis Module (POST-DEFENSE) - **NEW WORKFLOW**

### Defense Completion
- [ ] Supervisor can mark defense complete
- [ ] Can select outcome:
  - [ ] Accept
  - [ ] Accept with minor revisions
  - [ ] Reject
- [ ] Comments recorded
- [ ] Status updates to "awaiting_revised_thesis"

### Scholar Post-Defense View
- [ ] Scholar sees RED priority alert
- [ ] Deadline displayed prominently
- [ ] Countdown shows correctly:
  - [ ] Shows days remaining
  - [ ] "URGENT" if ≤7 days
  - [ ] "Due TODAY" if 0 days
  - [ ] "OVERDUE" if past deadline
- [ ] Regular upload form hidden
- [ ] Can upload revised thesis PDF
- [ ] Submission successful

### Supervisor Final Review
- [ ] Supervisor sees revised thesis in pending
- [ ] Blue info box explains post-defense review
- [ ] Special buttons visible:
  - [ ] "Approve Final Revision" (green)
  - [ ] "Request Additional Changes" (orange)
- [ ] Approval routes to Dean Academics
- [ ] Notifications sent

### Dean Academics Final Approval
- [ ] Dean sees thesis in pending approvals
- [ ] Can approve for degree award
- [ ] Approval marks thesis as complete
- [ ] Sets `is_approved = True`
- [ ] Scholar notified of degree award

### Degree Award Display
- [ ] Scholar sees "🎓 DEGREE AWARDED!" badge
- [ ] Green success box displayed
- [ ] Approval date shown
- [ ] Workflow timeline shows "completed"

---

## 11. Supervisor Features

### Thesis Tracking
- [ ] Two-tab view works:
  - [ ] "Pending Reviews" tab
  - [ ] "All Scholars' Theses" tab
- [ ] Pending reviews shows correct count
- [ ] Tracking table shows all scholars
- [ ] Can see:
  - [ ] Scholar name and enrollment
  - [ ] Version number
  - [ ] Current stage
  - [ ] Status
  - [ ] Examiner progress
  - [ ] Submission date

### Defense Scheduling (from tracking)
- [ ] "Schedule Defense" button in table
- [ ] Inline form appears
- [ ] Can enter date, time, venue
- [ ] Scheduling works from tracking view

### CSV Upload (from tracking)
- [ ] "Upload Examiners" button visible
- [ ] CSV upload form appears
- [ ] Can set deadline days
- [ ] Upload processes correctly

---

## 12. Notifications

### Email Notifications
- [ ] Scholar receives emails for:
  - [ ] Progress report reviews
  - [ ] Synopsis reviews
  - [ ] Thesis reviews
  - [ ] Defense scheduled
  - [ ] Defense completed
  - [ ] Revised thesis deadline
  - [ ] Degree awarded
- [ ] Supervisor receives emails for:
  - [ ] New submissions
  - [ ] Examiner reports submitted
  - [ ] Defense ready to schedule
- [ ] Dean receives emails for:
  - [ ] Final approvals needed

### In-App Notifications
- [ ] Notification bell shows count
- [ ] Can view notifications
- [ ] Can mark as read
- [ ] Links work correctly

---

## 13. Committee Members

### Committee Assignments
- [ ] Scholar can view committee
- [ ] Committee members listed
- [ ] Roles shown correctly
- [ ] Can add/remove members (authorized users)

### Committee Member View
- [ ] Can see assigned scholars
- [ ] Can review progress reports
- [ ] Can approve/reject
- [ ] Notifications received

---

## 14. Leave Applications (Travel Grants)

### Application Submission
- [ ] Scholar can apply for travel grant
- [ ] Form fields work:
  - [ ] Conference name
  - [ ] Dates
  - [ ] Location
  - [ ] Budget
- [ ] File uploads work (invitation, abstract)
- [ ] Submission successful

### Approval Workflow
- [ ] Supervisor approval works
- [ ] Committee member approval works
- [ ] Dean approval works
- [ ] Status tracking accurate

---

## 15. UI/UX Check

### Responsive Design
- [ ] Works on desktop
- [ ] Works on tablet
- [ ] Works on mobile
- [ ] No layout breaks

### Navigation
- [ ] All menu items clickable
- [ ] Breadcrumbs work
- [ ] Back button works
- [ ] Page titles correct

### Forms
- [ ] Field validation works
- [ ] Error messages clear
- [ ] Success messages show
- [ ] Required fields marked

### Tables
- [ ] Data displays correctly
- [ ] Sorting works (if applicable)
- [ ] Pagination works (if applicable)
- [ ] Filters work (if applicable)

---

## 16. Error Handling

### Network Errors
- [ ] Graceful handling of API errors
- [ ] User-friendly error messages
- [ ] No console errors in browser

### Validation Errors
- [ ] Form validation clear
- [ ] Server validation displays
- [ ] Helpful error messages

### 404/403 Errors
- [ ] Unauthorized access handled
- [ ] Not found pages work
- [ ] Redirects work correctly

---

## 17. Performance

### Page Load
- [ ] Pages load quickly (<2 seconds)
- [ ] No excessive API calls
- [ ] Images load properly
- [ ] No console warnings

### File Uploads
- [ ] PDF uploads work
- [ ] CSV uploads work
- [ ] Progress indicator shows
- [ ] Large files handled

---

## 18. Security

### Authentication
- [ ] Cannot access without login
- [ ] Session timeout works
- [ ] Re-login required after timeout

### Authorization
- [ ] Role-based access works
- [ ] Cannot access unauthorized pages
- [ ] API endpoints protected

### Data Privacy
- [ ] Users see only their data
- [ ] Supervisors see only their scholars
- [ ] Admins see all data

---

## 19. Database Integrity

### Relationships
- [ ] Scholar → Supervisor link works
- [ ] Thesis → Scholar link works
- [ ] Committee → Scholar link works
- [ ] No orphaned records

### Data Consistency
- [ ] Status updates correctly
- [ ] Timestamps accurate
- [ ] Counts match reality

---

## 20. Post-Defense Workflow (Detailed Test)

### Setup (One-time)
1. [ ] Have a thesis with completed defense
2. [ ] Defense outcome set to "Accept"
3. [ ] Deadline should be 30 days from defense date

### Scholar Experience
1. [ ] Login as scholar
2. [ ] Navigate to Thesis page
3. [ ] **Verify RED alert box visible**
4. [ ] **Verify deadline shows in format: "Friday, December 14, 2025"**
5. [ ] **Verify countdown shows: "X days remaining"**
6. [ ] **Verify if ≤7 days: Shows "⚠️ URGENT"**
7. [ ] **Verify regular upload form is HIDDEN**
8. [ ] Select a PDF file
9. [ ] **Verify file name shows in green with checkmark**
10. [ ] Click "Submit Revised Thesis"
11. [ ] **Verify success message**
12. [ ] **Verify page refreshes and shows new status**

### Supervisor Experience
1. [ ] Login as supervisor
2. [ ] Navigate to Thesis page
3. [ ] Click "Pending Reviews" tab
4. [ ] **Verify revised thesis appears in list**
5. [ ] **Verify blue info box: "Post-Defense Final Review"**
6. [ ] **Verify buttons are green "Approve Final Revision"**
7. [ ] Click "Approve Final Revision"
8. [ ] **Verify confirmation/success message**
9. [ ] **Verify thesis removed from pending reviews**

### Dean Academics Experience
1. [ ] Login as Dean Academics
2. [ ] Navigate to Approvals/Thesis page
3. [ ] **Verify thesis appears in pending approvals**
4. [ ] **Verify shows as coming from supervisor**
5. [ ] Click "Approve"
6. [ ] **Verify success message**
7. [ ] **Verify degree awarded notification sent**

### Final Verification (Scholar)
1. [ ] Login as scholar
2. [ ] Navigate to Thesis page
3. [ ] **Verify "🎓 DEGREE AWARDED!" badge visible**
4. [ ] **Verify green success box**
5. [ ] **Verify approval date shown**
6. [ ] **Verify timeline shows "COMPLETED"**

---

## Issues Found

### Critical Issues
```
Issue #: _____
Description:
Steps to Reproduce:
Expected:
Actual:
```

### Minor Issues
```
Issue #: _____
Description:
Priority: Low/Medium/High
```

---

## Overall System Status

### Backend
- [ ] All modules working
- [ ] No critical errors
- [ ] Database stable

### Frontend
- [ ] All pages load
- [ ] No compilation errors
- [ ] UI responsive

### Integration
- [ ] Frontend-Backend communication works
- [ ] All workflows functional
- [ ] Notifications working

---

## Sign-off

**Tested by:** ___________________
**Date:** ___________________
**Overall Status:** Pass / Fail / Needs Work

**Notes:**
```
[Add any additional notes here]
```

---

*End of Checklist*
