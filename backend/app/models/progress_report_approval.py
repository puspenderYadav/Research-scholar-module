from app import db
from datetime import datetime

class ProgressReportApproval(db.Model):
    """Progress report approval tracking for each stage (matching synopsis workflow)"""
    __tablename__ = 'progress_report_approvals'

    id = db.Column(db.Integer, primary_key=True)
    progress_report_id = db.Column(db.Integer, db.ForeignKey('progress_reports.id'), nullable=False)

    # Approval stage: supervisor, dc_apc, school_chair, ad_research, dean_academics
    stage = db.Column(db.String(50), nullable=False)

    # Approver information
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewer_role = db.Column(db.String(50))  # supervisor, dc_member, apc_member, school_chair, ad_research, dean_academics

    # For DC/APC stage - track individual member approvals
    committee_member_id = db.Column(db.Integer, db.ForeignKey('committee_members.id'), nullable=True)

    # Decision: pending, approved, rejected, changes_requested
    status = db.Column(db.String(50), default='pending')
    comments = db.Column(db.Text)

    # Timestamps
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    progress_report = db.relationship('ProgressReport', back_populates='approvals')
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])
    committee_member = db.relationship('CommitteeMember', foreign_keys=[committee_member_id])

    def to_dict(self, include_relations=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'progress_report_id': self.progress_report_id,
            'stage': self.stage,
            'reviewer_id': self.reviewer_id,
            'reviewer_role': self.reviewer_role,
            'reviewer_name': self.reviewer.name if self.reviewer else None,
            'committee_member_id': self.committee_member_id,
            'committee_member': self.committee_member.to_dict() if self.committee_member else None,
            'status': self.status,
            'comments': self.comments,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_relations and self.reviewer:
            data['reviewer'] = {
                'id': self.reviewer.id,
                'name': self.reviewer.name,
                'email': self.reviewer.email
            }

        return data

    def __repr__(self):
        return f'<ProgressReportApproval {self.stage} - {self.status}>'
