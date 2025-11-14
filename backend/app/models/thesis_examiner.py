from app import db
from datetime import datetime

class ThesisExaminer(db.Model):
    """Junction table linking thesis submissions to external examiners with their reports"""
    __tablename__ = 'thesis_examiners'

    id = db.Column(db.Integer, primary_key=True)

    # Foreign Keys
    thesis_id = db.Column(db.Integer, db.ForeignKey('thesis_submissions.id'), nullable=False)
    examiner_id = db.Column(db.Integer, db.ForeignKey('examiners.id'), nullable=False)

    # Examiner Role
    examiner_role = db.Column(db.String(50), default='external')  # internal, external, chair

    # Invitation Status
    invitation_sent_at = db.Column(db.DateTime)
    invitation_status = db.Column(db.String(50), default='pending')  # pending, invited, accepted, declined

    # Report Submission
    report_submitted = db.Column(db.Boolean, default=False)
    report_file_path = db.Column(db.String(500))  # Path to uploaded report
    report_file_name = db.Column(db.String(255))

    # Examiner Recommendation
    # Options: accept, minor_revision, major_revision, reject
    recommendation = db.Column(db.String(50))
    comments = db.Column(db.Text)  # Examiner's detailed comments

    # Timestamps
    submitted_at = db.Column(db.DateTime)  # When examiner submitted their report
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    thesis = db.relationship('Thesis', back_populates='examiner_assignments')
    examiner = db.relationship('Examiner', back_populates='thesis_assignments')

    def to_dict(self, include_examiner_details=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'thesis_id': self.thesis_id,
            'examiner_id': self.examiner_id,
            'examiner_role': self.examiner_role,
            'invitation_sent_at': self.invitation_sent_at.isoformat() if self.invitation_sent_at else None,
            'invitation_status': self.invitation_status,
            'report_submitted': self.report_submitted,
            'report_file_name': self.report_file_name,
            'recommendation': self.recommendation,
            'comments': self.comments,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_examiner_details and self.examiner:
            data['examiner'] = self.examiner.to_dict()

        return data

    def __repr__(self):
        return f'<ThesisExaminer Thesis:{self.thesis_id} Examiner:{self.examiner_id} - {self.recommendation}>'
