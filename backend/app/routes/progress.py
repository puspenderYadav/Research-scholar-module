from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app import db
from app.models.progress_report import ProgressReport
from app.models.progress_report_approval import ProgressReportApproval
from app.models.progress_report_reminder import ProgressReportReminder
from app.models.committee import Committee, CommitteeMember
from app.models.user import User
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file, get_file_path
from app.utils.notification_service import NotificationService
from datetime import datetime
import os

bp = Blueprint('progress', __name__, url_prefix='/api/progress-reports')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_progress_reports(scholar_id):
    """Get progress reports for a scholar"""
    reports = ProgressReport.query.filter_by(scholar_id=scholar_id).order_by(ProgressReport.submission_date.desc()).all()
    return jsonify([r.to_dict(include_relations=True) for r in reports]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('scholar')
def submit_progress_report():
    """Submit progress report - creates sequential approval workflow starting with supervisor"""
    print("=" * 50)
    print("PROGRESS REPORT SUBMISSION STARTED")
    print("=" * 50)

    try:
        current_user = get_current_user()
        print(f"Current user: {current_user.email}")
        scholar = current_user.scholar_profile

        if not scholar:
            print("ERROR: Scholar profile not found")
            return jsonify({'error': 'Scholar profile not found'}), 404

        print(f"Scholar found: {scholar.enrollment_number}")

        if 'file' not in request.files:
            print("ERROR: No file in request")
            print(f"Request files: {request.files}")
            print(f"Request form: {request.form}")
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        print(f"File received: {file.filename}")

        relative_path, filename = save_uploaded_file(file, subfolder='progress_reports')

        if not relative_path:
            print("ERROR: File upload failed")
            return jsonify({'error': 'File upload failed'}), 500

        print(f"File saved: {relative_path}")
        data = request.form

        # Parse dates
        report_period_start = None
        report_period_end = None

        if data.get('report_period_start'):
            try:
                report_period_start = datetime.fromisoformat(data['report_period_start'].replace('Z', '+00:00')).date()
            except ValueError:
                report_period_start = datetime.strptime(data['report_period_start'], '%Y-%m-%d').date()

        if data.get('report_period_end'):
            try:
                report_period_end = datetime.fromisoformat(data['report_period_end'].replace('Z', '+00:00')).date()
            except ValueError:
                report_period_end = datetime.strptime(data['report_period_end'], '%Y-%m-%d').date()

        # Get current academic year
        academic_year = ProgressReportReminder.get_current_academic_year()

        # Create progress report with sequential workflow
        report = ProgressReport(
            scholar_id=scholar.id,
            file_path=relative_path,
            file_name=filename,
            report_period_start=report_period_start,
            report_period_end=report_period_end,
            academic_year=academic_year,
            status='with_supervisor',
            current_stage='supervisor'
        )

        db.session.add(report)
        db.session.flush()  # Get report ID

        # Create approval record for supervisor ONLY (sequential workflow)
        if not scholar.supervisor:
            db.session.rollback()
            return jsonify({'error': 'No supervisor assigned'}), 400

        supervisor_approval = ProgressReportApproval(
            progress_report_id=report.id,
            stage='supervisor',
            reviewer_id=scholar.supervisor.user_id,
            reviewer_role='supervisor',
            status='pending'
        )
        db.session.add(supervisor_approval)

        # Notify supervisor
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='Progress Report Submitted - Your Review Required',
            message=f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has submitted a progress report for your review.',
            notification_type='progress_report',
            priority='high',
            related_entity_type='progress_report',
            related_entity_id=report.id,
            action_link='/progress-reports',
            send_email=True
        )

        db.session.commit()

        return jsonify({
            'message': 'Progress report submitted successfully. Supervisor has been notified.',
            'report': report.to_dict(include_relations=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error submitting progress report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit progress report: {str(e)}'}), 500

@bp.route('/<int:report_id>/approve', methods=['POST'])
@jwt_required()
def approve_progress_report(report_id):
    """Approve/reject/request changes for progress report at current stage (sequential workflow)"""
    current_user = get_current_user()
    report = ProgressReport.query.get_or_404(report_id)
    data = request.get_json()

    action = data.get('action')  # 'approved', 'rejected', 'changes_requested'
    comments = data.get('comments', '')

    if action not in ['approved', 'rejected', 'changes_requested']:
        return jsonify({'error': 'Invalid action. Must be approved, rejected, or changes_requested'}), 400

    # Find the approval record for current stage and user
    approval = ProgressReportApproval.query.filter_by(
        progress_report_id=report.id,
        stage=report.current_stage,
        reviewer_id=current_user.id
    ).first()

    # For DC/APC stage, also check committee_member approval
    if not approval and report.current_stage == 'dc_apc':
        approval = ProgressReportApproval.query.filter_by(
            progress_report_id=report.id,
            stage='dc_apc'
        ).join(CommitteeMember).filter(
            CommitteeMember.supervisor_id == current_user.supervisor_profile.id if current_user.supervisor_profile else None
        ).first()

    if not approval:
        return jsonify({'error': 'You are not authorized to review this report at the current stage'}), 403

    if approval.status != 'pending':
        return jsonify({'error': 'You have already reviewed this report'}), 400

    # Update approval record
    approval.status = action
    approval.comments = comments
    approval.reviewed_at = datetime.utcnow()

    # Handle rejection
    if action == 'rejected':
        report.status = 'rejected'

        # Notify scholar
        NotificationService.create_notification(
            user_id=report.scholar.user_id,
            title='Progress Report Rejected',
            message=f'Your progress report has been rejected by {current_user.name} at {report.current_stage} stage. Reason: {comments}',
            notification_type='progress_report',
            priority='high',
            related_entity_type='progress_report',
            related_entity_id=report.id,
            action_link='/progress-reports',
            send_email=True
        )

        db.session.commit()
        return jsonify({
            'message': 'Progress report rejected',
            'report': report.to_dict(include_relations=True)
        }), 200

    # Handle changes requested
    if action == 'changes_requested':
        report.status = 'changes_requested'

        # Notify scholar
        NotificationService.create_notification(
            user_id=report.scholar.user_id,
            title='Progress Report - Changes Requested',
            message=f'{current_user.name} has requested changes at {report.current_stage} stage. {comments}',
            notification_type='progress_report',
            priority='high',
            related_entity_type='progress_report',
            related_entity_id=report.id,
            action_link='/progress-reports',
            send_email=True
        )

        db.session.commit()
        return jsonify({
            'message': 'Changes requested',
            'report': report.to_dict(include_relations=True)
        }), 200

    # Handle approval - route to stage-specific handler
    if report.current_stage == 'supervisor':
        return _handle_supervisor_approval(report, approval, current_user)
    elif report.current_stage == 'dc_apc':
        return _handle_dc_apc_approval(report, approval, current_user)
    elif report.current_stage == 'school_chair':
        return _handle_school_chair_approval(report, approval, current_user)
    elif report.current_stage == 'ad_research':
        return _handle_ad_research_approval(report, approval, current_user)
    elif report.current_stage == 'dean_academics':
        return _handle_dean_approval(report, approval, current_user)
    else:
        db.session.rollback()
        return jsonify({'error': 'Invalid stage'}), 400

def _handle_supervisor_approval(report, approval, current_user):
    """Handle supervisor approval - move to DC/APC stage"""
    scholar = report.scholar

    # Get DC/APC committee
    committee = Committee.query.filter_by(scholar_id=scholar.id).first()
    if not committee:
        db.session.rollback()
        return jsonify({'error': 'No doctoral committee assigned to scholar'}), 400

    committee_members = CommitteeMember.query.filter_by(committee_id=committee.id).all()
    if not committee_members:
        db.session.rollback()
        return jsonify({'error': 'No committee members found'}), 400

    # Update report to next stage
    report.current_stage = 'dc_apc'
    report.status = 'with_dc_apc'

    # Create approval records for ALL DC/APC members
    for member in committee_members:
        dc_approval = ProgressReportApproval(
            progress_report_id=report.id,
            stage='dc_apc',
            reviewer_id=member.supervisor.user_id,
            reviewer_role='dc_member' if member.role == 'dc' else 'apc_member',
            committee_member_id=member.id,
            status='pending'
        )
        db.session.add(dc_approval)

        # Notify committee member
        NotificationService.create_notification(
            user_id=member.supervisor.user_id,
            title='Progress Report - DC/APC Review Required',
            message=f'Progress report from scholar {scholar.enrollment_number} has been approved by supervisor and requires your review as a committee member.',
            notification_type='progress_report',
            priority='high',
            related_entity_type='progress_report',
            related_entity_id=report.id,
            action_link='/progress-reports',
            send_email=True
        )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Progress Report - Supervisor Approved',
        message=f'Your supervisor has approved your progress report. It is now with the DC/APC committee for review.',
        notification_type='progress_report',
        priority='medium',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'Approved by supervisor. Forwarded to DC/APC committee.',
        'report': report.to_dict(include_relations=True)
    }), 200


def _handle_dc_apc_approval(report, approval, current_user):
    """Handle DC/APC member approval - check if all members approved, then move to school chair"""
    scholar = report.scholar

    # Check if ALL DC/APC members have approved
    all_dc_apc_approvals = ProgressReportApproval.query.filter_by(
        progress_report_id=report.id,
        stage='dc_apc'
    ).all()

    all_approved = all(a.status == 'approved' for a in all_dc_apc_approvals)

    if not all_approved:
        # Still waiting for other DC/APC members
        pending_count = sum(1 for a in all_dc_apc_approvals if a.status == 'pending')

        # Notify scholar of partial approval
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Progress Report - DC/APC Member Approved',
            message=f'{current_user.name} has approved your progress report. Waiting for {pending_count} more committee member(s).',
            notification_type='progress_report',
            priority='low',
            related_entity_type='progress_report',
            related_entity_id=report.id,
            action_link='/progress-reports',
            send_email=False
        )

        db.session.commit()
        return jsonify({
            'message': f'Approved. Waiting for {pending_count} more committee member(s).',
            'report': report.to_dict(include_relations=True)
        }), 200

    # All DC/APC members approved - move to school chair
    report.current_stage = 'school_chair'
    report.status = 'with_school_chair'

    # Get school chair
    school_chair = User.query.filter_by(role='school_chair').first()
    if not school_chair:
        db.session.rollback()
        return jsonify({'error': 'No school chair found in system'}), 400

    # Create approval record for school chair
    chair_approval = ProgressReportApproval(
        progress_report_id=report.id,
        stage='school_chair',
        reviewer_id=school_chair.id,
        reviewer_role='school_chair',
        status='pending'
    )
    db.session.add(chair_approval)

    # Notify school chair
    NotificationService.create_notification(
        user_id=school_chair.id,
        title='Progress Report - School Chair Review Required',
        message=f'Progress report from scholar {scholar.enrollment_number} has been approved by DC/APC and requires your review.',
        notification_type='progress_report',
        priority='high',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=True
    )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Progress Report - DC/APC Approved',
        message=f'All DC/APC members have approved your progress report. It is now with the School Chair for review.',
        notification_type='progress_report',
        priority='medium',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'All DC/APC members approved. Forwarded to School Chair.',
        'report': report.to_dict(include_relations=True)
    }), 200


