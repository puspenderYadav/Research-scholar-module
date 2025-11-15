from app import db
from datetime import datetime

class School(db.Model):
    """School/Department model"""
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    chair_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Soft delete fields
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    deleted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chair = db.relationship('User', foreign_keys=[chair_id])
    deleter = db.relationship('User', foreign_keys=[deleted_by])
    scholars = db.relationship('Scholar', backref='school', lazy='dynamic')
    supervisors = db.relationship('Supervisor', backref='school', lazy='dynamic')

    def to_dict(self):
        """Convert school to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'chair': self.chair.to_dict() if self.chair else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<School {self.name}>'
