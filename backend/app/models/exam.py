from app import db
from datetime import datetime

class Exam(db.Model):
    """Comprehensive Exam model"""
    __tablename__ = 'exams'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Exam details
    exam_type = db.Column(db.String(50), nullable=False)  # comprehensive, qualifying, etc.
    scheduled_date = db.Column(db.DateTime)
    due_date = db.Column(db.DateTime)
    completion_date = db.Column(db.DateTime)

    # Status: scheduled, pending, completed, failed, rescheduled
    status = db.Column(db.String(50), default='pending')

    # Results
    result = db.Column(db.String(50))  # pass, fail, conditional_pass
    marks = db.Column(db.Float)
    remarks = db.Column(db.Text)

    # Metadata
    scheduled_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    venue = db.Column(db.String(200))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', back_populates='exams')
    scheduled_by_user = db.relationship('User', foreign_keys=[scheduled_by])

    def to_dict(self):
        """Convert exam to dictionary"""
        return {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'exam_type': self.exam_type,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'status': self.status,
            'result': self.result,
            'marks': self.marks,
            'remarks': self.remarks,
            'venue': self.venue,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Exam {self.exam_type} for Scholar {self.scholar_id}>'
