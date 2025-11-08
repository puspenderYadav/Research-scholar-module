from app import db
from datetime import datetime

class ProgressReport(db.Model):
    """Progress Report submission model"""
    __tablename__ = 'progress_reports'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Report period
    report_period_start = db.Column(db.Date)
    report_period_end = db.Column(db.Date)

    # File information
    file_path = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)

    # Review details
    # Status: submitted, under_review, changes_requested, accepted, rejected
    status = db.Column(db.String(50), default='submitted')

    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    feedback = db.Column(db.Text)

    # Rating (optional)
    rating = db.Column(db.String(50))  # excellent, good, satisfactory, needs_improvement

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])

    def to_dict(self):
        """Convert progress report to dictionary"""
        return {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'report_period_start': self.report_period_start.isoformat() if self.report_period_start else None,
            'report_period_end': self.report_period_end.isoformat() if self.report_period_end else None,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'status': self.status,
            'reviewed_by': self.reviewed_by,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'feedback': self.feedback,
            'rating': self.rating,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<ProgressReport {self.id} for Scholar {self.scholar_id}>'
