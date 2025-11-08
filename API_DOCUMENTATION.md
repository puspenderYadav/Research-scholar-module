# Research Scholars Management Portal - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### POST /auth/login
Authenticate user and receive access tokens.

**Request:**
```json
{
  "email": "user@university.edu",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@university.edu",
    "name": "John Doe",
    "role": "scholar",
    "is_active": true
  },
  "profile": {
    "enrollment_number": "PHD2023001",
    "program": "PhD",
    "admission_date": "2023-08-01"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### GET /auth/me
Get current authenticated user's information.

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "scholar1@university.edu",
    "name": "Alice Johnson",
    "role": "scholar"
  },
  "profile": {
    "enrollment_number": "PHD2023001",
    "program": "PhD",
    "school_id": 1,
    "supervisor_id": 1
  }
}
```

### POST /auth/change-password
Change user's password.

**Request:**
```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

### POST /auth/register-scholar
Register a new scholar (Dean Academics only).

**Request:**
```json
{
  "email": "newscholar@university.edu",
  "name": "New Scholar",
  "enrollment_number": "PHD2024001",
  "program": "PhD",
  "school_id": 1,
  "admission_date": "2024-08-01",
  "research_area": "Machine Learning"
}
```

## Scholars

### GET /scholars/
Get list of scholars (filtered by role).

**Query Parameters:**
- `program` (optional): Filter by program (PhD, MSc)
- `status` (optional): Filter by status (active, completed, withdrawn)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "enrollment_number": "PHD2023001",
    "program": "PhD",
    "user": {
      "name": "Alice Johnson",
      "email": "scholar1@university.edu"
    },
    "supervisor": {
      "name": "Dr. John Supervisor"
    }
  }
]
```

### GET /scholars/{id}
Get specific scholar details.

### PUT /scholars/{id}
Update scholar profile.

**Request:**
```json
{
  "research_area": "Deep Learning and Computer Vision",
  "thesis_title": "Advanced Neural Networks for Image Recognition"
}
```

### GET /scholars/my-profile
Get current scholar's profile (Scholar role only).

### POST /scholars/request-supervisor-change
Request supervisor change (Scholar role only).

**Request:**
```json
{
  "new_supervisor_id": 2,
  "reason": "Research area alignment"
}
```

## Supervisors

### GET /supervisors/
Get list of all supervisors.

### GET /supervisors/{id}
Get specific supervisor details.

## Committees

### GET /committees/scholar/{scholar_id}
Get committee for a scholar.

**Response (200 OK):**
```json
{
  "id": 1,
  "scholar_id": 1,
  "dc_members": [
    {
      "id": 1,
      "supervisor": {
        "name": "Dr. Jane Smith",
        "designation": "Associate Professor"
      },
      "member_type": "DC"
    }
  ],
  "adc_members": []
}
```

### POST /committees/
Create committee for scholar (Dean Academics only).

**Request:**
```json
{
  "scholar_id": 1,
  "dc_members": [2, 3, 4],
  "adc_members": [5]
}
```

## Exams

### GET /exams/scholar/{scholar_id}
Get exams for a scholar.

### POST /exams/
Schedule a comprehensive exam (Supervisor/Dean only).

**Request:**
```json
{
  "scholar_id": 1,
  "exam_type": "comprehensive",
  "scheduled_date": "2024-12-15T10:00:00",
  "due_date": "2024-12-01T23:59:59",
  "venue": "Room 301, CS Building"
}
```

### PUT /exams/{id}
Update exam details or results.

**Request:**
```json
{
  "status": "completed",
  "result": "pass",
  "marks": 85.5,
  "remarks": "Excellent performance"
}
```

## Seminars

### GET /seminars/scholar/{scholar_id}
Get seminars for a scholar.

### POST /seminars/
Create/Schedule a seminar.

**Request:**
```json
{
  "scholar_id": 1,
  "title": "Deep Learning for Computer Vision",
  "seminar_type": "open_seminar_1",
  "scheduled_date": "2024-11-20T14:00:00",
  "duration_minutes": 60,
  "venue": "Auditorium A",
  "abstract": "This seminar covers recent advances in deep learning..."
}
```

### PUT /seminars/{id}
Update seminar details.

## Synopsis

### GET /synopsis/scholar/{scholar_id}
Get synopsis submissions for a scholar.

### POST /synopsis/
Submit synopsis (Scholar only).

**Request (multipart/form-data):**
- `file`: PDF file

**Response (201 Created):**
```json
{
  "id": 1,
  "scholar_id": 1,
  "file_name": "synopsis_v1.pdf",
  "version": 1,
  "status": "submitted",
  "submission_date": "2024-11-07T10:30:00"
}
```

### POST /synopsis/{id}/review
Review synopsis submission (Supervisor/Dean only).

**Request:**
```json
{
  "status": "changes_requested",
  "feedback": "Please expand the literature review section and add more recent references."
}
```

## Progress Reports

### GET /progress-reports/scholar/{scholar_id}
Get progress reports for a scholar.

### POST /progress-reports/
Submit progress report (Scholar only).

**Request (multipart/form-data):**
- `file`: PDF file
- `report_period_start`: "2024-08-01"
- `report_period_end`: "2024-10-31"

