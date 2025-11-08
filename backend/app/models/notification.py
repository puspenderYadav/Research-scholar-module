from app import db
from datetime import datetime

class Notification(db.Model):
    """Notification model for in-app and email notifications"""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Notification details
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Type: exam, seminar, submission, approval, deadline, general
    notification_type = db.Column(db.String(50), nullable=False, index=True)

    # Priority: low, medium, high, urgent
    priority = db.Column(db.String(20), default='medium')

    # Related entity information (optional)
    related_entity_type = db.Column(db.String(50))  # scholar, exam, seminar, travel_grant, etc.
    related_entity_id = db.Column(db.Integer)

    # Action link (optional)
    action_link = db.Column(db.String(500))

    # Status
    is_read = db.Column(db.Boolean, default=False, index=True)
    read_at = db.Column(db.DateTime)

    # Email status
    email_sent = db.Column(db.Boolean, default=False)
    email_sent_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
            db.session.commit()

    def to_dict(self):
        """Convert notification to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'priority': self.priority,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'action_link': self.action_link,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'email_sent': self.email_sent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Notification {self.notification_type} for User {self.user_id}>'