def _handle_school_chair_approval(report, approval, current_user):
    """Handle school chair approval - move to AD Research"""
    scholar = report.scholar

    # Update report to next stage
    report.current_stage = 'ad_research'
    report.status = 'with_ad_research'

    # Get AD Research
    ad_research = User.query.filter_by(role='ad_research').first()
    if not ad_research:
        db.session.rollback()
        return jsonify({'error': 'No AD Research found in system'}), 400

    # Create approval record
    ad_approval = ProgressReportApproval(
        progress_report_id=report.id,
        stage='ad_research',
        reviewer_id=ad_research.id,
        reviewer_role='ad_research',
        status='pending'
    )
    db.session.add(ad_approval)

    # Notify AD Research
    NotificationService.create_notification(
        user_id=ad_research.id,
        title='Progress Report - AD Research Review Required',
        message=f'Progress report from scholar {scholar.enrollment_number} has been approved by School Chair and requires your review.',
        notification_type='progress_report',
        priority='high',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=True
    )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Progress Report - School Chair Approved',
        message=f'School Chair has approved your progress report. It is now with AD Research for review.',
        notification_type='progress_report',
        priority='medium',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'Approved by School Chair. Forwarded to AD Research.',
        'report': report.to_dict(include_relations=True)
    }), 200