### POST /progress-reports/{id}/review
Review progress report (Supervisor/Dean only).

**Request:**
```json
{
  "status": "accepted",
  "feedback": "Good progress. Keep up the good work.",
  "rating": "excellent"
}
```

## Thesis

### GET /thesis/scholar/{scholar_id}
Get thesis submissions for a scholar.

### POST /thesis/
Submit thesis (Scholar only).

**Request (multipart/form-data):**
- `file`: PDF file
- `submission_type`: "initial" | "revised" | "final"

### POST /thesis/{id}/schedule-defense
Schedule thesis defense (Supervisor/Dean only).

**Request:**
```json
{
  "defense_date": "2025-03-15T10:00:00",
  "defense_venue": "Conference Room A"
}
```

## Travel Grants

### GET /travel-grants/
Get travel grants (filtered by role).

### GET /travel-grants/{id}
Get travel grant details.

### POST /travel-grants/
Create new travel grant application (Scholar only).

**Request:**
```json
{
  "purpose": "Present research paper",
  "destination": "New York, USA",
  "conference_name": "IEEE Conference on Computer Vision 2025",
  "start_date": "2025-06-01",
  "end_date": "2025-06-05",
  "amount_requested": 2500.00
}
```

### POST /travel-grants/{id}/approve
Approve/reject travel grant at current stage.

**Request:**
```json
{
  "decision": "approved",
  "comments": "Approved for attending international conference."
}
```

**Decision Values:**
- `approved`: Approve and move to next stage
- `rejected`: Reject the application
- `changes_requested`: Request changes from scholar

### GET /travel-grants/pending
Get travel grants pending approval for current user.

## Notifications

### GET /notifications/
Get all notifications for current user.

**Query Parameters:**
- `limit` (optional, default: 50): Maximum number of notifications

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Synopsis Submitted",
    "message": "Scholar PHD2023001 has submitted synopsis (v1)",
    "notification_type": "submission",
    "priority": "high",
    "is_read": false,
    "created_at": "2024-11-07T10:30:00"
  }
]
```

### GET /notifications/unread
Get unread notification count.

**Response (200 OK):**
```json
{
  "unread_count": 5
}
```

### POST /notifications/{id}/read
Mark notification as read.

### POST /notifications/mark-all-read
Mark all notifications as read.

## Calendar

### GET /calendar/events
Get calendar events within date range.

**Query Parameters:**
- `start_date` (optional): ISO format date (default: today)
- `end_date` (optional): ISO format date (default: start_date + 90 days)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "type": "exam",
    "title": "Comprehensive Exam",
    "start": "2024-12-15T10:00:00",
    "venue": "Room 301",
    "status": "scheduled"
  },
  {
    "id": 2,
    "type": "seminar",
    "title": "Deep Learning Seminar",
    "start": "2024-11-20T14:00:00",
    "venue": "Auditorium A",
    "status": "scheduled"
  }
]
```

## Dashboard

### GET /dashboard/scholar
Get dashboard data for scholar (Scholar role only).

**Response (200 OK):**
```json
{
  "scholar": {
    "enrollment_number": "PHD2023001",
    "program": "PhD",
    "supervisor": {
      "name": "Dr. John Supervisor"
    }
  },
  "stats": {
    "exams_count": 2,
    "seminars_count": 1,
    "travel_grants_count": 1,
    "pending_exams": 1,
    "pending_seminars": 0
  }
}
```

### GET /dashboard/supervisor
Get dashboard data for supervisor (Supervisor role only).

**Response (200 OK):**
```json
{
  "supervisor": {
    "employee_id": "EMP001",
    "designation": "Professor"
  },
  "scholars": [
    {
      "enrollment_number": "PHD2023001",
      "name": "Alice Johnson",
      "program": "PhD"
    }
  ],
  "stats": {
    "total_scholars": 5,
    "pending_synopsis_reviews": 2,
    "pending_progress_reviews": 3
  }
}
```

### GET /dashboard/dean
Get dashboard data for Dean/AD Research (Dean/AD Research roles only).

**Response (200 OK):**
```json
{
  "stats": {
    "total_scholars": 50,
    "total_supervisors": 15,
    "scholars_by_program": {
      "PhD": 35,
      "MSc": 15
    },
    "grants_by_status": {
      "submitted": 5,
      "under_review": 3,
      "approved": 10,
      "rejected": 2
    }
  }
}
```

## Error Responses

### 400 Bad Request
Invalid request data.

```json
{
  "error": "Email and password are required"
}
```

### 401 Unauthorized
Authentication failed or token invalid.

```json
{
  "error": "Invalid email or password"
}
```

### 403 Forbidden
Insufficient permissions.

```json
{
  "error": "Access denied",
  "message": "This endpoint requires one of these roles: dean_academics, ad_research"
}
```

### 404 Not Found
Resource not found.

```json
{
  "error": "Scholar profile not found"
}
```

### 500 Internal Server Error
Server error.

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per minute per IP for general endpoints
- 10 requests per minute for authentication endpoints

## Pagination

Currently not implemented. Will be added for large datasets with:
- `page` parameter (default: 1)
- `per_page` parameter (default: 20, max: 100)

## Webhook Support

Not currently implemented. Future enhancement for real-time notifications.

---

**Last Updated:** November 2025
