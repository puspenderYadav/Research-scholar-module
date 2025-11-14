from app import db
from datetime import datetime

class Committee(db.Model):
    """Doctoral/Research Committee model"""
    __tablename__ = 'committees'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False, unique=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', back_populates='committee')
    members = db.relationship('CommitteeMember', backref='committee', lazy='dynamic', cascade='all, delete-orphan')

    def get_dc_members(self):
        """Get Doctoral Committee members"""
        return CommitteeMember.query.filter_by(
            committee_id=self.id,
            member_type='DC',
            is_active=True
        ).all()

    def get_apc_members(self):
        """Get Academic Progress Committee members"""
        return CommitteeMember.query.filter_by(
            committee_id=self.id,
            member_type='APC',
            is_active=True
        ).all()

    def get_adc_members(self):
        """Get Additional Doctoral Committee members (deprecated)"""
        return CommitteeMember.query.filter_by(
            committee_id=self.id,
            member_type='ADC',
            is_active=True
        ).all()

    def to_dict(self):
        """Convert committee to dictionary"""
        return {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'dc_members': [m.to_dict() for m in self.get_dc_members()],
            'apc_members': [m.to_dict() for m in self.get_apc_members()],
            'adc_members': [m.to_dict() for m in self.get_adc_members()],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Committee for Scholar {self.scholar_id}>'


class CommitteeMember(db.Model):
    """Committee Member model"""
    __tablename__ = 'committee_members'

    id = db.Column(db.Integer, primary_key=True)
    committee_id = db.Column(db.Integer, db.ForeignKey('committees.id'), nullable=False)
    supervisor_id = db.Column(db.Integer, db.ForeignKey('supervisors.id'), nullable=False)

    # Member type: DC (Doctoral Committee), APC (Academic Progress Committee), ADC (Additional Doctoral Committee - deprecated)
    member_type = db.Column(db.String(10), nullable=False)

    assigned_date = db.Column(db.Date, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    supervisor = db.relationship('Supervisor', backref='committee_memberships')

    def to_dict(self):
        """Convert committee member to dictionary"""
        return {
            'id': self.id,
            'committee_id': self.committee_id,
            'supervisor_id': self.supervisor_id,
            'member_type': self.member_type,
            'assigned_date': self.assigned_date.isoformat() if self.assigned_date else None,
            'is_active': self.is_active,
            'supervisor': self.supervisor.to_dict() if self.supervisor else None
        }

    def __repr__(self):
        return f'<CommitteeMember {self.member_type} - {self.supervisor_id}>'
