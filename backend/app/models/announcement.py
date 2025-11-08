from app import db
from datetime import datetime

class Announcement(db.Model):
    """Announcement model for institutional announcements"""
    __tablename__ = 'announcements'

    id = db.Column(db.Integer, primary_key=True)

    # Content
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    attachment_url = db.Column(db.String(500), nullable=True)
    attachment_filename = db.Column(db.String(200), nullable=True)

    # Target audience (JSON array of roles)
    target_audience = db.Column(db.JSON, nullable=False)  # e.g., ['scholar', 'supervisor', 'all']

    # Scheduling
    scheduled_time = db.Column(db.DateTime, nullable=False)
    is_published = db.Column(db.Boolean, default=False)
    published_at = db.Column(db.DateTime, nullable=True)

    # Creator info
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_by = db.relationship('User', foreign_keys=[created_by_id])

    def get_creator_display(self):
        """Get formatted creator display text based on role"""
        if not self.created_by:
            return 'Unknown'

        user = self.created_by

        if user.role == 'dean_academics':
            return 'Dean Academics'
        elif user.role == 'ad_research':
            return 'AD Research'
        elif user.role == 'school_chair':
            # Get school name from the School model
            from app.models.school import School
            school = School.query.filter_by(chair_id=user.id).first()
            if school:
                return f'School Chair - {school.name}'
            return 'School Chair'
        elif user.role in ['supervisor', 'faculty']:
            return user.name

        return user.name

    def to_dict(self):
        """Convert announcement to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'attachment_url': self.attachment_url,
            'attachment_filename': self.attachment_filename,
            'target_audience': self.target_audience,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'is_published': self.is_published,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_by': self.created_by.to_dict() if self.created_by else None,
            'created_by_display': self.get_creator_display(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Announcement {self.title}>'
