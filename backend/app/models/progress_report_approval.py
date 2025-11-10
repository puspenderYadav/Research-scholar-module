from app import db
from datetime import datetime

class ProgressReportApproval(db.Model):
    """Track approval from supervisor and committee members for progress reports"""
    __tablename__ = 'progress_report_approvals'

    id = db.Column(db.Integer, primary_key=True)
    progress_report_id = db.Column(db.Integer, db.ForeignKey('progress_reports.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewer_role = db.Column(db.String(50), nullable=False)  # 'supervisor' or 'committee_member'
    
    # Status: pending, approved, changes_requested, rejected
    status = db.Column(db.String(50), default='pending', nullable=False)
    comments = db.Column(db.Text)
    reviewed_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    progress_report = db.relationship('ProgressReport', backref=db.backref('approvals', lazy=True))
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])

    def to_dict(self, include_relations=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'progress_report_id': self.progress_report_id,
            'reviewer_id': self.reviewer_id,
            'reviewer_role': self.reviewer_role,
            'status': self.status,
            'comments': self.comments,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_relations:
            data['reviewer'] = {
                'id': self.reviewer.id,
                'name': self.reviewer.name,
                'email': self.reviewer.email
            } if self.reviewer else None

        return data

    def __repr__(self):
        return f'<ProgressReportApproval {self.id} - Report {self.progress_report_id} by {self.reviewer_role}>'
