from app import db
from datetime import datetime

class ProgressReport(db.Model):
    """Progress Report submission model with sequential approval workflow"""
    __tablename__ = 'progress_reports'

    id = db.Column(db.Integer, primary_key=True)
    scholar_id = db.Column(db.Integer, db.ForeignKey('scholars.id'), nullable=False)

    # Report period
    report_period_start = db.Column(db.Date)
    report_period_end = db.Column(db.Date)
    academic_year = db.Column(db.String(20))  # e.g., "2024-25"

    # File information
    file_path = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)

    # Sequential workflow status
    # Status: submitted, with_supervisor, with_dc_apc, with_school_chair, with_ad_research,
    #         with_dean, approved, rejected, changes_requested
    status = db.Column(db.String(50), default='submitted')

    # Current approval stage
    # Stages: supervisor, dc_apc, school_chair, ad_research, dean_academics
    current_stage = db.Column(db.String(50), default='supervisor')

    # Final approval
    is_approved = db.Column(db.Boolean, default=False)
    approved_at = db.Column(db.DateTime)

    # Rating (optional - set after final approval)
    rating = db.Column(db.String(50))  # excellent, good, satisfactory, needs_improvement

    # Metadata
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scholar = db.relationship('Scholar', back_populates='progress_reports')
    approvals = db.relationship('ProgressReportApproval', back_populates='progress_report', lazy='dynamic', cascade='all, delete-orphan')

    def get_approval_by_stage(self, stage):
        """Get approval record for a specific stage"""
        from app.models.progress_report_approval import ProgressReportApproval
        return ProgressReportApproval.query.filter_by(
            progress_report_id=self.id,
            stage=stage
        ).first()

    def get_all_approvals(self):
        """Get all approval records ordered by stage"""
        stage_order = ['supervisor', 'dc_apc', 'school_chair', 'ad_research', 'dean_academics']
        approvals = self.approvals.all()
        return sorted(approvals, key=lambda x: stage_order.index(x.stage) if x.stage in stage_order else 999)

    def to_dict(self, include_relations=False):
        """Convert progress report to dictionary"""
        data = {
            'id': self.id,
            'scholar_id': self.scholar_id,
            'scholar': {
                'id': self.scholar.id,
                'enrollment_number': self.scholar.enrollment_number,
                'name': self.scholar.user.name if self.scholar.user else None,
                'email': self.scholar.user.email if self.scholar.user else None
            } if self.scholar else None,
            'report_period_start': self.report_period_start.isoformat() if self.report_period_start else None,
            'report_period_end': self.report_period_end.isoformat() if self.report_period_end else None,
            'academic_year': self.academic_year,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'status': self.status,
            'current_stage': self.current_stage,
            'is_approved': self.is_approved,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rating': self.rating,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_relations:
            data['approvals'] = [a.to_dict() for a in self.get_all_approvals()]

        return data

    def __repr__(self):
        return f'<ProgressReport {self.id} for Scholar {self.scholar_id} - Stage: {self.current_stage}>'
