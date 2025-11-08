from app import db
from datetime import datetime

class Synopsis(db.Model):
    """Synopsis submission model"""
    __tablename__ = 'synopsis'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # File information
    file_path = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    version = db.Column(db.Integer, default=1)

    # Review details
    # Status: submitted, under_review, changes_requested, accepted, rejected
    status = db.Column(db.String(50), default='submitted')

    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    feedback = db.Column(db.Text)

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])

    def to_dict(self):
        """Convert synopsis to dictionary"""
        return {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'version': self.version,
            'status': self.status,
            'reviewed_by': self.reviewed_by,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'feedback': self.feedback,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Synopsis v{self.version} for Scholar {self.scholar_id}>'
