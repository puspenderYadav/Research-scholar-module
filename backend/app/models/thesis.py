from app import db
from datetime import datetime

class Thesis(db.Model):
    """Thesis submission model with multi-stage approval workflow"""
    __tablename__ = 'thesis_submissions'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # File information
    file_path = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    version = db.Column(db.Integer, default=1)

    # Submission type: initial, revision_minor, revision_major, final
    submission_type = db.Column(db.String(50), default='initial')

    # Sequential workflow stage
    # Stages: supervisor, dc_apc, external_review, defense_scheduled, defense_completed, final_approval, completed
    current_stage = db.Column(db.String(50), default='supervisor')

    # Workflow Status
    # Status: with_supervisor, with_dc_apc, with_examiners, defense_scheduled, defense_completed,
    #         with_final_approval, approved, rejected, changes_requested
    status = db.Column(db.String(50), default='with_supervisor')

    # External examiner deadline
    external_examiner_deadline = db.Column(db.Date)  # Deadline for examiner reports

    # Post-defense revised thesis deadline (1 month after defense)
    revised_thesis_deadline = db.Column(db.DateTime)  # Deadline for revised thesis after defense

    # Defense information (deprecated - moved to ThesisDefense model)
    defense_date = db.Column(db.DateTime)
    defense_venue = db.Column(db.String(200))
    defense_status = db.Column(db.String(50))  # scheduled, completed, passed, failed

    # Review details (deprecated - kept for backward compatibility)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    feedback = db.Column(db.Text)

    # External examiner details (deprecated - moved to Examiner model)
    external_examiner_name = db.Column(db.String(200))
    external_examiner_institution = db.Column(db.String(200))
    external_examiner_report = db.Column(db.Text)

    # Final approval tracking
    is_approved = db.Column(db.Boolean, default=False)
    approved_at = db.Column(db.DateTime)

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', back_populates='thesis_submissions')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    examiner_assignments = db.relationship('ThesisExaminer', back_populates='thesis', lazy='dynamic', cascade='all, delete-orphan')
    defenses = db.relationship('ThesisDefense', back_populates='thesis', lazy='dynamic', cascade='all, delete-orphan')

    def get_examiner_assignments(self):
        """Get all examiner assignments for this thesis"""
        return self.examiner_assignments.all()

    def get_latest_defense(self):
        """Get the most recent defense event"""
        from app.models.thesis_defense import ThesisDefense
        return self.defenses.order_by(ThesisDefense.created_at.desc()).first()

    def can_schedule_defense(self):
        """Check if defense can be scheduled (all examiners must accept)"""
        assignments = self.get_examiner_assignments()
        if not assignments:
            return False
        return all(a.recommendation == 'accept' for a in assignments if a.report_submitted)

    def to_dict(self, include_relations=False):
        """Convert thesis to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'version': self.version,
            'submission_type': self.submission_type,
            'current_stage': self.current_stage,
            'status': self.status,
            'external_examiner_deadline': self.external_examiner_deadline.isoformat() if self.external_examiner_deadline else None,
            'revised_thesis_deadline': self.revised_thesis_deadline.isoformat() if self.revised_thesis_deadline else None,
            'is_approved': self.is_approved,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Legacy fields
            'defense_date': self.defense_date.isoformat() if self.defense_date else None,
            'defense_venue': self.defense_venue,
            'defense_status': self.defense_status,
        }

        if include_relations:
            if self.scholar:
                data['scholar'] = {
                    'id': self.scholar.id,
                    'enrollment_number': self.scholar.enrollment_number,
                    'name': self.scholar.user.name if self.scholar.user else None,
                    'program': self.scholar.program
                }

            # Include examiner assignments
            data['examiners'] = [a.to_dict(include_examiner_details=True) for a in self.get_examiner_assignments()]

            # Include latest defense
            latest_defense = self.get_latest_defense()
            if latest_defense:
                data['latest_defense'] = latest_defense.to_dict()

            data['can_schedule_defense'] = self.can_schedule_defense()

        return data

    def __repr__(self):
        return f'<Thesis v{self.version} ({self.submission_type}) for Scholar {self.scholar_id} - Stage:{self.current_stage}>'
