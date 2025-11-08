# Research Portal - Backend

Flask-based REST API backend for the Research Scholars Management Portal.

## Tech Stack

- **Flask 3.0** - Web framework
- **SQLAlchemy 3.1** - ORM
- **PostgreSQL** - Database
- **Flask-JWT-Extended 4.5** - JWT authentication
- **Flask-Mail 0.9** - Email notifications
- **Flask-Migrate 4.0** - Database migrations

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Application factory
│   ├── models/                  # Database models
│   │   ├── user.py
│   │   ├── scholar.py
│   │   ├── supervisor.py
│   │   ├── committee.py
│   │   ├── exam.py
│   │   ├── seminar.py
│   │   ├── synopsis.py
│   │   ├── progress_report.py
│   │   ├── thesis.py
│   │   ├── travel_grant.py
│   │   ├── notification.py
│   │   └── school.py
│   ├── routes/                  # API endpoints
│   │   ├── auth.py
│   │   ├── scholars.py
│   │   ├── supervisors.py
│   │   ├── committees.py
│   │   ├── exams.py
│   │   ├── seminars.py
│   │   ├── synopsis.py
│   │   ├── progress.py
│   │   ├── thesis.py
│   │   ├── travel_grants.py
│   │   ├── notifications.py
│   │   ├── calendar.py
│   │   └── dashboard.py
│   ├── utils/                   # Utility modules
│   │   ├── decorators.py       # RBAC decorators
│   │   ├── file_handler.py     # File operations
│   │   ├── notification_service.py
│   │   └── email_service.py
│   └── static/                  # Static files
│       └── uploads/             # File storage
├── migrations/                  # Database migrations
├── config.py                    # Configuration
├── run.py                       # Application entry point
├── requirements.txt             # Python dependencies
└── .env.example                 # Environment template
```

## Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip
- Virtual environment tool (venv)

### Installation

1. **Create virtual environment:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Setup database:**

```bash
# Create PostgreSQL database
createdb research_portal

# Or using psql
psql -U postgres
CREATE DATABASE research_portal;
\q
```

4. **Configure environment:**

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/research_portal
SECRET_KEY=your-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-change-this
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

5. **Initialize database:**

```bash
# Run migrations
flask db upgrade

# Load sample data
flask seed-db
```

6. **Start the server:**

```bash
python run.py
```

API will be available at: **http://localhost:5000**

## Flask CLI Commands

### Database Commands

```bash
# Initialize database
flask init-db

# Seed database with test data
flask seed-db

# Access Flask shell
flask shell

# Create migration
flask db migrate -m "Description"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

### Shell Context

When you run `flask shell`, these objects are available:

```python
>>> db          # SQLAlchemy database instance
>>> User        # User model
>>> Scholar     # Scholar model
>>> Supervisor  # Supervisor model
# ... all other models
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/register-scholar` | Register scholar (Dean only) |

### Scholars

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scholars` | Get all scholars |
| GET | `/api/scholars/<id>` | Get scholar details |
| PUT | `/api/scholars/<id>` | Update scholar |
| GET | `/api/scholars/my-profile` | Get own profile |

### Travel Grants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/travel-grants` | Get travel grants |
| POST | `/api/travel-grants` | Create application |
| POST | `/api/travel-grants/<id>/approve` | Approve/reject grant |
| GET | `/api/travel-grants/pending` | Get pending approvals |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/unread` | Get unread count |
| POST | `/api/notifications/<id>/read` | Mark as read |

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete API reference.

## Database Models

### Core Models

- **User** - Base user model for all roles
- **Scholar** - PhD/MSc student profiles
- **Supervisor** - Faculty/supervisor profiles
- **School** - Academic schools/departments

### Academic Tracking

- **Committee** - Doctoral committees (DC/ADC)
- **Exam** - Comprehensive exams
- **Seminar** - Research seminars
- **Synopsis** - Synopsis submissions
- **ProgressReport** - Progress reports
- **Thesis** - Thesis submissions

### Workflow Management

- **TravelGrant** - Travel grant applications
- **TravelGrantApproval** - Approval workflow
- **Notification** - System notifications

## Configuration

Configuration is managed in `config.py` with environment-based settings:

- `DevelopmentConfig` - Debug mode, verbose logging
- `ProductionConfig` - Optimized for production
- `TestingConfig` - For running tests

Set `FLASK_ENV` to switch configurations:

```bash
export FLASK_ENV=production  # Linux/Mac
set FLASK_ENV=production     # Windows
```

## Security Features

### Authentication
- JWT access tokens (1 hour expiry)
- JWT refresh tokens (30 day expiry)
- Secure password hashing (Werkzeug)

### Authorization
- Role-based access control decorators
- `@role_required('dean_academics', 'ad_research')`
- `@scholar_or_supervisor_required`

### File Security
- File type validation
- File size limits (16MB)
- Secure filename handling
- Organized directory structure

## Email Service

Email notifications are sent using Flask-Mail:

```python
from app.utils.email_service import EmailService

