from app import db
from datetime import datetime, date

class ProgressReportReminder(db.Model):
    """Track progress report submission reminders for scholars"""
    __tablename__ = 'progress_report_reminders'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)
    
    # Academic year for which reminder is sent
    academic_year = db.Column(db.String(20), nullable=False)  # e.g., "2024-25"
    
    # Due date for submission (typically 1 year after admission or last report)
    due_date = db.Column(db.Date, nullable=False)
    
    # Reminder status
    # Status: pending, reminded, submitted, overdue
    status = db.Column(db.String(50), default='pending')
    
    # Reminder tracking
    first_reminder_sent = db.Column(db.Boolean, default=False)
    first_reminder_date = db.Column(db.DateTime)
    
    second_reminder_sent = db.Column(db.Boolean, default=False)
    second_reminder_date = db.Column(db.DateTime)
    
    final_reminder_sent = db.Column(db.Boolean, default=False)
    final_reminder_date = db.Column(db.DateTime)
    
    # Submission tracking
    submitted = db.Column(db.Boolean, default=False)
    submission_date = db.Column(db.DateTime)
    progress_report_id = db.Column(db.Integer, db.ForeignKey('progress_reports.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', backref=db.backref('progress_reminders', lazy=True))
    progress_report = db.relationship('ProgressReport', backref=db.backref('reminder', uselist=False))

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'academic_year': self.academic_year,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'first_reminder_sent': self.first_reminder_sent,
            'first_reminder_date': self.first_reminder_date.isoformat() if self.first_reminder_date else None,
            'second_reminder_sent': self.second_reminder_sent,
            'second_reminder_date': self.second_reminder_date.isoformat() if self.second_reminder_date else None,
            'final_reminder_sent': self.final_reminder_sent,
            'final_reminder_date': self.final_reminder_date.isoformat() if self.final_reminder_date else None,
            'submitted': self.submitted,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'progress_report_id': self.progress_report_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @staticmethod
    def get_current_academic_year():
        """Get current academic year string (e.g., '2024-25')"""
        today = date.today()
        # Academic year typically starts in August/September
        if today.month >= 8:  # August onwards is new academic year
            return f"{today.year}-{str(today.year + 1)[-2:]}"
        else:
            return f"{today.year - 1}-{str(today.year)[-2:]}"

    @staticmethod
    def calculate_due_date(scholar):
        """Calculate next progress report due date for a scholar"""
        from datetime import timedelta
        from app.models.progress_report import ProgressReport

        # Find last submitted progress report
        last_report = ProgressReport.query.filter_by(
            scholar_id=scholar.id,
            is_approved=True
        ).order_by(ProgressReport.submission_date.desc()).first()

        if last_report and last_report.submission_date:
            # Due 1 year after last report
            due_date = last_report.submission_date.date() + timedelta(days=365)
        else:
            # First report - due 1 year after admission
            due_date = scholar.admission_date + timedelta(days=365)

        return due_date

    def __repr__(self):
        return f'<ProgressReportReminder {self.academic_year} - Scholar {self.scholar_id} - {self.status}>'
