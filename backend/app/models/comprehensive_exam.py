from app import db
from datetime import datetime

class ComprehensiveExam(db.Model):
    """Comprehensive Exam model for batch-wise examinations"""
    __tablename__ = 'comprehensive_exams'

    id = db.Column(db.Integer, primary_key=True)

    # Exam Details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    exam_date = db.Column(db.Date, nullable=False)
    exam_time = db.Column(db.Time, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)  # Duration in minutes
    venue = db.Column(db.String(200), nullable=False)

    # Batch Selection Criteria
    program = db.Column(db.String(50))  # PhD, MSc, or NULL for all
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'))  # NULL for all schools
    admission_year = db.Column(db.Integer)  # NULL for all years

    # Additional Information
    instructions = db.Column(db.Text)
    syllabus = db.Column(db.Text)

    # Metadata
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Status
    status = db.Column(db.String(50), default='scheduled')  # scheduled, completed, cancelled

    # Relationships
    school = db.relationship('School', backref='comprehensive_exams')
    created_by = db.relationship('User', backref='created_comprehensive_exams')
    registrations = db.relationship('ComprehensiveExamRegistration', backref='exam', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        """Convert exam to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'exam_date': self.exam_date.isoformat() if self.exam_date else None,
            'exam_time': self.exam_time.isoformat() if self.exam_time else None,
            'duration_minutes': self.duration_minutes,
            'venue': self.venue,
            'program': self.program,
            'school_id': self.school_id,
            'school': {
                'id': self.school.id,
                'name': self.school.name,
                'code': self.school.code
            } if self.school else None,
            'admission_year': self.admission_year,
            'instructions': self.instructions,
            'syllabus': self.syllabus,
            'status': self.status,
            'created_by': {
                'id': self.created_by.id,
                'name': self.created_by.name,
                'email': self.created_by.email
            } if self.created_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'registered_count': self.registrations.count()
        }

    def __repr__(self):
        return f'<ComprehensiveExam {self.title}>'


class ComprehensiveExamRegistration(db.Model):
    """Student registration for comprehensive exams"""
    __tablename__ = 'comprehensive_exam_registrations'

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('comprehensive_exams.id'), nullable=False)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Registration Details
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    attendance_status = db.Column(db.String(50), default='registered')  # registered, present, absent

    # Result
    marks_obtained = db.Column(db.Float)
    total_marks = db.Column(db.Float)
    grade = db.Column(db.String(10))
    result = db.Column(db.String(50))  # pass, fail, pending
    remarks = db.Column(db.Text)

    # Relationships
    scholar = db.relationship('Scholar', backref='comprehensive_exam_registrations')

    def to_dict(self):
        """Convert registration to dictionary"""
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'scholar_id': self.scholar_id,
            'scholar': {
                'id': self.scholar.id,
                'enrollment_number': self.scholar.enrollment_number,
                'name': self.scholar.user.name if self.scholar.user else None,
                'email': self.scholar.user.email if self.scholar.user else None,
                'program': self.scholar.program
            } if self.scholar else None,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'attendance_status': self.attendance_status,
            'marks_obtained': self.marks_obtained,
            'total_marks': self.total_marks,
            'grade': self.grade,
            'result': self.result,
            'remarks': self.remarks
        }

    def __repr__(self):
        return f'<ComprehensiveExamRegistration Exam:{self.exam_id} Scholar:{self.scholar_id}>'
