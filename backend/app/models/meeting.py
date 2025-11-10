from app import db
from datetime import datetime

class Meeting(db.Model):
    """Meeting model for faculty-scholar meetings"""
    __tablename__ = 'meetings'

    id = db.Column(db.Integer, primary_key=True)

    # Faculty (supervisor) who organized the meeting
    faculty_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Scholar who will attend the meeting
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Meeting details
    meeting_date = db.Column(db.DateTime, nullable=False, index=True)
    description = db.Column(db.Text)

    # Status: scheduled, completed, cancelled, missed
    status = db.Column(db.String(50), default='scheduled', index=True)

    # Meeting notes (can be added after the meeting)
    notes = db.Column(db.Text)

    # Scholar comment (for indicating unavailability or other notes)
    scholar_comment = db.Column(db.Text)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    faculty = db.relationship('User', foreign_keys=[faculty_id], backref='organized_meetings')
    scholar = db.relationship('Scholar', foreign_keys=[scholar_id], backref='meetings')

    def to_dict(self):
        """Convert meeting to dictionary"""
        return {
            'id': self.id,
            'faculty_id': self.faculty_id,
            'scholar_id': self.scholar_id,
            'meeting_date': self.meeting_date.isoformat() if self.meeting_date else None,
            'description': self.description,
            'status': self.status,
            'notes': self.notes,
            'scholar_comment': self.scholar_comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Meeting {self.id} between Faculty {self.faculty_id} and Scholar {self.scholar_id}>'