def _handle_ad_research_approval(report, approval, current_user):
    """Handle AD Research approval - move to Dean Academics"""
    scholar = report.scholar

    # Update report to next stage
    report.current_stage = 'dean_academics'
    report.status = 'with_dean'

    # Get Dean Academics
    dean = User.query.filter_by(role='dean_academics').first()
    if not dean:
        db.session.rollback()
        return jsonify({'error': 'No Dean Academics found in system'}), 400

    # Create approval record
    dean_approval = ProgressReportApproval(
        progress_report_id=report.id,
        stage='dean_academics',
        reviewer_id=dean.id,
        reviewer_role='dean_academics',
        status='pending'
    )
    db.session.add(dean_approval)

    # Notify Dean
    NotificationService.create_notification(
        user_id=dean.id,
        title='Progress Report - Dean Final Review Required',
        message=f'Progress report from scholar {scholar.enrollment_number} has been approved by AD Research and requires your final review.',
        notification_type='progress_report',
        priority='high',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=True
    )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Progress Report - AD Research Approved',
        message=f'AD Research has approved your progress report. It is now with Dean Academics for final review.',
        notification_type='progress_report',
        priority='medium',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'Approved by AD Research. Forwarded to Dean Academics.',
        'report': report.to_dict(include_relations=True)
    }), 200


