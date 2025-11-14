from app import db
from datetime import datetime

class Seminar(db.Model):
    """Seminar model"""
    __tablename__ = 'seminars'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Seminar details
    title = db.Column(db.String(500), nullable=False)
    seminar_type = db.Column(db.String(50), nullable=False)  # open_seminar_1, open_seminar_2, etc.
    scheduled_date = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=60)

    # Location
    venue = db.Column(db.String(200))
    online_link = db.Column(db.String(500))

    # Status: scheduled, pending, completed, cancelled
    status = db.Column(db.String(50), default='pending')

    # Details
    abstract = db.Column(db.Text)
    presentation_file = db.Column(db.String(255))

    # Feedback
    attendance_count = db.Column(db.Integer, default=0)
    feedback = db.Column(db.Text)

    # Metadata
    scheduled_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', back_populates='seminars', foreign_keys=[scholar_id])
    scheduled_by_user = db.relationship('User', foreign_keys=[scheduled_by])

    def to_dict(self):
        """Convert seminar to dictionary"""
        return {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'title': self.title,
            'seminar_type': self.seminar_type,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'duration_minutes': self.duration_minutes,
            'venue': self.venue,
            'online_link': self.online_link,
            'status': self.status,
            'abstract': self.abstract,
            'presentation_file': self.presentation_file,
            'attendance_count': self.attendance_count,
            'feedback': self.feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Seminar {self.seminar_type} for Scholar {self.scholar_id}>'
