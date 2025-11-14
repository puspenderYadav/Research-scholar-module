from app import db
from datetime import datetime

class Synopsis(db.Model):
    """Synopsis submission model with multi-level approval workflow"""
    __tablename__ = 'synopsis'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # File information
    file_path = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    version = db.Column(db.Integer, default=1)

    # Overall status
    # Status: submitted, with_supervisor, with_dc_apc, with_school_chair, with_ad_research,
    #         with_dean, approved, rejected, changes_requested
    status = db.Column(db.String(50), default='submitted')

    # Current approval stage
    # Stages: supervisor, dc_apc, school_chair, ad_research, dean_academics
    current_stage = db.Column(db.String(50), default='supervisor')

    # Final approval
    is_approved = db.Column(db.Boolean, default=False)
    approved_at = db.Column(db.DateTime)

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', back_populates='synopsis_reports')
    approvals = db.relationship('SynopsisApproval', back_populates='synopsis', lazy='dynamic', cascade='all, delete-orphan')

    def get_approval_by_stage(self, stage):
        """Get approval record for a specific stage"""
        return SynopsisApproval.query.filter_by(
            synopsis_id=self.id,
            stage=stage
        ).first()

    def get_all_approvals(self):
        """Get all approval records ordered by stage"""
        stage_order = ['supervisor', 'dc_apc', 'school_chair', 'ad_research', 'dean_academics']
        approvals = self.approvals.all()
        return sorted(approvals, key=lambda x: stage_order.index(x.stage) if x.stage in stage_order else 999)

    def to_dict(self, include_approvals=True):
        """Convert synopsis to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'scholar': {
                'id': self.scholar.id,
                'enrollment_number': self.scholar.enrollment_number,
                'name': self.scholar.user.name if self.scholar.user else None,
                'email': self.scholar.user.email if self.scholar.user else None
            } if self.scholar else None,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'version': self.version,
            'status': self.status,
            'current_stage': self.current_stage,
            'is_approved': self.is_approved,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_approvals:
            data['approvals'] = [a.to_dict() for a in self.get_all_approvals()]

        return data

    def __repr__(self):
        return f'<Synopsis v{self.version} for Scholar {self.scholar_id} - Stage: {self.current_stage}>'


class SynopsisApproval(db.Model):
    """Synopsis approval tracking for each stage"""
    __tablename__ = 'synopsis_approvals'

    id = db.Column(db.Integer, primary_key=True)
    synopsis_id = db.Column(db.Integer, db.ForeignKey('synopsis.id'), nullable=False)

    # Approval stage: supervisor, dc_apc, school_chair, ad_research, dean_academics
    stage = db.Column(db.String(50), nullable=False)

    # Approver information
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approver_role = db.Column(db.String(50))  # supervisor, dc_member, apc_member, school_chair, ad_research, dean_academics

    # For DC/APC stage - track individual member approvals
    committee_member_id = db.Column(db.Integer, db.ForeignKey('committee_members.id'), nullable=True)

    # Decision: pending, approved, rejected, changes_requested
    decision = db.Column(db.String(50), default='pending')
    comments = db.Column(db.Text)

    # Timestamps
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    synopsis = db.relationship('Synopsis', back_populates='approvals')
    approver = db.relationship('User', foreign_keys=[approver_id])
    committee_member = db.relationship('CommitteeMember', foreign_keys=[committee_member_id])

    def to_dict(self):
        """Convert approval to dictionary"""
        return {
            'id': self.id,
            'synopsis_id': self.synopsis_id,
            'stage': self.stage,
            'approver_id': self.approver_id,
            'approver_role': self.approver_role,
            'approver_name': self.approver.name if self.approver else None,
            'committee_member_id': self.committee_member_id,
            'committee_member': self.committee_member.to_dict() if self.committee_member else None,
            'decision': self.decision,
            'comments': self.comments,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<SynopsisApproval {self.stage} - {self.decision}>'
