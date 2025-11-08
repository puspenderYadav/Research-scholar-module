from app import db
from datetime import datetime

class Scholar(db.Model):
    """Scholar (PhD/MSc) profile model"""
    __tablename__ = 'scholars'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)

    # Academic Information
    enrollment_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    program = db.Column(db.String(20), nullable=False)  # PhD, MSc
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    admission_date = db.Column(db.Date, nullable=False)
    expected_completion_date = db.Column(db.Date)
    personal_email = db.Column(db.String(120))  # Personal email for credential delivery

    # Research Information
    research_area = db.Column(db.Text)
    thesis_title = db.Column(db.String(500))
    supervisor_id = db.Column(db.Integer, db.ForeignKey('supervisors.id'))
    co_supervisor_id = db.Column(db.Integer, db.ForeignKey('supervisors.id'))

    # Status
    status = db.Column(db.String(50), default='active')  # active, on_leave, completed, withdrawn, suspended, rusticated

    # Suspension/Rustication fields
    suspension_start_date = db.Column(db.Date)
    suspension_end_date = db.Column(db.Date)
    suspension_reason = db.Column(db.Text)
    is_rusticated = db.Column(db.Boolean, default=False)
    rustication_date = db.Column(db.Date)
    rustication_reason = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    supervisor = db.relationship('Supervisor', foreign_keys=[supervisor_id], backref='supervised_scholars')
    co_supervisor = db.relationship('Supervisor', foreign_keys=[co_supervisor_id], backref='co_supervised_scholars')
    committee = db.relationship('Committee', backref='scholar', uselist=False, cascade='all, delete-orphan')
    exams = db.relationship('Exam', backref='scholar', lazy='dynamic', cascade='all, delete-orphan')
    seminars = db.relationship('Seminar', backref='scholar', lazy='dynamic', cascade='all, delete-orphan')
    synopsis_reports = db.relationship('Synopsis', backref='scholar', lazy='dynamic', cascade='all, delete-orphan')
    progress_reports = db.relationship('ProgressReport', backref='scholar', lazy='dynamic', cascade='all, delete-orphan')
    thesis_submissions = db.relationship('Thesis', backref='scholar', lazy='dynamic', cascade='all, delete-orphan')
    travel_grants = db.relationship('TravelGrant', backref='scholar', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_relations=False):
        """Convert scholar to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'enrollment_number': self.enrollment_number,
            'program': self.program,
            'school_id': self.school_id,
            'admission_date': self.admission_date.isoformat() if self.admission_date else None,
            'expected_completion_date': self.expected_completion_date.isoformat() if self.expected_completion_date else None,
            'personal_email': self.personal_email,
            'research_area': self.research_area,
            'thesis_title': self.thesis_title,
            'supervisor_id': self.supervisor_id,
            'co_supervisor_id': self.co_supervisor_id,
            'status': self.status,
            'suspension_start_date': self.suspension_start_date.isoformat() if self.suspension_start_date else None,
            'suspension_end_date': self.suspension_end_date.isoformat() if self.suspension_end_date else None,
            'suspension_reason': self.suspension_reason,
            'is_rusticated': self.is_rusticated,
            'rustication_date': self.rustication_date.isoformat() if self.rustication_date else None,
            'rustication_reason': self.rustication_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_relations:
            data['user'] = self.user.to_dict()
            data['school'] = self.school.to_dict() if self.school else None
            data['supervisor'] = self.supervisor.to_dict() if self.supervisor else None
            data['co_supervisor'] = self.co_supervisor.to_dict() if self.co_supervisor else None

        return data

    def __repr__(self):
        return f'<Scholar {self.enrollment_number}>'
