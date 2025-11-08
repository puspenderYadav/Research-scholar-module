from app import db
from datetime import datetime

class TravelGrant(db.Model):
    """Travel Grant Application model"""
    __tablename__ = 'travel_grants'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Grant details
    purpose = db.Column(db.String(500), nullable=False)
    destination = db.Column(db.String(200), nullable=False)
    conference_name = db.Column(db.String(300))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)

    # Financial details
    amount_requested = db.Column(db.Numeric(10, 2), nullable=False)
    amount_approved = db.Column(db.Numeric(10, 2))

    # Supporting documents
    supporting_document = db.Column(db.String(255))
    acceptance_letter = db.Column(db.String(255))

    # Approval workflow
    # Status: submitted, under_review, approved, rejected, withdrawn
    status = db.Column(db.String(50), default='submitted', index=True)

    # Current approval stage: supervisor, dc, school_chair, ad_research, dean_academics
    current_stage = db.Column(db.String(50), default='supervisor')

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    approvals = db.relationship('TravelGrantApproval', backref='travel_grant', lazy='dynamic',
                               cascade='all, delete-orphan', order_by='TravelGrantApproval.approval_date')

    def to_dict(self, include_approvals=True):
        """Convert travel grant to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'purpose': self.purpose,
            'destination': self.destination,
            'conference_name': self.conference_name,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'amount_requested': float(self.amount_requested) if self.amount_requested else None,
            'amount_approved': float(self.amount_approved) if self.amount_approved else None,
            'supporting_document': self.supporting_document,
            'acceptance_letter': self.acceptance_letter,
            'status': self.status,
            'current_stage': self.current_stage,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_approvals:
            data['approvals'] = [a.to_dict() for a in self.approvals.all()]

        return data

    def __repr__(self):
        return f'<TravelGrant {self.id} for Scholar {self.scholar_id}>'


class TravelGrantApproval(db.Model):
    """Travel Grant Approval workflow model"""
    __tablename__ = 'travel_grant_approvals'

    id = db.Column(db.Integer, primary_key=True)
    travel_grant_id = db.Column(db.Integer, db.ForeignKey('travel_grants.id'), nullable=False)

    # Approval stage: supervisor, dc, school_chair, ad_research, dean_academics
    approval_stage = db.Column(db.String(50), nullable=False)

    # Approver
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Decision: approved, rejected, changes_requested
    decision = db.Column(db.String(50), nullable=False)
    comments = db.Column(db.Text)

    approval_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    approver = db.relationship('User', foreign_keys=[approver_id])

    def to_dict(self):
        """Convert approval to dictionary"""
        return {
            'id': self.id,
            'travel_grant_id': self.travel_grant_id,
            'approval_stage': self.approval_stage,
            'approver_id': self.approver_id,
            'approver_name': self.approver.name if self.approver else None,
            'decision': self.decision,
            'comments': self.comments,
            'approval_date': self.approval_date.isoformat() if self.approval_date else None
        }

    def __repr__(self):
        return f'<TravelGrantApproval {self.approval_stage} - {self.decision}>'
