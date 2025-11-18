# Synopsis Submission & Approval Workflow - Implementation Guide

## Overview
The synopsis submission system has been implemented with a sequential approval workflow that tracks the progress through multiple stages of review.

## Approval Workflow

The synopsis goes through the following stages in sequence:

1. **Supervisor** → Approve/Reject
2. **DC/APC Committee** → All members must approve
3. **School Chair** → Approve/Reject
4. **Associate Dean Research** → Approve/Reject
5. **Dean Academics** → Final Approve/Reject

### Key Features

✅ **Sequential Approval** - Each stage must be approved before moving to the next
✅ **Rejection at Any Stage** - If rejected at any stage, the entire request is terminated
✅ **Committee Consensus** - DC/APC stage requires ALL committee members to approve
✅ **Real-time Notifications** - Scholars and reviewers receive notifications at each stage
✅ **Progress Tracking** - Scholars can track their submission through each stage
✅ **Version Control** - Multiple synopsis versions can be submitted

## Backend Implementation

### Models (`backend/app/models/synopsis.py`)

**Synopsis Model:**
- Tracks overall submission status
- Maintains current approval stage
- Stores file information and version
- Links to scholar and approvals

**SynopsisApproval Model:**
- Records each approval/rejection decision
- Stores comments from reviewers
- Tracks timestamps for audit trail
- Links approvers to their decisions

### API Endpoints (`backend/app/routes/synopsis.py`)

#### For Scholars:
- `POST /api/synopsis/submit` - Submit a new synopsis
- `GET /api/synopsis/my-synopsis` - Get all submitted synopses with tracking info
- `GET /api/synopsis/<id>/download` - Download submitted file

#### For Reviewers:
- `GET /api/synopsis/pending-reviews` - Get synopses pending your review
- `POST /api/synopsis/<id>/approve` - Approve, reject, or request changes

### Workflow Logic

```python
# Approval flow stages
supervisor → dc_apc → school_chair → ad_research → dean_academics → completed

# Status values
- with_supervisor: Pending supervisor review
- with_dc_apc: Pending DC/APC committee review
- with_school_chair: Pending school chair review
- with_ad_research: Pending AD Research review
- with_dean: Pending Dean Academics review
- approved: Fully approved
- rejected: Rejected at any stage
- changes_requested: Revisions required
```

### Special Handling for DC/APC Stage

The DC/APC stage requires **unanimous approval** from all committee members:
- Each DC and APC member must individually approve
- System tracks which members have approved
- Only moves to next stage when ALL members approve
- If ANY member rejects, the entire synopsis is rejected

## Frontend Implementation

### Component: `SynopsisUploadTracker.jsx`

Located at: `frontend/src/components/SynopsisUploadTracker.jsx`

**Features:**
1. **File Upload Interface**
   - Accepts PDF, DOC, DOCX files
   - Max file size: 10MB
   - Drag-and-drop support

2. **Progress Visualization**
   - Visual timeline showing all approval stages
   - Current stage highlighted
   - Completed stages marked with checkmarks
   - Pending stages shown as greyed out

3. **Submission History**
   - Lists all synopsis submissions with versions
   - Shows status badges (Approved, Rejected, Under Review, etc.)
   - Displays detailed approval tracking for each submission
   - Download option for submitted files

### Integration with Scholar Profile

The component can be integrated into the Scholar Profile page by importing and rendering it:

```jsx
import SynopsisUploadTracker from '../components/SynopsisUploadTracker';

// In ScholarProfile component:
<SynopsisUploadTracker scholarId={profile.id} />
```

## Rejection Handling

When a synopsis is rejected at any stage:

1. **Status Update**:
   - `status` → 'rejected'
   - `current_stage` → 'rejected'

2. **Scholar Notification**:
   - Title: "Synopsis Rejected"
   - Message includes stage name and rejection reason
   - Type: 'synopsis_rejected'

3. **Workflow Termination**:
   - No further approvals can be made
   - Scholar must submit a new version

## Notifications

### Scholars Receive Notifications When:
- Synopsis is submitted successfully
- Each stage approves and advances
- Submission is fully approved
- Rejection occurs at any stage
- Changes are requested

### Reviewers Receive Notifications When:
- New synopsis reaches their approval stage
- They are assigned as DC/APC member for a synopsis

## API Services Updated

### `frontend/src/services/api.js`

Added the following methods to `synopsisAPI`:
```javascript
getMySynopses: () => api.get('/synopsis/my-synopsis')
submit: (formData) => api.post('/synopsis/submit', formData)
approve: (id, data) => api.post(`/synopsis/${id}/approve`, data)
download: (id) => api.get(`/synopsis/${id}/download`, { responseType: 'blob' })
```

## Database Schema

### Synopsis Table
- id
- scholar_id (FK)
- file_path
- file_name
- version
- status
- current_stage
- is_approved
- approved_at
- submission_date
- created_at, updated_at

### Synopsis Approvals Table
- id
- synopsis_id (FK)
- stage
- approver_id (FK to users)
- approver_role
- committee_member_id (FK, nullable)
- decision (pending/approved/rejected/changes_requested)
- comments
- submitted_at
- reviewed_at
- created_at, updated_at

## Testing the Workflow

### As a Scholar:
1. Navigate to your profile or synopsis page
2. Upload a synopsis document (PDF/DOC/DOCX)
3. View submission status and approval progress
4. Track which stage your synopsis is currently at
5. Receive notifications as it progresses

### As a Supervisor:
1. Receive notification when student submits synopsis
2. View pending synopsis reviews
3. Approve, reject, or request changes
4. If approved, synopsis moves to DC/APC stage

### As DC/APC Member:
1. Receive notification when synopsis reaches committee stage
2. Review and approve/reject independently
3. System waits for ALL committee members to approve
4. If all approve, moves to School Chair

### As School Chair:
1. Receive notification when DC/APC approves
2. Review and approve/reject
3. If approved, moves to AD Research

### As Associate Dean Research:
1. Receive notification when School Chair approves
2. Review and approve/reject
3. If approved, moves to Dean Academics

### As Dean Academics:
1. Receive notification when AD Research approves
2. Final review and approval
3. If approved, synopsis is fully approved

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── synopsis.py          # Synopsis & SynopsisApproval models
│   └── routes/
│       └── synopsis.py           # Synopsis API endpoints

frontend/
├── src/
│   ├── components/
│   │   └── SynopsisUploadTracker.jsx  # Upload & tracking component
│   ├── services/
│   │   └── api.js                # Updated with synopsis API methods
│   └── pages/
│       └── ScholarProfile.jsx     # Can integrate the component here
```

## Future Enhancements

1. **Email Notifications**: Send email alerts in addition to in-app notifications
2. **Deadline Tracking**: Set deadlines for each approval stage
3. **Bulk Approval**: Allow reviewers to approve multiple synopses at once
4. **Analytics Dashboard**: Track average approval time per stage
5. **Comments Thread**: Allow back-and-forth discussion between scholar and reviewers
6. **Mobile App**: Extend functionality to mobile platforms

## Troubleshooting

### Synopsis not moving to next stage
- Check if all DC/APC members have approved (if at that stage)
- Verify notification service is working
- Check database for approval records

### File upload failing
- Verify file size is under 10MB
- Check file type is PDF, DOC, or DOCX
- Ensure upload folder has write permissions

### Notifications not received
- Check notification service is initialized
- Verify user ID is correct in notification creation
- Check database for notification records

## Contact & Support

For issues or questions about the synopsis workflow:
- Check the application logs for detailed error messages
- Review the database for approval status and timestamps
- Contact the system administrator for access issues
