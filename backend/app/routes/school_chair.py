from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.supervisor import Supervisor
from app.models.scholar import Scholar
from app.models.synopsis import Synopsis, SynopsisApproval
from app.models.progress_report import ProgressReport
from app.models.progress_report_approval import ProgressReportApproval
from app.models.thesis import Thesis
from app.models.leave import Leave
from app.models.supervisor_change_request import SupervisorChangeRequest
from app.models.comprehensive_exam import ComprehensiveExam
from app.models.school import School
from app import db
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_

bp = Blueprint('school_chair', __name__, url_prefix='/api/school-chair')

@bp.route('/pending-approvals', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get all pending approvals for the school chair"""
    current_user = User.query.get(get_jwt_identity())

    if not current_user or current_user.role not in ['school_chair']:
        return jsonify({'error': 'Unauthorized'}), 403

    # Get school chair's school
    school = School.query.filter_by(chair_id=current_user.id).first()
    if not school:
        return jsonify({'error': 'School chair profile not found'}), 404

    school_id = school.id

    all_approvals = []

    # 1. Synopsis at school_chair stage
    synopsis_list = Synopsis.query.join(Scholar).filter(
        Scholar.school_id == school_id,
        Synopsis.current_stage == 'school_chair',
        Synopsis.status == 'with_school_chair'
    ).all()

    for synopsis in synopsis_list:
        all_approvals.append({
            'type': 'synopsis',
            'id': synopsis.id,
            'scholar': {
                'name': synopsis.scholar.user.name if synopsis.scholar.user else 'Unknown',
                'enrollment_number': synopsis.scholar.enrollment_number,
                'program': synopsis.scholar.program
            },
            'supervisor': synopsis.scholar.supervisor.user.name if synopsis.scholar.supervisor and synopsis.scholar.supervisor.user else 'Unknown',
            'submitted_at': synopsis.submission_date.isoformat() if synopsis.submission_date else None,
            'current_stage': synopsis.current_stage,
            'status': synopsis.status,
            'file_name': synopsis.file_name
        })

    # 2. Progress Reports at school_chair stage
    progress_reports = ProgressReport.query.join(Scholar).filter(
        Scholar.school_id == school_id,
        ProgressReport.current_stage == 'school_chair',
        ProgressReport.status == 'with_school_chair'
    ).all()

    for report in progress_reports:
        all_approvals.append({
            'type': 'progress-reports',
            'id': report.id,
            'scholar': {
                'name': report.scholar.user.name if report.scholar.user else 'Unknown',
                'enrollment_number': report.scholar.enrollment_number,
                'program': report.scholar.program
            },
            'supervisor': report.scholar.supervisor.user.name if report.scholar.supervisor and report.scholar.supervisor.user else 'Unknown',
            'submitted_at': report.submission_date.isoformat() if report.submission_date else None,
            'current_stage': report.current_stage,
            'status': report.status,
            'file_name': report.file_name
        })

    # 3. Thesis at school_chair stage (if applicable in your workflow)
    thesis_list = Thesis.query.join(Scholar).filter(
        Scholar.school_id == school_id,
        Thesis.current_stage == 'school_chair',
        Thesis.status == 'with_school_chair'
    ).all()

    for thesis in thesis_list:
        all_approvals.append({
            'type': 'thesis',
            'id': thesis.id,
            'scholar': {
                'name': thesis.scholar.user.name if thesis.scholar.user else 'Unknown',
                'enrollment_number': thesis.scholar.enrollment_number,
                'program': thesis.scholar.program
            },
            'supervisor': thesis.scholar.supervisor.user.name if thesis.scholar.supervisor and thesis.scholar.supervisor.user else 'Unknown',
            'submitted_at': thesis.submission_date.isoformat() if thesis.submission_date else None,
            'current_stage': thesis.current_stage,
            'status': thesis.status,
            'file_name': thesis.file_name
        })

    # 4. Leave Applications at school_chair stage
    leave_applications = Leave.query.join(Scholar).filter(
        Scholar.school_id == school_id,
        Leave.current_stage == 'school_chair'
    ).all()

    for leave in leave_applications:
        all_approvals.append({
            'type': 'leave-applications',
            'id': leave.id,
            'scholar': {
                'name': leave.scholar.user.name if leave.scholar.user else 'Unknown',
                'enrollment_number': leave.scholar.enrollment_number,
                'program': leave.scholar.program
            },
            'supervisor': leave.scholar.supervisor.user.name if leave.scholar.supervisor and leave.scholar.supervisor.user else 'Unknown',
            'submitted_at': leave.start_date.isoformat() if leave.start_date else None,
            'current_stage': 'school_chair',
            'status': leave.status,
            'file_name': None,
            'leave_type': leave.leave_type,
            'duration': f"{leave.start_date.strftime('%Y-%m-%d')} to {leave.end_date.strftime('%Y-%m-%d')}" if leave.start_date and leave.end_date else None
        })

    # 5. Supervisor Change Requests at school_chair stage
    supervisor_changes = SupervisorChangeRequest.query.join(Scholar).filter(
        Scholar.school_id == school_id,
        SupervisorChangeRequest.status == 'pending_school_chair'
    ).all()

    for change in supervisor_changes:
        all_approvals.append({
            'type': 'supervisor-change',
            'id': change.id,
            'scholar': {
                'name': change.scholar.user.name if change.scholar.user else 'Unknown',
                'enrollment_number': change.scholar.enrollment_number,
                'program': change.scholar.program
            },
            'supervisor': change.current_supervisor.user.name if change.current_supervisor and change.current_supervisor.user else 'Unknown',
            'submitted_at': change.created_at.isoformat() if change.created_at else None,
            'current_stage': 'school_chair',
            'status': change.status,
            'file_name': None,
            'new_supervisor': change.new_supervisor.user.name if change.new_supervisor and change.new_supervisor.user else 'Unknown',
            'reason': change.reason
        })

    # 6. Comprehensive Exams at school_chair stage
    comprehensive_exams = ComprehensiveExam.query.filter(
        ComprehensiveExam.school_id == school_id,
        ComprehensiveExam.status.in_(['pending_school_chair', 'with_school_chair'])
    ).all()

    for exam in comprehensive_exams:
        all_approvals.append({
            'type': 'comprehensive-exams',
            'id': exam.id,
            'scholar': {
                'name': f"{exam.program} Batch Exam" if exam.program else 'All Programs',
                'enrollment_number': 'N/A',
                'program': exam.program or 'All'
            },
            'supervisor': 'N/A',
            'submitted_at': exam.exam_date.isoformat() if exam.exam_date else None,
            'current_stage': 'school_chair',
            'status': exam.status,
            'file_name': None,
            'exam_date': exam.exam_date.isoformat() if exam.exam_date else None
        })

    return jsonify(all_approvals), 200


@bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get analytics data for school chair dashboard"""
    current_user = User.query.get(get_jwt_identity())

    if not current_user or current_user.role not in ['school_chair']:
        return jsonify({'error': 'Unauthorized'}), 403

    # Get school chair's school
    school = School.query.filter_by(chair_id=current_user.id).first()
    if not school:
        return jsonify({'error': 'School chair profile not found'}), 404

    school_id = school.id

    # Get time range from query parameter
    time_range = request.args.get('range', 'month')

    # Calculate date filter based on range
    now = datetime.utcnow()
    if time_range == 'week':
        start_date = now - timedelta(days=7)
    elif time_range == 'month':
        start_date = now - timedelta(days=30)
    elif time_range == 'quarter':
        start_date = now - timedelta(days=90)
    elif time_range == 'year':
        start_date = now - timedelta(days=365)
    else:  # 'all'
        start_date = datetime(2000, 1, 1)

    # Get all scholars in the school
    scholars = Scholar.query.filter_by(school_id=school_id).all()
    scholar_ids = [s.id for s in scholars]

    # Count submissions by type
    synopsis_count = Synopsis.query.filter(
        Synopsis.scholar_id.in_(scholar_ids),
        Synopsis.submission_date >= start_date
    ).count()

    progress_reports_count = ProgressReport.query.filter(
        ProgressReport.scholar_id.in_(scholar_ids),
        ProgressReport.submission_date >= start_date
    ).count()

    thesis_count = Thesis.query.filter(
        Thesis.scholar_id.in_(scholar_ids),
        Thesis.submission_date >= start_date
    ).count()

    leave_count = Leave.query.filter(
        Leave.scholar_id.in_(scholar_ids),
        Leave.created_at >= start_date
    ).count()

    total_submissions = synopsis_count + progress_reports_count + thesis_count + leave_count

    # Count approvals given by school chair - using approval records
    synopsis_approvals = SynopsisApproval.query.join(Synopsis).filter(
        Synopsis.scholar_id.in_(scholar_ids),
        SynopsisApproval.stage == 'school_chair',
        SynopsisApproval.decision == 'approved',
        SynopsisApproval.reviewed_at >= start_date
    ).count()

    progress_approvals = ProgressReportApproval.query.join(ProgressReport).filter(
        ProgressReport.scholar_id.in_(scholar_ids),
        ProgressReportApproval.stage == 'school_chair',
        ProgressReportApproval.status == 'approved',
        ProgressReportApproval.reviewed_at >= start_date
    ).count()

    # Thesis doesn't have approval tracking, so we count approved theses that went through school_chair stage
    thesis_approvals = Thesis.query.filter(
        Thesis.scholar_id.in_(scholar_ids),
        Thesis.is_approved == True,
        Thesis.updated_at >= start_date
    ).count()

    total_approvals = synopsis_approvals + progress_approvals + thesis_approvals

    # Count pending items
    synopsis_pending = Synopsis.query.filter(
        Synopsis.scholar_id.in_(scholar_ids),
        Synopsis.current_stage == 'school_chair',
        Synopsis.status == 'with_school_chair'
    ).count()

    progress_pending = ProgressReport.query.filter(
        ProgressReport.scholar_id.in_(scholar_ids),
        ProgressReport.current_stage == 'school_chair',
        ProgressReport.status == 'with_school_chair'
    ).count()

    thesis_pending = Thesis.query.filter(
        Thesis.scholar_id.in_(scholar_ids),
        Thesis.current_stage == 'school_chair',
        Thesis.status == 'with_school_chair'
    ).count()

    leave_pending = Leave.query.filter(
        Leave.scholar_id.in_(scholar_ids),
        Leave.current_stage == 'school_chair'
    ).count()

    pending_count = synopsis_pending + progress_pending + thesis_pending + leave_pending

    # Calculate approval rate
    approval_rate = round((total_approvals / total_submissions * 100) if total_submissions > 0 else 0, 1)

    # Calculate average review time (in days)
    # Get all approved items and calculate time from submission to approval
    # Use EXTRACT(EPOCH FROM ...) for PostgreSQL to get seconds, then divide by 86400 to get days
    synopsis_times = db.session.query(
        func.avg(
            func.extract('epoch', SynopsisApproval.reviewed_at - SynopsisApproval.submitted_at) / 86400
        )
    ).join(Synopsis).filter(
        Synopsis.scholar_id.in_(scholar_ids),
        SynopsisApproval.stage == 'school_chair',
        SynopsisApproval.decision == 'approved',
        SynopsisApproval.reviewed_at >= start_date,
        SynopsisApproval.submitted_at.isnot(None),
        SynopsisApproval.reviewed_at.isnot(None)
    ).scalar() or 0

    progress_times = db.session.query(
        func.avg(
            func.extract('epoch', ProgressReportApproval.reviewed_at - ProgressReportApproval.submitted_at) / 86400
        )
    ).join(ProgressReport).filter(
        ProgressReport.scholar_id.in_(scholar_ids),
        ProgressReportApproval.stage == 'school_chair',
        ProgressReportApproval.status == 'approved',
        ProgressReportApproval.reviewed_at >= start_date,
        ProgressReportApproval.submitted_at.isnot(None),
        ProgressReportApproval.reviewed_at.isnot(None)
    ).scalar() or 0

    avg_review_time = round((synopsis_times + progress_times) / 2 if (synopsis_times + progress_times) > 0 else 0, 1)

    # Count active projects (scholars with recent activity)
    active_projects = Scholar.query.filter(
        Scholar.school_id == school_id,
        Scholar.status == 'active'
    ).count()

    # Get faculty load distribution
    supervisors = Supervisor.query.filter_by(school_id=school_id).all()
    faculty_load = []

    for supervisor in supervisors:
        scholar_count = Scholar.query.filter_by(
            supervisor_id=supervisor.id,
            status='active'
        ).count()

        faculty_load.append({
            'name': supervisor.user.name if supervisor.user else 'Unknown',
            'students': scholar_count,
            'max_capacity': 8  # You can make this configurable
        })

    # Get recent activities (last 10 approvals) using approval records
    recent_synopsis_approvals = SynopsisApproval.query.join(Synopsis).filter(
        Synopsis.scholar_id.in_(scholar_ids),
        SynopsisApproval.stage == 'school_chair',
        SynopsisApproval.decision.in_(['approved', 'rejected']),
        SynopsisApproval.reviewed_at >= start_date
    ).order_by(SynopsisApproval.reviewed_at.desc()).limit(5).all()

    recent_progress_approvals = ProgressReportApproval.query.join(ProgressReport).filter(
        ProgressReport.scholar_id.in_(scholar_ids),
        ProgressReportApproval.stage == 'school_chair',
        ProgressReportApproval.status.in_(['approved', 'rejected']),
        ProgressReportApproval.reviewed_at >= start_date
    ).order_by(ProgressReportApproval.reviewed_at.desc()).limit(5).all()

    recent_activities = []

    for approval in recent_synopsis_approvals:
        recent_activities.append({
            'type': 'synopsis',
            'scholar_name': approval.synopsis.scholar.user.name if approval.synopsis.scholar.user else 'Unknown',
            'action': approval.decision,
            'timestamp': approval.reviewed_at.isoformat()
        })

    for approval in recent_progress_approvals:
        recent_activities.append({
            'type': 'progress-report',
            'scholar_name': approval.progress_report.scholar.user.name if approval.progress_report.scholar.user else 'Unknown',
            'action': approval.status,
            'timestamp': approval.reviewed_at.isoformat()
        })

    # Sort by timestamp and get last 10
    recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)
    recent_activities = recent_activities[:10]

    analytics_data = {
        'total_submissions': total_submissions,
        'total_approvals': total_approvals,
        'pending_count': pending_count,
        'approval_rate': approval_rate,
        'avg_review_time': avg_review_time,
        'active_projects': active_projects,
        'breakdown': {
            'synopsis': synopsis_count,
            'progress_reports': progress_reports_count,
            'thesis': thesis_count,
            'leave': leave_count
        },
        'faculty_load': faculty_load,
        'recent_activities': recent_activities
    }

    return jsonify(analytics_data), 200
