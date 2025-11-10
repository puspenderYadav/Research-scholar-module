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
    # Status: pending_review, under_review, changes_requested, approved, rejected
    status = db.Column(db.String(50), default='pending_review')
    
    # Overall review summary (added after all approvals)
    final_reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    final_reviewed_at = db.Column(db.DateTime)
    final_feedback = db.Column(db.Text)

    # Rating (optional - set after final approval)
    rating = db.Column(db.String(50))  # excellent, good, satisfactory, needs_improvement

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    final_reviewer = db.relationship('User', foreign_keys=[final_reviewed_by])

    def to_dict(self, include_relations=False):
        """Convert progress report to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'report_period_start': self.report_period_start.isoformat() if self.report_period_start else None,
            'report_period_end': self.report_period_end.isoformat() if self.report_period_end else None,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'status': self.status,
            'final_reviewed_by': self.final_reviewed_by,
            'final_reviewed_at': self.final_reviewed_at.isoformat() if self.final_reviewed_at else None,
            'final_feedback': self.final_feedback,
            'rating': self.rating,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_relations and hasattr(self, 'approvals'):
            data['approvals'] = [approval.to_dict(include_relations=True) for approval in self.approvals]

        return data

    def __repr__(self):
        return f'<ProgressReport {self.id} for Scholar {self.scholar_id}>'
