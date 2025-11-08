from app import db
from datetime import datetime


class SupervisorChangeRequest(db.Model):
    """Model for supervisor change requests with multi-stage approval"""
    __tablename__ = 'supervisor_change_requests'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Current and requested supervisors
    current_supervisor_id = db.Column(db.Integer, db.ForeignKey('supervisors.id'), nullable=False)
    new_supervisor_id = db.Column(db.Integer, db.ForeignKey('supervisors.id'), nullable=False)

    # Request details
    reason = db.Column(db.Text, nullable=False)
    additional_comments = db.Column(db.Text)

    # Approval workflow status
    # pending -> current_supervisor_approved -> new_supervisor_approved -> dean_approved -> completed
    # Can also be: rejected_by_current, rejected_by_new, rejected_by_dean
    status = db.Column(db.String(50), default='pending', nullable=False)

    # Approval details
    current_supervisor_status = db.Column(db.String(20))  # approved/rejected/pending
    current_supervisor_comment = db.Column(db.Text)
    current_supervisor_reviewed_at = db.Column(db.DateTime)

    new_supervisor_status = db.Column(db.String(20))  # approved/rejected/pending
    new_supervisor_comment = db.Column(db.Text)
    new_supervisor_reviewed_at = db.Column(db.DateTime)

    dean_status = db.Column(db.String(20))  # approved/rejected/pending
    dean_comment = db.Column(db.Text)
    dean_reviewed_at = db.Column(db.DateTime)
    dean_reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))  # Which dean approved

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)  # When the change was finalized

    # Relationships
    scholar = db.relationship('Scholar', foreign_keys=[scholar_id], backref='supervisor_change_requests')
    current_supervisor = db.relationship('Supervisor', foreign_keys=[current_supervisor_id])
    new_supervisor = db.relationship('Supervisor', foreign_keys=[new_supervisor_id])
    dean_reviewer = db.relationship('User', foreign_keys=[dean_reviewed_by])

    def to_dict(self, include_relations=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'current_supervisor_id': self.current_supervisor_id,
            'new_supervisor_id': self.new_supervisor_id,
            'reason': self.reason,
            'additional_comments': self.additional_comments,
            'status': self.status,
            'current_supervisor_status': self.current_supervisor_status,
            'current_supervisor_comment': self.current_supervisor_comment,
            'current_supervisor_reviewed_at': self.current_supervisor_reviewed_at.isoformat() if self.current_supervisor_reviewed_at else None,
            'new_supervisor_status': self.new_supervisor_status,
            'new_supervisor_comment': self.new_supervisor_comment,
            'new_supervisor_reviewed_at': self.new_supervisor_reviewed_at.isoformat() if self.new_supervisor_reviewed_at else None,
            'dean_status': self.dean_status,
            'dean_comment': self.dean_comment,
            'dean_reviewed_at': self.dean_reviewed_at.isoformat() if self.dean_reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

        if include_relations:
            data['scholar'] = {
                'id': self.scholar.id,
                'enrollment_number': self.scholar.enrollment_number,
                'user': self.scholar.user.to_dict()
            } if self.scholar else None

            data['current_supervisor'] = {
                'id': self.current_supervisor.id,
                'user': self.current_supervisor.user.to_dict(),
                'designation': self.current_supervisor.designation
            } if self.current_supervisor else None

            data['new_supervisor'] = {
                'id': self.new_supervisor.id,
                'user': self.new_supervisor.user.to_dict(),
                'designation': self.new_supervisor.designation
            } if self.new_supervisor else None

        return data

    def get_next_approver_role(self):
        """Get the role that needs to approve next"""
        if self.current_supervisor_status != 'approved':
            return 'current_supervisor'
        elif self.new_supervisor_status != 'approved':
            return 'new_supervisor'
        elif self.dean_status != 'approved':
            return 'dean'
        return None

    def __repr__(self):
        return f'<SupervisorChangeRequest {self.id} - Scholar {self.scholar_id} - Status: {self.status}>'