# Send custom email
EmailService.send_email(
    to_email='user@example.com',
    subject='Subject',
    body='Plain text body',
    html_body='<h1>HTML body</h1>'
)

# Send notification email (automatic)
EmailService.send_notification_email(notification)
```

## File Upload

Files are handled by the `file_handler` utility:

```python
from app.utils.file_handler import save_uploaded_file

# In route handler
file = request.files['file']
relative_path, filename = save_uploaded_file(file, subfolder='synopsis')
```

Uploaded files are stored in:
```
app/static/uploads/
├── synopsis/
├── progress_reports/
├── thesis/
└── travel_grants/
```

## Notification System

Notifications are managed by `NotificationService`:

```python
from app.utils.notification_service import NotificationService

# Create notification
NotificationService.create_notification(
    user_id=user_id,
    title='Title',
    message='Message',
    notification_type='exam',
    priority='high',
    send_email=True
)

# Built-in notification methods
NotificationService.notify_exam_scheduled(scholar_id, exam_id, exam_date)
NotificationService.notify_submission_reviewed(scholar_id, 'synopsis', id, status)
```

## Testing Credentials

After running `flask seed-db`:

```
Dean: dean@university.edu / password123
AD Research: ad.research@university.edu / password123
School Chair: chair.cs@university.edu / password123
Supervisor 1: supervisor1@university.edu / password123
Supervisor 2: supervisor2@university.edu / password123
Scholar 1 (PhD): scholar1@university.edu / password123
Scholar 2 (MSc): scholar2@university.edu / password123
```

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

### Environment Variables for Production

```env
FLASK_ENV=production
SECRET_KEY=<strong-secret-key>
JWT_SECRET_KEY=<strong-jwt-secret>
DATABASE_URL=<production-database-url>
MAIL_SERVER=<smtp-server>
MAIL_USERNAME=<email>
MAIL_PASSWORD=<password>
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U postgres -d research_portal
```

### Migration Issues

```bash
# Reset migrations (WARNING: deletes data)
flask db downgrade base
flask db upgrade
flask seed-db
```

### Import Errors

```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

## Development Tips

### Debugging

Enable debug mode in `.env`:

```env
FLASK_ENV=development
```

Flask will provide detailed error messages and auto-reload on code changes.

### Database Queries

Use Flask shell to test queries:

```bash
flask shell

>>> from app.models import Scholar
>>> scholars = Scholar.query.all()
>>> print(scholars)
```

### Testing APIs

Use curl or Postman:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"scholar1@university.edu","password":"password123"}'

# Get profile (with token)
curl -X GET http://localhost:5000/api/scholars/my-profile \
  -H "Authorization: Bearer <access_token>"
```

## Performance Tips

- Use database indexes on frequently queried fields
- Implement query pagination for large datasets
- Use lazy loading for relationships
- Cache frequently accessed data (Redis)
- Use connection pooling

## Contributing

1. Create a new branch
2. Make your changes
3. Add/update tests
4. Submit a pull request

## License

[Specify License]

---

**Built with Flask and PostgreSQL**
