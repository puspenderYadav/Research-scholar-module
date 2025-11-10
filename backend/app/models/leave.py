from app import db
from datetime import datetime

class Leave(db.Model):
    """Leave Application model"""
    __tablename__ = 'leaves'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Leave details
    leave_type = db.Column(db.String(50), nullable=False)  # personal, medical, maternity, paternity
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text, nullable=False)

    # Supporting document (optional, not required for personal leave)
    supporting_document = db.Column(db.String(255))

    # Approval workflow
    # Status: submitted, under_review, approved, rejected, withdrawn
    status = db.Column(db.String(50), default='submitted', index=True)

    # Current approval stage: supervisor, school_chair
    current_stage = db.Column(db.String(50), default='supervisor')

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', backref='leaves')
    approvals = db.relationship('LeaveApproval', backref='leave', lazy='dynamic',
                               cascade='all, delete-orphan', order_by='LeaveApproval.approval_date')

    def to_dict(self, include_approvals=True, include_scholar=False):
        """Convert leave to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'leave_type': self.leave_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'total_days': self.total_days,
            'reason': self.reason,
            'supporting_document': self.supporting_document,
            'status': self.status,
            'current_stage': self.current_stage,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_scholar and self.scholar:
            data['scholar'] = {
                'id': self.scholar.id,
                'name': self.scholar.user.name if self.scholar.user else None,
                'enrollment_number': self.scholar.enrollment_number,
                'program': self.scholar.program
            }

        if include_approvals:
            data['approvals'] = [a.to_dict() for a in self.approvals.all()]

        return data

    def __repr__(self):
        return f'<Leave {self.id} - {self.leave_type} for Scholar {self.scholar_id}>'


class LeaveApproval(db.Model):
    """Leave Approval workflow model"""
    __tablename__ = 'leave_approvals'

    id = db.Column(db.Integer, primary_key=True)
    leave_id = db.Column(db.Integer, db.ForeignKey('leaves.id'), nullable=False)

    # Approval stage: supervisor, school_chair
    approval_stage = db.Column(db.String(50), nullable=False)

    # Approver
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Decision: approved, rejected
    decision = db.Column(db.String(50), nullable=False)
    feedback = db.Column(db.Text)  # Required for rejection

    approval_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    approver = db.relationship('User', foreign_keys=[approver_id])

    def to_dict(self):
        """Convert approval to dictionary"""
        return {
            'id': self.id,
            'leave_id': self.leave_id,
            'approval_stage': self.approval_stage,
            'approver_id': self.approver_id,
            'approver_name': self.approver.name if self.approver else None,
            'decision': self.decision,
            'feedback': self.feedback,
            'approval_date': self.approval_date.isoformat() if self.approval_date else None
        }

    def __repr__(self):
        return f'<LeaveApproval {self.approval_stage} - {self.decision}>'


class LeaveBalance(db.Model):
    """Leave Balance tracking model"""
    __tablename__ = 'leave_balances'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False, unique=True)

    # Leave balances
    personal_leave_total = db.Column(db.Integer, default=30)
    personal_leave_used = db.Column(db.Integer, default=0)

    medical_leave_total = db.Column(db.Integer, default=30)
    medical_leave_used = db.Column(db.Integer, default=0)

    maternity_leave_taken = db.Column(db.Boolean, default=False)
    paternity_leave_taken = db.Column(db.Boolean, default=False)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', backref=db.backref('leave_balance', uselist=False))

    def to_dict(self):
        """Convert leave balance to dictionary"""
        return {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'personal_leave_total': self.personal_leave_total,
            'personal_leave_used': self.personal_leave_used,
            'personal_leave_remaining': self.personal_leave_total - self.personal_leave_used,
            'medical_leave_total': self.medical_leave_total,
            'medical_leave_used': self.medical_leave_used,
            'medical_leave_remaining': self.medical_leave_total - self.medical_leave_used,
            'maternity_leave_taken': self.maternity_leave_taken,
            'paternity_leave_taken': self.paternity_leave_taken
        }

    def __repr__(self):
        return f'<LeaveBalance for Scholar {self.scholar_id}>'
