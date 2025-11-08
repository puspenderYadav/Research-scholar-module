from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.progress_report import ProgressReport
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('progress', __name__, url_prefix='/api/progress-reports')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_progress_reports(scholar_id):
    """Get progress reports for a scholar"""
    reports = ProgressReport.query.filter_by(scholar_id=scholar_id).order_by(ProgressReport.submission_date.desc()).all()
    return jsonify([r.to_dict() for r in reports]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('scholar')
def submit_progress_report():
    """Submit progress report"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    relative_path, filename = save_uploaded_file(file, subfolder='progress_reports')

    if not relative_path:
        return jsonify({'error': 'File upload failed'}), 500

    data = request.form

    report = ProgressReport(
        scholar_id=scholar.id,
        file_path=relative_path,
        file_name=filename,
        report_period_start=datetime.fromisoformat(data['report_period_start']) if data.get('report_period_start') else None,
        report_period_end=datetime.fromisoformat(data['report_period_end']) if data.get('report_period_end') else None,
        status='submitted'
    )

    db.session.add(report)
    db.session.commit()

    # Notify supervisor
    if scholar.supervisor:
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='Progress Report Submitted',
            message=f'Scholar {scholar.enrollment_number} has submitted a progress report',
            notification_type='submission',
            priority='medium',
            related_entity_type='progress_report',
            related_entity_id=report.id
        )

    return jsonify(report.to_dict()), 201

@bp.route('/<int:report_id>/review', methods=['POST'])
@jwt_required()
@role_required('supervisor', 'dean_academics')
def review_progress_report(report_id):
    """Review progress report"""
    current_user = get_current_user()
    report = ProgressReport.query.get_or_404(report_id)
    data = request.get_json()

    status = data.get('status')
    feedback = data.get('feedback', '')
    rating = data.get('rating')

    if status not in ['accepted', 'changes_requested', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400

    report.status = status
    report.reviewed_by = current_user.id
    report.reviewed_at = datetime.utcnow()
    report.feedback = feedback
    report.rating = rating

    db.session.commit()

    # Notify scholar
    NotificationService.notify_submission_reviewed(
        report.scholar.user_id, 'progress_report', report.id, status, feedback
    )

    return jsonify(report.to_dict()), 200
