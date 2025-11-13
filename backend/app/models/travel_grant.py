from app import db
from datetime import datetime

class TravelGrant(db.Model):
    """Travel Grant Application model"""
    __tablename__ = 'travel_grants'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Basic Grant details
    grant_type = db.Column(db.String(100), nullable=False)  # International Conference, National Conference, Workshop, Field Trip, Research collaboration
    event_name = db.Column(db.String(500), nullable=False)
    organizers = db.Column(db.String(500), nullable=False)
    venue_country = db.Column(db.String(300), nullable=False)
    invitation_letter = db.Column(db.String(255))  # PDF file path
    broad_area = db.Column(db.String(500), nullable=False)
    reasons_for_visit = db.Column(db.Text, nullable=False)
    
    # Dates (optional for some grant types)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)

    # Funds Required
    funds_from_other_agencies = db.Column(db.Boolean, default=False)
    
    # Via Institute
    institute_amount = db.Column(db.Numeric(10, 2))
    institute_reasons = db.Column(db.Text)
    
    # Via Other Sources
    funding_agency_name = db.Column(db.String(300))
    sanctioned_amount = db.Column(db.Numeric(10, 2))
    registration_waiver_requested = db.Column(db.Boolean, default=False)
    registration_waiver_document = db.Column(db.String(255))  # PDF file path
    funds_from_supervisor_grant = db.Column(db.Boolean, default=False)
    supervisor_grant_amount = db.Column(db.Numeric(10, 2))
    
    # Financial details
    anticipated_expenses = db.Column(db.Numeric(10, 2), nullable=False)
    other_financial_details = db.Column(db.Text)
    amount_approved = db.Column(db.Numeric(10, 2))

    # Presenting Paper
    presenting_paper = db.Column(db.Boolean, default=False)
    paper_title = db.Column(db.String(500))
    number_of_papers = db.Column(db.Integer)
    paper_links = db.Column(db.Text)  # Store as JSON or comma-separated
    paper_other_details = db.Column(db.Text)

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
    scholar = db.relationship('Scholar', back_populates='travel_grants')
    approvals = db.relationship('TravelGrantApproval', backref='travel_grant', lazy='dynamic',
                               cascade='all, delete-orphan', order_by='TravelGrantApproval.approval_date')

    def to_dict(self, include_approvals=True):
        """Convert travel grant to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'grant_type': self.grant_type,
            'scholar_name': self.scholar.user.name if self.scholar and self.scholar.user else None,
            'event_name': self.event_name,
            'organizers': self.organizers,
            'venue_country': self.venue_country,
            'invitation_letter': self.invitation_letter,
            'broad_area': self.broad_area,
            'reasons_for_visit': self.reasons_for_visit,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'funds_from_other_agencies': self.funds_from_other_agencies,
            'institute_amount': float(self.institute_amount) if self.institute_amount else None,
            'institute_reasons': self.institute_reasons,
            'funding_agency_name': self.funding_agency_name,
            'sanctioned_amount': float(self.sanctioned_amount) if self.sanctioned_amount else None,
            'registration_waiver_requested': self.registration_waiver_requested,
            'registration_waiver_document': self.registration_waiver_document,
            'funds_from_supervisor_grant': self.funds_from_supervisor_grant,
            'supervisor_grant_amount': float(self.supervisor_grant_amount) if self.supervisor_grant_amount else None,
            'anticipated_expenses': float(self.anticipated_expenses) if self.anticipated_expenses else None,
            'other_financial_details': self.other_financial_details,
            'amount_approved': float(self.amount_approved) if self.amount_approved else None,
            'presenting_paper': self.presenting_paper,
            'paper_title': self.paper_title,
            'number_of_papers': self.number_of_papers,
            'paper_links': self.paper_links,
            'paper_other_details': self.paper_other_details,
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