def _handle_dean_approval(report, approval, current_user):
    """Handle Dean Academics approval - final approval, mark as complete"""
    scholar = report.scholar

    # Mark report as fully approved
    report.is_approved = True
    report.approved_at = datetime.utcnow()
    report.status = 'approved'

    # Update any pending reminder for this academic year
    reminder = ProgressReportReminder.query.filter_by(
        scholar_id=scholar.id,
        academic_year=report.academic_year
    ).first()

    if reminder:
        reminder.submitted = True
        reminder.submission_date = datetime.utcnow()
        reminder.status = 'submitted'
        reminder.progress_report_id = report.id

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Progress Report Fully Approved!',
        message=f'Congratulations! Your progress report has been approved by Dean Academics. The report is now officially submitted.',
        notification_type='progress_report',
        priority='high',
        related_entity_type='progress_report',
        related_entity_id=report.id,
        action_link='/progress-reports',
        send_email=True
    )

    db.session.commit()
    return jsonify({
        'message': 'Progress report fully approved by Dean Academics!',
        'report': report.to_dict(include_relations=True)
    }), 200


@bp.route('/pending-reviews', methods=['GET'])
@jwt_required()
def get_pending_reviews():
    """Get progress reports pending review by current user (stage-based)"""
    current_user = get_current_user()

    # Find all pending approvals for this user at their current stage
    pending_approvals = ProgressReportApproval.query.filter_by(
        reviewer_id=current_user.id,
        status='pending'
    ).all()

    reports_data = []
    for approval in pending_approvals:
        report = approval.progress_report

        # Only include if report is at the stage where this approval is needed
        if report.current_stage != approval.stage:
            continue

        report_dict = report.to_dict(include_relations=True)
        report_dict['my_approval_id'] = approval.id
        report_dict['my_approval_role'] = approval.reviewer_role
        report_dict['my_approval_stage'] = approval.stage

        # Add scholar info
        scholar = report.scholar
        report_dict['scholar'] = {
            'id': scholar.id,
            'name': scholar.user.name,
            'enrollment_number': scholar.enrollment_number,
            'program': scholar.program,
            'research_area': scholar.research_area
        }

        reports_data.append(report_dict)

    return jsonify(reports_data), 200

