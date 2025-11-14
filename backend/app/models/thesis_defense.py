from app import db
from datetime import datetime

class ThesisDefense(db.Model):
    """Thesis Defense event model - tracks defense scheduling and outcomes"""
    __tablename__ = 'thesis_defenses'

    id = db.Column(db.Integer, primary_key=True)

    # Foreign Key
    thesis_id = db.Column(db.Integer, db.ForeignKey('thesis_submissions.id'), nullable=False)

    # Defense Schedule
    defense_date = db.Column(db.Date, nullable=False)
    defense_time = db.Column(db.Time)
    venue = db.Column(db.String(500))  # Physical or virtual location
    duration_minutes = db.Column(db.Integer, default=120)  # Expected duration

    # Defense Status
    # Status: scheduled, rescheduled, completed, cancelled
    status = db.Column(db.String(50), default='scheduled')

    # Defense Outcome (set after defense is conducted)
    # Outcome: accept, minor_revision, major_revision, reject
    outcome = db.Column(db.String(50))

    # Committee Comments
    committee_comments = db.Column(db.Text)  # Feedback from defense committee

    # Conducted By
    conducted_by = db.Column(db.Integer, db.ForeignKey('users.id'))  # Supervisor or chair who conducted

    # Committee Members (JSON array of user IDs who attended)
    committee_members = db.Column(db.Text)  # Store as JSON string

    # Timestamps
    outcome_recorded_at = db.Column(db.DateTime)  # When outcome was recorded
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    thesis = db.relationship('Thesis', back_populates='defenses')
    conductor = db.relationship('User', foreign_keys=[conducted_by])

    def to_dict(self, include_relations=False):
        """Convert defense to dictionary"""
        data = {
            'id': self.id,
            'thesis_id': self.thesis_id,
            'defense_date': self.defense_date.isoformat() if self.defense_date else None,
            'defense_time': self.defense_time.strftime('%H:%M') if self.defense_time else None,
            'venue': self.venue,
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'outcome': self.outcome,
            'committee_comments': self.committee_comments,
            'conducted_by': self.conducted_by,
            'committee_members': self.committee_members,
            'outcome_recorded_at': self.outcome_recorded_at.isoformat() if self.outcome_recorded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_relations:
            if self.conductor:
                data['conductor_name'] = self.conductor.name
            if self.thesis:
                data['scholar'] = {
                    'id': self.thesis.scholar.id,
                    'name': self.thesis.scholar.user.name,
                    'enrollment_number': self.thesis.scholar.enrollment_number
                }

        return data

    def __repr__(self):
        return f'<ThesisDefense {self.id} - Thesis:{self.thesis_id} - {self.status}>'
