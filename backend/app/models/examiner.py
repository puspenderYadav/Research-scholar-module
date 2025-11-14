from app import db
from datetime import datetime

class Examiner(db.Model):
    """External Examiner model - represents external reviewers for thesis evaluation"""
    __tablename__ = 'examiners'

    id = db.Column(db.Integer, primary_key=True)

    # Personal Information
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False, unique=True, index=True)
    institution = db.Column(db.String(300), nullable=False)
    designation = db.Column(db.String(200))  # Professor, Associate Professor, etc.

    # Additional Details
    specialization = db.Column(db.String(500))  # Research area/expertise
    phone = db.Column(db.String(20))
    country = db.Column(db.String(100))

    # Internal vs External
    is_internal = db.Column(db.Boolean, default=False)  # True if from same institution

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    thesis_assignments = db.relationship('ThesisExaminer', back_populates='examiner', lazy='dynamic')

    def to_dict(self):
        """Convert examiner to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'institution': self.institution,
            'designation': self.designation,
            'specialization': self.specialization,
            'phone': self.phone,
            'country': self.country,
            'is_internal': self.is_internal,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Examiner {self.name} - {self.institution}>'
