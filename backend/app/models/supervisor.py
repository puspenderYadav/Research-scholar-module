from app import db
from datetime import datetime

class Supervisor(db.Model):
    """Supervisor/Faculty model"""
    __tablename__ = 'supervisors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)

    # Professional Information
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    designation = db.Column(db.String(100))
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    specialization = db.Column(db.Text)
    personal_email = db.Column(db.String(120))  # Personal email for notifications

    # Supervision capacity
    max_phd_scholars = db.Column(db.Integer, default=8)
    max_msc_scholars = db.Column(db.Integer, default=5)

    is_accepting_students = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert supervisor to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'employee_id': self.employee_id,
            'designation': self.designation,
            'school_id': self.school_id,
            'specialization': self.specialization,
            'max_phd_scholars': self.max_phd_scholars,
            'max_msc_scholars': self.max_msc_scholars,
            'is_accepting_students': self.is_accepting_students,
            'user': self.user.to_dict() if self.user else None
        }

    def current_scholar_count(self, program=None):
        """Get current number of scholars supervised"""
        query = Scholar.query.filter_by(supervisor_id=self.id, status='active')
        if program:
            query = query.filter_by(program=program)
        return query.count()

    def __repr__(self):
        return f'<Supervisor {self.employee_id}>'