@bp.route('/<int:report_id>/download', methods=['GET'])
@jwt_required()
def download_report(report_id):
    """Download progress report file"""
    report = ProgressReport.query.get_or_404(report_id)
    
    file_path = get_file_path(report.file_path)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(file_path, as_attachment=True, download_name=report.file_name)

@bp.route('/<int:report_id>', methods=['GET'])
@jwt_required()
def get_report_details(report_id):
    """Get detailed information about a specific progress report"""
    report = ProgressReport.query.get_or_404(report_id)

    report_dict = report.to_dict(include_relations=True)

    # Add scholar info
    scholar = report.scholar
    report_dict['scholar'] = {
        'id': scholar.id,
        'name': scholar.user.name,
        'enrollment_number': scholar.enrollment_number,
        'program': scholar.program,
        'research_area': scholar.research_area
    }

    return jsonify(report_dict), 200


@bp.route('/my-reports', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_my_reports():
    """Get all progress reports for current scholar"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    reports = ProgressReport.query.filter_by(scholar_id=scholar.id).order_by(
        ProgressReport.submission_date.desc()
    ).all()

    return jsonify([r.to_dict(include_relations=True) for r in reports]), 200


@bp.route('/my-reminders', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_my_reminders():
    """Get progress report reminders for current scholar"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    reminders = ProgressReportReminder.query.filter_by(scholar_id=scholar.id).order_by(
        ProgressReportReminder.due_date.desc()
    ).all()

    return jsonify([r.to_dict() for r in reminders]), 200


@bp.route('/reminders', methods=['GET'])
@jwt_required()
@role_required('research_office')
def get_all_reminders():
    """Get all progress report reminders (research office only)"""
    status_filter = request.args.get('status')  # pending, overdue, submitted

    query = ProgressReportReminder.query

    if status_filter:
        query = query.filter_by(status=status_filter)

    reminders = query.order_by(ProgressReportReminder.due_date.asc()).all()

    result = []
    for reminder in reminders:
        reminder_dict = reminder.to_dict()
        reminder_dict['scholar'] = {
            'id': reminder.scholar.id,
            'name': reminder.scholar.user.name,
            'enrollment_number': reminder.scholar.enrollment_number
        }
        result.append(reminder_dict)

    return jsonify(result), 200


@bp.route('/pending/dc-apc', methods=['GET'])
@jwt_required()
def get_pending_dc_apc():
    """Get progress reports pending DC/APC review - shows individual member status"""
    current_user = get_current_user()

    # Find all progress reports at dc_apc stage
    reports_at_dc_apc = ProgressReport.query.filter_by(current_stage='dc_apc').all()

    reports_data = []
    for report in reports_at_dc_apc:
        # Get all DC/APC approvals for this report
        dc_apc_approvals = ProgressReportApproval.query.filter_by(
            progress_report_id=report.id,
            stage='dc_apc'
        ).all()

        # Check if current user is one of the reviewers
        user_approval = next(
            (a for a in dc_apc_approvals if a.reviewer_id == current_user.id),
            None
        )

        report_dict = report.to_dict(include_relations=True)
        report_dict['scholar'] = {
            'id': report.scholar.id,
            'name': report.scholar.user.name,
            'enrollment_number': report.scholar.enrollment_number
        }

        # Add approval status breakdown
        report_dict['dc_apc_approvals'] = [
            {
                'reviewer_name': a.reviewer.name,
                'reviewer_id': a.reviewer_id,
                'status': a.status,
                'comments': a.comments,
                'reviewed_at': a.reviewed_at.isoformat() if a.reviewed_at else None,
                'is_current_user': a.reviewer_id == current_user.id
            }
            for a in dc_apc_approvals
        ]

        report_dict['user_can_review'] = user_approval is not None
        report_dict['user_has_reviewed'] = user_approval.status != 'pending' if user_approval else False

        reports_data.append(report_dict)

    return jsonify(reports_data), 200
