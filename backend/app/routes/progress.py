from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app import db
from app.models.progress_report import ProgressReport
from app.models.progress_report_approval import ProgressReportApproval
from app.models.committee import Committee, CommitteeMember
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
    """Submit progress report - creates approval workflow with supervisor and committee members"""
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

        report = ProgressReport(
            scholar_id=scholar.id,
            file_path=relative_path,
            file_name=filename,
            report_period_start=report_period_start,
            report_period_end=report_period_end,
            status='pending_review'
        )

        db.session.add(report)
        db.session.flush()  # Get report ID

        # Create approval records for supervisor
        if not scholar.supervisor:
            db.session.rollback()
            return jsonify({'error': 'No supervisor assigned'}), 400

        supervisor_approval = ProgressReportApproval(
            progress_report_id=report.id,
            reviewer_id=scholar.supervisor.user_id,
            reviewer_role='supervisor',
            status='pending'
        )
        db.session.add(supervisor_approval)

        # Notify supervisor
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='Progress Report Submitted - Your Review Required',
            message=f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has submitted a progress report for review.',
            notification_type='progress_report',
            priority='high',
            send_email=True
        )

        # Create approval records for doctoral committee members
        committee = Committee.query.filter_by(scholar_id=scholar.id).first()
        if committee:
            committee_members = CommitteeMember.query.filter_by(committee_id=committee.id).all()
            for member in committee_members:
                member_approval = ProgressReportApproval(
                    progress_report_id=report.id,
                    reviewer_id=member.supervisor.user_id,
                    reviewer_role='committee_member',
                    status='pending'
                )
                db.session.add(member_approval)

                # Notify committee member
                NotificationService.create_notification(
                    user_id=member.supervisor.user_id,
                    title='Progress Report Review Required',
                    message=f'Progress report from scholar {scholar.enrollment_number} ({scholar.user.name}) requires your review as a committee member.',
                    notification_type='progress_report',
                    priority='high',
                    send_email=True
                )

        db.session.commit()

        return jsonify({
            'message': 'Progress report submitted successfully. All reviewers have been notified.',
            'report': report.to_dict(include_relations=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Error submitting progress report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit progress report: {str(e)}'}), 500

@bp.route('/<int:report_id>/review', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def review_progress_report(report_id):
    """Review progress report - supervisor or committee member can approve, request changes, or reject"""
    current_user = get_current_user()
    report = ProgressReport.query.get_or_404(report_id)
    data = request.get_json()

    action = data.get('action')  # 'approve', 'changes_requested', 'reject'
    comments = data.get('comments', '')

    if action not in ['approve', 'changes_requested', 'reject']:
        return jsonify({'error': 'Invalid action. Must be approve, changes_requested, or reject'}), 400

    # Find the approval record for this reviewer
    approval = ProgressReportApproval.query.filter_by(
        progress_report_id=report.id,
        reviewer_id=current_user.id
    ).first()

    if not approval:
        return jsonify({'error': 'You are not a reviewer for this progress report'}), 403

    if approval.status != 'pending':
        return jsonify({'error': 'You have already reviewed this report'}), 400

    # Update approval status
    if action == 'approve':
        approval.status = 'approved'
    elif action == 'changes_requested':
        approval.status = 'changes_requested'
    elif action == 'reject':
        approval.status = 'rejected'

    approval.comments = comments
    approval.reviewed_at = datetime.utcnow()

    # Check if this is a rejection or change request - immediately update report status
    if action == 'reject':
        report.status = 'rejected'
        
        # Notify scholar
        NotificationService.create_notification(
            user_id=report.scholar.user_id,
            title='Progress Report Rejected',
            message=f'Your progress report has been rejected by {approval.reviewer.name}. Reason: {comments}',
            notification_type='progress_report',
            priority='high',
            send_email=True
        )

        # Notify all other reviewers that report was rejected
        other_approvals = ProgressReportApproval.query.filter(
            ProgressReportApproval.progress_report_id == report.id,
            ProgressReportApproval.id != approval.id
        ).all()
        
        for other_approval in other_approvals:
            NotificationService.create_notification(
                user_id=other_approval.reviewer_id,
                title='Progress Report Rejected',
                message=f'Progress report for scholar {report.scholar.enrollment_number} was rejected by {approval.reviewer.name}.',
                notification_type='progress_report',
                priority='medium',
                send_email=False
            )

    elif action == 'changes_requested':
        report.status = 'changes_requested'
        
        # Notify scholar
        NotificationService.create_notification(
            user_id=report.scholar.user_id,
            title='Progress Report - Changes Requested',
            message=f'{approval.reviewer.name} has requested changes to your progress report. Please review the feedback and resubmit.',
            notification_type='progress_report',
            priority='high',
            send_email=True
        )

    else:  # action == 'approve'
        # Check if ALL reviewers have approved
        all_approvals = ProgressReportApproval.query.filter_by(progress_report_id=report.id).all()
        
        all_approved = all(
            appr.status == 'approved' or appr.id == approval.id
            for appr in all_approvals
        )

        if all_approved:
            # All reviewers approved - mark report as approved
            report.status = 'approved'
            report.final_reviewed_at = datetime.utcnow()
            
            # Notify scholar of final approval
            NotificationService.create_notification(
                user_id=report.scholar.user_id,
                title='Progress Report Approved! ✅',
                message=f'Congratulations! Your progress report has been approved by all reviewers (supervisor and doctoral committee members).',
                notification_type='progress_report',
                priority='high',
                send_email=True
            )
        else:
            # Still waiting for other approvals
            report.status = 'under_review'
            
            # Notify scholar of partial approval
            pending_count = sum(1 for appr in all_approvals if appr.status == 'pending')
            NotificationService.create_notification(
                user_id=report.scholar.user_id,
                title='Progress Report Review Update',
                message=f'{approval.reviewer.name} has approved your progress report. Waiting for {pending_count} more reviewer(s).',
                notification_type='progress_report',
                priority='medium',
                send_email=False
            )

    db.session.commit()

    return jsonify({
        'message': f'Review submitted successfully - {action}',
        'report': report.to_dict(include_relations=True)
    }), 200

@bp.route('/pending-reviews', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def get_pending_reviews():
    """Get progress reports pending review by current user"""
    current_user = get_current_user()

    # Find all pending approvals for this user
    pending_approvals = ProgressReportApproval.query.filter_by(
        reviewer_id=current_user.id,
        status='pending'
    ).all()

    reports_data = []
    for approval in pending_approvals:
        report = approval.progress_report
        report_dict = report.to_dict(include_relations=True)
        report_dict['my_approval_id'] = approval.id
        report_dict['my_approval_role'] = approval.reviewer_role
        
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
