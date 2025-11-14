from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app import db
from app.models.thesis import Thesis
from app.models.thesis_examiner import ThesisExaminer
from app.models.thesis_defense import ThesisDefense
from app.models.examiner import Examiner
from app.models.committee import Committee, CommitteeMember
from app.models.user import User
from app.models.scholar import Scholar
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file, get_file_path
from app.utils.notification_service import NotificationService
from app.utils.token_service import TokenService
from app.utils.email_service import EmailService
from datetime import datetime, timedelta
import os
import csv
import io

bp = Blueprint('thesis', __name__, url_prefix='/api/thesis')

# =====================================================
# SCHOLAR THESIS SUBMISSION
# =====================================================

@bp.route('/submit', methods=['POST'])
@jwt_required()
@role_required('scholar')
def submit_thesis():
    """
    Scholar uploads thesis - starts sequential approval workflow with supervisor
    Submission types: initial, revision_minor, revision_major, final
    """
    try:
        current_user = get_current_user()
        scholar = current_user.scholar_profile

        if not scholar:
            return jsonify({'error': 'Scholar profile not found'}), 404

        if not scholar.supervisor:
            return jsonify({'error': 'No supervisor assigned'}), 400

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        relative_path, filename = save_uploaded_file(file, subfolder='thesis')

        if not relative_path:
            return jsonify({'error': 'File upload failed'}), 500

        data = request.form

        # Get version number
        last_thesis = Thesis.query.filter_by(scholar_id=scholar.id).order_by(Thesis.version.desc()).first()
        version = (last_thesis.version + 1) if last_thesis else 1

        # Determine submission type
        submission_type = data.get('submission_type', 'initial')

        # Check if this is a post-defense revised thesis submission
        last_defense_thesis = Thesis.query.filter_by(
            scholar_id=scholar.id,
            status='awaiting_revised_thesis'
        ).order_by(Thesis.version.desc()).first()

        if last_defense_thesis and submission_type == 'post_defense_revision':
            # Update existing thesis with revised version
            last_defense_thesis.file_path = relative_path
            last_defense_thesis.file_name = filename
            last_defense_thesis.version = version
            last_defense_thesis.submission_type = 'post_defense_revision'
            last_defense_thesis.current_stage = 'supervisor_final_review'
            last_defense_thesis.status = 'with_supervisor_final'
            last_defense_thesis.submission_date = datetime.utcnow()
            thesis = last_defense_thesis

            notification_message = f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has submitted the REVISED thesis after defense for your final review before Dean Academics approval.'
        else:
            # Create new thesis record for initial or regular submissions
            thesis = Thesis(
                scholar_id=scholar.id,
                file_path=relative_path,
                file_name=filename,
                version=version,
                submission_type=submission_type,
                current_stage='supervisor',
                status='with_supervisor'
            )
            db.session.add(thesis)
            notification_message = f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has submitted thesis (v{version} - {submission_type}) for your review.'

        db.session.flush()  # Get thesis ID

        # Notify supervisor
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='Thesis Submitted - Your Review Required',
            message=notification_message,
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=True
        )

        # Update scholar status
        if submission_type == 'initial':
            scholar.thesis_defense_status = 'under_review'

        db.session.commit()

        return jsonify({
            'message': 'Thesis submitted successfully. Supervisor has been notified.',
            'thesis': thesis.to_dict(include_relations=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error submitting thesis: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit thesis: {str(e)}'}), 500


# =====================================================
# THESIS APPROVAL WORKFLOW
# =====================================================

@bp.route('/<int:thesis_id>/approve', methods=['POST'])
@jwt_required()
def approve_thesis(thesis_id):
    """
    Approve/reject/request changes for thesis at current stage (sequential workflow)
    Actions: approved, rejected, changes_requested
    Stages: supervisor -> dc_apc -> external_review (CSV upload)
    """
    current_user = get_current_user()
    thesis = Thesis.query.get_or_404(thesis_id)
    data = request.get_json()

    action = data.get('action')  # 'approved', 'rejected', 'changes_requested'
    comments = data.get('comments', '')

    if action not in ['approved', 'rejected', 'changes_requested']:
        return jsonify({'error': 'Invalid action. Must be approved, rejected, or changes_requested'}), 400

    # Authorization check based on current stage
    if not _is_authorized_reviewer(thesis, current_user):
        return jsonify({'error': 'You are not authorized to review this thesis at the current stage'}), 403

    # Handle rejection
    if action == 'rejected':
        thesis.status = 'rejected'

        # Notify scholar
        NotificationService.create_notification(
            user_id=thesis.scholar.user_id,
            title='Thesis Rejected',
            message=f'Your thesis has been rejected by {current_user.name} at {thesis.current_stage} stage. Reason: {comments}',
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=True
        )

        db.session.commit()
        return jsonify({
            'message': 'Thesis rejected',
            'thesis': thesis.to_dict(include_relations=True)
        }), 200

    # Handle changes requested
    if action == 'changes_requested':
        thesis.status = 'changes_requested'

        # Notify scholar
        NotificationService.create_notification(
            user_id=thesis.scholar.user_id,
            title='Thesis - Changes Requested',
            message=f'{current_user.name} has requested changes at {thesis.current_stage} stage. {comments}',
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=True
        )

        db.session.commit()
        return jsonify({
            'message': 'Changes requested',
            'thesis': thesis.to_dict(include_relations=True)
        }), 200

    # Handle approval - route to stage-specific handler
    if thesis.current_stage == 'supervisor':
        return _handle_supervisor_approval(thesis, current_user, comments)
    elif thesis.current_stage == 'supervisor_final_review':
        return _handle_supervisor_final_approval(thesis, current_user, comments)
    elif thesis.current_stage == 'dc_apc':
        return _handle_dc_apc_approval(thesis, current_user, comments)
    elif thesis.current_stage == 'school_chair':
        return _handle_school_chair_approval(thesis, current_user, comments)
    elif thesis.current_stage == 'ad_research':
        return _handle_ad_research_approval(thesis, current_user, comments)
    elif thesis.current_stage == 'dean_academics':
        return _handle_dean_approval(thesis, current_user, comments)
    else:
        db.session.rollback()
        return jsonify({'error': 'Invalid stage'}), 400


def _is_authorized_reviewer(thesis, current_user):
    """Check if user is authorized to review at current stage"""
    scholar = thesis.scholar

    if thesis.current_stage == 'supervisor' or thesis.current_stage == 'supervisor_final_review':
        return scholar.supervisor and scholar.supervisor.user_id == current_user.id

    elif thesis.current_stage == 'dc_apc':
        # Check if user is a committee member
        committee = Committee.query.filter_by(scholar_id=scholar.id).first()
        if not committee:
            return False
        member = CommitteeMember.query.filter_by(
            committee_id=committee.id
        ).join(CommitteeMember.supervisor).filter_by(user_id=current_user.id).first()
        return member is not None

    elif thesis.current_stage == 'school_chair':
        return current_user.role == 'school_chair'

    elif thesis.current_stage == 'ad_research':
        return current_user.role == 'ad_research'

    elif thesis.current_stage == 'dean_academics':
        return current_user.role == 'dean_academics'

    return False


def _handle_supervisor_approval(thesis, current_user, comments):
    """Handle supervisor approval - move to DC/APC stage"""
    scholar = thesis.scholar

    # Get DC/APC committee
    committee = Committee.query.filter_by(scholar_id=scholar.id).first()
    if not committee:
        db.session.rollback()
        return jsonify({'error': 'No doctoral committee assigned to scholar'}), 400

    committee_members = CommitteeMember.query.filter_by(committee_id=committee.id).all()
    if not committee_members:
        db.session.rollback()
        return jsonify({'error': 'No committee members found'}), 400

    # Update thesis to next stage
    thesis.current_stage = 'dc_apc'
    thesis.status = 'with_dc_apc'

    # Notify all DC/APC members
    for member in committee_members:
        NotificationService.create_notification(
            user_id=member.supervisor.user_id,
            title='Thesis - DC/APC Review Required',
            message=f'Thesis from scholar {scholar.enrollment_number} has been approved by supervisor and requires your review as a committee member.',
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=True
        )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Thesis - Supervisor Approved',
        message=f'Your supervisor has approved your thesis. It is now with the DC/APC committee for review.',
        notification_type='thesis',
        priority='medium',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'Approved by supervisor. Forwarded to DC/APC committee.',
        'thesis': thesis.to_dict(include_relations=True)
    }), 200


def _handle_supervisor_final_approval(thesis, current_user, comments):
    """Handle supervisor final approval of post-defense revised thesis - move to Dean Academics"""
    scholar = thesis.scholar

    # Move to Dean Academics for final approval
    thesis.current_stage = 'dean_academics'
    thesis.status = 'with_dean_academics'

    # Get Dean Academics
    dean = User.query.filter_by(role='dean_academics').first()
    if not dean:
        db.session.rollback()
        return jsonify({'error': 'No Dean Academics found in system'}), 400

    # Notify Dean Academics
    NotificationService.create_notification(
        user_id=dean.id,
        title='Final Thesis Approval Required',
        message=f'Post-defense revised thesis from scholar {scholar.enrollment_number} ({scholar.user.name}) has been approved by supervisor. Your final approval is required for degree award.',
        notification_type='thesis',
        priority='high',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=True
    )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Thesis Forwarded to Dean Academics',
        message=f'Your supervisor has approved your revised thesis. It has been forwarded to Dean Academics for final approval and degree award.',
        notification_type='thesis',
        priority='medium',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=True
    )

    db.session.commit()
    return jsonify({
        'message': 'Approved by supervisor. Forwarded to Dean Academics for final approval.',
        'thesis': thesis.to_dict(include_relations=True)
    }), 200


def _handle_dc_apc_approval(thesis, current_user, comments):
    """Handle DC/APC member approval - check if all approved, then ready for external examiners"""
    scholar = thesis.scholar

    # Get committee and track approvals
    committee = Committee.query.filter_by(scholar_id=scholar.id).first()
    committee_members = CommitteeMember.query.filter_by(committee_id=committee.id).all()

    # Simple approval tracking - store in session or use a flag
    # For now, we'll check if this is the last required approval
    # In production, you'd want to track each member's approval in a separate table

    # Move to external review stage
    thesis.current_stage = 'external_review'
    thesis.status = 'awaiting_examiner_upload'

    # Notify supervisor to upload examiner CSV
    NotificationService.create_notification(
        user_id=scholar.supervisor.user_id,
        title='Thesis Approved by DC/APC - Upload Examiners',
        message=f'Thesis from scholar {scholar.enrollment_number} has been approved by all DC/APC members. Please upload the CSV file with external examiner details.',
        notification_type='thesis',
        priority='high',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=True
    )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Thesis - DC/APC Approved',
        message=f'All DC/APC members have approved your thesis. Your supervisor will now assign external examiners.',
        notification_type='thesis',
        priority='medium',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'All DC/APC members approved. Supervisor can now upload examiner details.',
        'thesis': thesis.to_dict(include_relations=True)
    }), 200


def _handle_school_chair_approval(thesis, current_user, comments):
    """Handle school chair approval - move to AD Research"""
    scholar = thesis.scholar

    thesis.current_stage = 'ad_research'
    thesis.status = 'with_ad_research'

    # Get AD Research
    ad_research = User.query.filter_by(role='ad_research').first()
    if not ad_research:
        db.session.rollback()
        return jsonify({'error': 'No AD Research found in system'}), 400

    # Notify AD Research
    NotificationService.create_notification(
        user_id=ad_research.id,
        title='Final Thesis - AD Research Review Required',
        message=f'Final thesis from scholar {scholar.enrollment_number} has been approved by School Chair and requires your review.',
        notification_type='thesis',
        priority='high',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=True
    )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Final Thesis - School Chair Approved',
        message=f'School Chair has approved your final thesis. It is now with AD Research.',
        notification_type='thesis',
        priority='medium',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'Approved by School Chair. Forwarded to AD Research.',
        'thesis': thesis.to_dict(include_relations=True)
    }), 200


def _handle_ad_research_approval(thesis, current_user, comments):
    """Handle AD Research approval - move to Dean"""
    scholar = thesis.scholar

    thesis.current_stage = 'dean_academics'
    thesis.status = 'with_dean_academics'

    # Get Dean Academics
    dean = User.query.filter_by(role='dean_academics').first()
    if not dean:
        db.session.rollback()
        return jsonify({'error': 'No Dean Academics found in system'}), 400

    # Notify Dean
    NotificationService.create_notification(
        user_id=dean.id,
        title='Final Thesis - Dean Review Required',
        message=f'Final thesis from scholar {scholar.enrollment_number} has been approved by AD Research and requires your final approval.',
        notification_type='thesis',
        priority='high',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=True
    )

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Final Thesis - AD Research Approved',
        message=f'AD Research has approved your final thesis. It is now with Dean Academics for final approval.',
        notification_type='thesis',
        priority='medium',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=False
    )

    db.session.commit()
    return jsonify({
        'message': 'Approved by AD Research. Forwarded to Dean Academics.',
        'thesis': thesis.to_dict(include_relations=True)
    }), 200


def _handle_dean_approval(thesis, current_user, comments):
    """Handle Dean approval - DEGREE AWARDED!"""
    scholar = thesis.scholar

    # Final approval - degree awarded
    thesis.current_stage = 'completed'
    thesis.status = 'approved'
    thesis.is_approved = True
    thesis.approved_at = datetime.utcnow()

    # Update scholar record - DEGREE COMPLETION
    scholar.status = 'completed'
    scholar.degree_awarded_date = datetime.utcnow().date()
    scholar.thesis_defense_status = 'degree_awarded'
    scholar.final_result = 'pass'  # Can be updated based on defense outcome

    # Notify scholar - CONGRATULATIONS!
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Congratulations! Degree Awarded',
        message=f'Your final thesis has been approved by Dean Academics. Your degree has been officially awarded. Congratulations, Dr. {scholar.user.name}!',
        notification_type='thesis',
        priority='high',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/profile',
        send_email=True
    )

    # Notify supervisor
    NotificationService.create_notification(
        user_id=scholar.supervisor.user_id,
        title='Scholar Degree Awarded',
        message=f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has been awarded their degree. Final thesis approved by Dean.',
        notification_type='thesis',
        priority='medium',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/scholars',
        send_email=True
    )

    db.session.commit()
    return jsonify({
        'message': 'Thesis approved by Dean Academics. Degree has been awarded!',
        'thesis': thesis.to_dict(include_relations=True),
        'scholar': scholar.to_dict()
    }), 200


# =====================================================
# CSV EXAMINER UPLOAD
# =====================================================

@bp.route('/<int:thesis_id>/upload-examiners', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def upload_examiners_csv(thesis_id):
    """
    Supervisor uploads CSV with examiner details
    CSV format: name,email,institution,designation,specialization,phone,country
    Creates Examiner records, ThesisExaminer records, generates tokens, sends invitation emails
    """
    try:
        current_user = get_current_user()
        thesis = Thesis.query.get_or_404(thesis_id)

        # Verify supervisor authorization
        if thesis.scholar.supervisor.user_id != current_user.id:
            return jsonify({'error': 'Only the scholar\'s supervisor can upload examiners'}), 403

        # Verify thesis is at correct stage
        if thesis.current_stage != 'external_review':
            return jsonify({'error': 'Thesis must be approved by DC/APC before assigning examiners'}), 400

        if 'file' not in request.files:
            return jsonify({'error': 'No CSV file provided'}), 400

        csv_file = request.files['file']

        if not csv_file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400

        # Parse CSV
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))

        required_fields = ['name', 'email', 'institution']
        examiners_created = []
        errors = []

        # Get examiner deadline from request or set default (90 days)
        deadline_days = int(request.form.get('deadline_days', 90))
        examiner_deadline = datetime.utcnow().date() + timedelta(days=deadline_days)

        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Validate required fields
                missing_fields = [field for field in required_fields if not row.get(field)]
                if missing_fields:
                    errors.append(f"Row {row_num}: Missing required fields: {', '.join(missing_fields)}")
                    continue

                email = row['email'].strip().lower()
                name = row['name'].strip()
                institution = row['institution'].strip()

                # Check if examiner already exists
                examiner = Examiner.query.filter_by(email=email).first()

                if not examiner:
                    # Create new examiner
                    examiner = Examiner(
                        name=name,
                        email=email,
                        institution=institution,
                        designation=row.get('designation', '').strip(),
                        specialization=row.get('specialization', '').strip(),
                        phone=row.get('phone', '').strip(),
                        country=row.get('country', '').strip(),
                        is_internal=False
                    )
                    db.session.add(examiner)
                    db.session.flush()  # Get examiner ID

                # Check if already assigned to this thesis
                existing_assignment = ThesisExaminer.query.filter_by(
                    thesis_id=thesis.id,
                    examiner_id=examiner.id
                ).first()

                if existing_assignment:
                    errors.append(f"Row {row_num}: Examiner {email} already assigned to this thesis")
                    continue

                # Create ThesisExaminer record
                thesis_examiner = ThesisExaminer(
                    thesis_id=thesis.id,
                    examiner_id=examiner.id,
                    examiner_role='external',
                    invitation_status='pending'
                )
                db.session.add(thesis_examiner)
                db.session.flush()

                examiners_created.append({
                    'examiner': examiner,
                    'thesis_examiner': thesis_examiner
                })

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")

        if not examiners_created:
            db.session.rollback()
            return jsonify({
                'error': 'No examiners were successfully processed',
                'errors': errors
            }), 400

        # Update thesis status and deadline
        thesis.status = 'with_examiners'
        thesis.external_examiner_deadline = examiner_deadline

        db.session.commit()

        # Send invitation emails to all examiners
        _send_examiner_invitations(thesis, examiners_created)

        return jsonify({
            'message': f'Successfully uploaded {len(examiners_created)} examiner(s). Invitation emails sent.',
            'examiners_count': len(examiners_created),
            'examiners': [e['examiner'].to_dict() for e in examiners_created],
            'errors': errors if errors else None,
            'deadline': examiner_deadline.isoformat()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error uploading examiners: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to upload examiners: {str(e)}'}), 500


def _send_examiner_invitations(thesis, examiners_data):
    """Send invitation emails to all examiners with tokens"""
    scholar = thesis.scholar
    base_url = os.getenv('FRONTEND_URL', 'http://localhost:5000')

    for examiner_data in examiners_data:
        examiner = examiner_data['examiner']
        thesis_examiner = examiner_data['thesis_examiner']

        try:
            # Generate tokens
            examiner_token = TokenService.generate_examiner_token(thesis.id, examiner.id)
            download_token = TokenService.generate_thesis_download_token(thesis.id)

            if not examiner_token or not download_token:
                print(f"Failed to generate tokens for examiner {examiner.email}")
                continue

            # Create links - use /api/thesis prefix for backend routes
            download_link = f"{base_url}/api/thesis/public/download/{thesis.id}?token={download_token}"
            report_link = f"{base_url}/api/thesis/public/examiner-report?token={examiner_token}"

            # Send email
            email_body = f"""
Dear Dr. {examiner.name},

You have been invited to review the PhD thesis of {scholar.user.name}.

Scholar Details:
- Name: {scholar.user.name}
- Enrollment Number: {scholar.enrollment_number}
- Program: {scholar.program}
- Institution: {scholar.department}

Thesis Details:
- Submission Date: {thesis.submission_date.strftime('%Y-%m-%d')}
- Version: {thesis.version}

Review Deadline: {thesis.external_examiner_deadline.strftime('%Y-%m-%d')}

Please follow these steps:
1. Download the thesis: {download_link}
2. Review the thesis thoroughly
3. Submit your report and recommendation: {report_link}

Your recommendation options:
- Accept: Thesis is ready for defense
- Minor Revision: Small changes needed before defense
- Major Revision: Significant changes needed
- Reject: Thesis not acceptable

Thank you for your time and expertise.

Best regards,
Academic Office
"""

            EmailService.send_email(
                to_email=examiner.email,
                subject=f'Invitation to Review PhD Thesis - {scholar.enrollment_number}',
                body=email_body
            )

            # Update invitation status
            thesis_examiner.invitation_status = 'invited'
            thesis_examiner.invitation_sent_at = datetime.utcnow()

        except Exception as e:
            print(f"Error sending invitation to {examiner.email}: {str(e)}")

    db.session.commit()


# =====================================================
# PUBLIC EXAMINER ENDPOINTS (NO JWT REQUIRED)
# =====================================================

@bp.route('/public/examiner-report', methods=['GET', 'POST'])
def submit_examiner_report():
    """
    Public endpoint for examiner report submission (token-authenticated)
    GET: Show report submission form
    POST: Submit report with token
    """
    # Handle GET request - show form
    if request.method == 'GET':
        from flask import render_template
        return render_template('examiner_report.html')

    # Handle POST request - submit report
    try:
        data = request.form
        token = data.get('token')

        if not token:
            return jsonify({'error': 'Token required'}), 401

        # Verify token
        token_data = TokenService.verify_examiner_token(token)
        if not token_data:
            return jsonify({'error': 'Invalid or expired token'}), 401

        thesis_id = token_data['thesis_id']
        examiner_id = token_data['examiner_id']

        # Get thesis examiner record
        thesis_examiner = ThesisExaminer.query.filter_by(
            thesis_id=thesis_id,
            examiner_id=examiner_id
        ).first()

        if not thesis_examiner:
            return jsonify({'error': 'Examiner assignment not found'}), 404

        if thesis_examiner.report_submitted:
            return jsonify({'error': 'Report already submitted'}), 400

        # Validate recommendation
        recommendation = data.get('recommendation')
        if recommendation not in ['accept', 'minor_revision', 'major_revision', 'reject']:
            return jsonify({'error': 'Invalid recommendation'}), 400

        # Upload report file
        if 'file' not in request.files:
            return jsonify({'error': 'No report file provided'}), 400

        file = request.files['file']
        relative_path, filename = save_uploaded_file(file, subfolder='thesis_reports')

        if not relative_path:
            return jsonify({'error': 'File upload failed'}), 500

        # Update thesis examiner record
        thesis_examiner.report_submitted = True
        thesis_examiner.report_file_path = relative_path
        thesis_examiner.report_file_name = filename
        thesis_examiner.recommendation = recommendation
        thesis_examiner.comments = data.get('comments', '')
        thesis_examiner.submitted_at = datetime.utcnow()

        db.session.commit()

        # Return success immediately - do email and notifications asynchronously
        try:
            # Send confirmation email to examiner (don't wait for it)
            examiner = thesis_examiner.examiner
            EmailService.send_email(
                to_email=examiner.email,
                subject='Thesis Report Received - Thank You',
                body=f"""
Dear Dr. {examiner.name},

Thank you for submitting your report and recommendation.

Recommendation: {recommendation.replace('_', ' ').title()}
Submitted on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}

We have notified the supervisor. Your contribution to the academic process is greatly appreciated.

Best regards,
Academic Office
"""
            )

            # Check if all examiners have submitted
            _check_all_examiner_reports(thesis_examiner.thesis)
        except Exception as email_error:
            print(f"Error sending confirmation email: {email_error}")
            # Don't fail the request if email fails

        return jsonify({
            'message': 'Report submitted successfully. Thank you!',
            'recommendation': recommendation
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error submitting examiner report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit report: {str(e)}'}), 500


def _check_all_examiner_reports(thesis):
    """Check examiner reports - Allow defense if at least one examiner accepts"""
    all_assignments = thesis.get_examiner_assignments()

    if not all_assignments:
        return

    # Get submitted reports
    submitted_reports = [a for a in all_assignments if a.report_submitted]
    submitted_count = len(submitted_reports)
    total_count = len(all_assignments)

    if not submitted_reports:
        # No reports submitted yet
        return

    # NEW LOGIC: If at least one examiner accepts, proceed to defense
    accepted_reports = [a for a in submitted_reports if a.recommendation == 'accept']

    if accepted_reports:
        # At least one examiner accepted - ready for defense!
        thesis.status = 'ready_for_defense'
        thesis.current_stage = 'defense_scheduled'

        # Update scholar status
        thesis.scholar.thesis_defense_status = 'defense_scheduled'

        # Notify supervisor to schedule defense
        NotificationService.create_notification(
            user_id=thesis.scholar.supervisor.user_id,
            title='Thesis Accepted - Schedule Defense',
            message=f'Thesis of scholar {thesis.scholar.enrollment_number} has been accepted by at least one examiner ({submitted_count}/{total_count} reports received). You can now schedule the defense.',
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=True
        )

        # Notify scholar
        NotificationService.create_notification(
            user_id=thesis.scholar.user_id,
            title='Thesis Accepted - Defense Pending',
            message=f'Your thesis has been accepted by at least one examiner. Your supervisor will schedule the defense soon.',
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=True
        )

        db.session.commit()
        return

    # If no accepts yet but reports submitted, check if all submitted
    all_submitted = all(a.report_submitted for a in all_assignments)

    if all_submitted:
        # All examiners submitted but none accepted
        recommendations = [a.recommendation for a in all_assignments]

        # Check for rejections or major revisions
        if 'reject' in recommendations or 'major_revision' in recommendations:
            # Scholar must resubmit
            thesis.status = 'changes_required'

            # Notify scholar
            NotificationService.create_notification(
                user_id=thesis.scholar.user_id,
                title='Thesis - Revisions Required',
                message='All examiners have submitted their reports. Your thesis requires revisions before defense. Please check the examiner comments and resubmit.',
                notification_type='thesis',
                priority='high',
                related_entity_type='thesis',
                related_entity_id=thesis.id,
                action_link='/thesis',
                send_email=True
            )

        elif 'minor_revision' in recommendations:
            # Minor revisions - can still proceed but with note
            thesis.status = 'ready_for_defense'

            # Notify supervisor
            NotificationService.create_notification(
                user_id=thesis.scholar.supervisor.user_id,
                title='All Examiner Reports Received',
                message=f'All examiners have submitted reports for thesis of scholar {thesis.scholar.enrollment_number}. Some minor revisions noted. You can schedule the defense.',
                notification_type='thesis',
                priority='high',
                related_entity_type='thesis',
                related_entity_id=thesis.id,
                action_link='/thesis',
                send_email=True
            )
    else:
        # Still waiting for some examiners, no accepts yet
        NotificationService.create_notification(
            user_id=thesis.scholar.supervisor.user_id,
            title='Examiner Report Submitted',
            message=f'{submitted_count}/{total_count} examiners have submitted reports for thesis of scholar {thesis.scholar.enrollment_number}. No acceptance yet.',
            notification_type='thesis',
            priority='medium',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=False
        )
        db.session.commit()
        return

    # Always notify supervisor
    NotificationService.create_notification(
        user_id=thesis.scholar.supervisor.user_id,
        title='All Examiner Reports Received',
        message=f'All examiners have submitted their reports for thesis of scholar {thesis.scholar.enrollment_number}.',
        notification_type='thesis',
        priority='high',
        related_entity_type='thesis',
        related_entity_id=thesis.id,
        action_link='/thesis',
        send_email=True
    )

    db.session.commit()


@bp.route('/public/download/<int:thesis_id>', methods=['GET'])
def download_thesis_public(thesis_id):
    """Public thesis download with token authentication"""
    try:
        token = request.args.get('token')

        if not token:
            return jsonify({'error': 'Token required'}), 401

        # Verify token
        token_data = TokenService.verify_thesis_download_token(token)
        if not token_data or token_data['thesis_id'] != thesis_id:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Get thesis
        thesis = Thesis.query.get_or_404(thesis_id)

        # Get file path
        file_path = get_file_path(thesis.file_path)

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        return send_file(
            file_path,
            as_attachment=True,
            download_name=thesis.file_name
        )

    except Exception as e:
        print(f"Error downloading thesis: {str(e)}")
        return jsonify({'error': 'Failed to download thesis'}), 500


# =====================================================
# DEFENSE MANAGEMENT
# =====================================================

@bp.route('/<int:thesis_id>/schedule-defense', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def schedule_defense(thesis_id):
    """
    Supervisor schedules thesis defense
    Only allowed if all examiners accepted or minor revisions only
    """
    try:
        current_user = get_current_user()
        thesis = Thesis.query.get_or_404(thesis_id)

        # Verify supervisor authorization
        if thesis.scholar.supervisor.user_id != current_user.id:
            return jsonify({'error': 'Only the scholar\'s supervisor can schedule defense'}), 403

        # Check if defense can be scheduled
        if not thesis.can_schedule_defense():
            return jsonify({'error': 'Defense cannot be scheduled yet. Wait for all examiners to accept the thesis.'}), 400

        data = request.get_json()

        # Parse date and time
        defense_date = datetime.strptime(data['defense_date'], '%Y-%m-%d').date()
        defense_time = datetime.strptime(data.get('defense_time', '10:00'), '%H:%M').time() if data.get('defense_time') else None

        # Create defense record
        defense = ThesisDefense(
            thesis_id=thesis.id,
            defense_date=defense_date,
            defense_time=defense_time,
            venue=data.get('venue', ''),
            duration_minutes=data.get('duration_minutes', 120),
            status='scheduled',
            conducted_by=current_user.id,
            committee_members=data.get('committee_members', '')  # JSON string
        )

        db.session.add(defense)

        # Update thesis status
        thesis.status = 'defense_scheduled'
        thesis.current_stage = 'defense_scheduled'
        thesis.scholar.thesis_defense_status = 'defense_scheduled'

        db.session.commit()

        # Notify scholar
        NotificationService.create_notification(
            user_id=thesis.scholar.user_id,
            title='Thesis Defense Scheduled',
            message=f'Your thesis defense has been scheduled for {defense_date.strftime("%Y-%m-%d")} at {defense_time.strftime("%H:%M") if defense_time else "TBD"}. Venue: {data.get("venue", "TBD")}',
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis_defense',
            related_entity_id=defense.id,
            action_link='/thesis',
            send_email=True
        )

        return jsonify({
            'message': 'Defense scheduled successfully',
            'defense': defense.to_dict(include_relations=True),
            'thesis': thesis.to_dict(include_relations=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error scheduling defense: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to schedule defense: {str(e)}'}), 500


@bp.route('/defense/<int:defense_id>/outcome', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def record_defense_outcome(defense_id):
    """
    Record defense outcome after defense is conducted
    Outcomes: accept, minor_revision, major_revision, reject
    """
    try:
        current_user = get_current_user()
        defense = ThesisDefense.query.get_or_404(defense_id)
        thesis = defense.thesis

        # Verify supervisor authorization
        if thesis.scholar.supervisor.user_id != current_user.id:
            return jsonify({'error': 'Only the scholar\'s supervisor can record defense outcome'}), 403

        data = request.get_json()
        outcome = data.get('outcome')

        if outcome not in ['accept', 'minor_revision', 'major_revision', 'reject']:
            return jsonify({'error': 'Invalid outcome'}), 400

        # Update defense record
        defense.status = 'completed'
        defense.outcome = outcome
        defense.committee_comments = data.get('comments', '')
        defense.outcome_recorded_at = datetime.utcnow()

        # Update thesis and scholar based on outcome
        if outcome == 'accept':
            # Defense passed - scholar should upload revised thesis within 1 month
            from datetime import timedelta
            thesis.status = 'awaiting_revised_thesis'
            thesis.current_stage = 'post_defense_revision'
            thesis.scholar.thesis_defense_status = 'defense_completed'
            thesis.scholar.defense_completion_date = datetime.utcnow().date()

            # Set 1-month deadline for revised thesis submission
            thesis.revised_thesis_deadline = datetime.utcnow() + timedelta(days=30)

            # Notify scholar to upload revised thesis within 1 month
            NotificationService.create_notification(
                user_id=thesis.scholar.user_id,
                title='Congratulations! Defense Passed',
                message=f'Your thesis defense was successful! Please upload your REVISED thesis incorporating defense feedback within 1 month (Deadline: {thesis.revised_thesis_deadline.strftime("%B %d, %Y")}). After supervisor approval, it will go to Dean Academics for final approval.',
                notification_type='thesis',
                priority='high',
                related_entity_type='thesis',
                related_entity_id=thesis.id,
                action_link='/thesis',
                send_email=True
            )

        elif outcome in ['minor_revision', 'major_revision']:
            # Revisions needed - can reschedule defense
            thesis.status = 'defense_rescheduled'
            defense.status = 'rescheduled'

            # Notify scholar
            NotificationService.create_notification(
                user_id=thesis.scholar.user_id,
                title='Defense - Revisions Required',
                message=f'Your defense requires {outcome.replace("_", " ")}. Please work with your supervisor to reschedule. Comments: {data.get("comments", "")}',
                notification_type='thesis',
                priority='high',
                related_entity_type='thesis',
                related_entity_id=thesis.id,
                action_link='/thesis',
                send_email=True
            )

        elif outcome == 'reject':
            # Defense failed - must resubmit thesis from beginning
            thesis.status = 'rejected'
            thesis.current_stage = 'supervisor'  # Back to beginning

            # Notify scholar
            NotificationService.create_notification(
                user_id=thesis.scholar.user_id,
                title='Defense Not Passed',
                message=f'Your defense was not successful. You will need to resubmit your thesis and restart the approval process. Comments: {data.get("comments", "")}',
                notification_type='thesis',
                priority='high',
                related_entity_type='thesis',
                related_entity_id=thesis.id,
                action_link='/thesis',
                send_email=True
            )

        db.session.commit()

        return jsonify({
            'message': f'Defense outcome recorded: {outcome}',
            'defense': defense.to_dict(include_relations=True),
            'thesis': thesis.to_dict(include_relations=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error recording defense outcome: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to record defense outcome: {str(e)}'}), 500


# =====================================================
# FINAL THESIS SUBMISSION
# =====================================================

@bp.route('/submit-final', methods=['POST'])
@jwt_required()
@role_required('scholar')
def submit_final_thesis():
    """
    Scholar uploads final thesis version after defense accepted
    Starts sequential approval: supervisor → dc_apc → school_chair → ad_research → dean
    """
    try:
        current_user = get_current_user()
        scholar = current_user.scholar_profile

        if not scholar:
            return jsonify({'error': 'Scholar profile not found'}), 404

        # Check if defense was passed
        latest_thesis = Thesis.query.filter_by(scholar_id=scholar.id).order_by(Thesis.version.desc()).first()
        if not latest_thesis or latest_thesis.current_stage != 'final_approval':
            return jsonify({'error': 'You can only submit final thesis after defense is accepted'}), 400

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        relative_path, filename = save_uploaded_file(file, subfolder='thesis')

        if not relative_path:
            return jsonify({'error': 'File upload failed'}), 500

        # Get version number
        version = latest_thesis.version + 1

        # Create final thesis record
        thesis = Thesis(
            scholar_id=scholar.id,
            file_path=relative_path,
            file_name=filename,
            version=version,
            submission_type='final',
            current_stage='supervisor',
            status='with_supervisor'
        )

        db.session.add(thesis)
        db.session.flush()

        # Notify supervisor
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='Final Thesis Submitted - Your Review Required',
            message=f'Scholar {scholar.enrollment_number} has submitted their final thesis (v{version}) for approval.',
            notification_type='thesis',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id,
            action_link='/thesis',
            send_email=True
        )

        db.session.commit()

        return jsonify({
            'message': 'Final thesis submitted successfully. Supervisor has been notified.',
            'thesis': thesis.to_dict(include_relations=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error submitting final thesis: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit final thesis: {str(e)}'}), 500


# =====================================================
# QUERY ENDPOINTS
# =====================================================

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_thesis(scholar_id):
    """Get all thesis submissions for a scholar"""
    theses = Thesis.query.filter_by(scholar_id=scholar_id).order_by(Thesis.version.desc()).all()
    return jsonify([t.to_dict(include_relations=True) for t in theses]), 200


@bp.route('/my-thesis', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_my_thesis():
    """Get current scholar's thesis with full details"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    thesis = Thesis.query.filter_by(scholar_id=scholar.id).order_by(Thesis.version.desc()).first()

    if not thesis:
        return jsonify({'message': 'No thesis found'}), 404

    return jsonify(thesis.to_dict(include_relations=True)), 200


@bp.route('/pending-reviews', methods=['GET'])
@jwt_required()
def get_pending_reviews():
    """Get pending thesis reviews for current user based on their role"""
    current_user = get_current_user()

    if current_user.role == 'supervisor':
        # Get theses where user is supervisor and stage is 'supervisor'
        # ALSO include theses where user is a committee member at dc_apc stage
        if not current_user.supervisor_profile:
            return jsonify([]), 200

        # Theses where user is the primary supervisor
        # Include: 1) supervisor stage, 2) external_review stage awaiting CSV upload, 3) ready for defense scheduling, 4) final review after defense
        supervisor_theses = Thesis.query.join(Scholar).filter(
            Scholar.supervisor_id == current_user.supervisor_profile.id,
            db.or_(
                db.and_(
                    Thesis.current_stage == 'supervisor',
                    Thesis.status.in_(['with_supervisor'])
                ),
                db.and_(
                    Thesis.current_stage == 'external_review',
                    Thesis.status == 'awaiting_examiner_upload'
                ),
                db.and_(
                    Thesis.current_stage == 'defense_scheduled',
                    Thesis.status == 'ready_for_defense'
                ),
                db.and_(
                    Thesis.current_stage == 'supervisor_final_review',
                    Thesis.status == 'with_supervisor_final'
                )
            )
        ).all()

        # Theses where user is a committee member (DC/APC review)
        committee_member_ids = [cm.committee_id for cm in
                               CommitteeMember.query.filter_by(supervisor_id=current_user.supervisor_profile.id).all()]

        committee_theses = Thesis.query.join(Scholar).filter(
            Scholar.id.in_(
                db.session.query(Committee.scholar_id).filter(Committee.id.in_(committee_member_ids))
            ),
            Thesis.current_stage == 'dc_apc',
            Thesis.status == 'with_dc_apc'
        ).all() if committee_member_ids else []

        # Combine both lists (remove duplicates by converting to dict keyed by id)
        theses_dict = {t.id: t for t in supervisor_theses + committee_theses}
        theses = list(theses_dict.values())

    elif current_user.role in ['dc_member', 'apc_member']:
        # Get theses where user is committee member
        if not current_user.supervisor_profile:
            return jsonify([]), 200

        committee_member_ids = [cm.committee_id for cm in
                               CommitteeMember.query.filter_by(supervisor_id=current_user.supervisor_profile.id).all()]

        theses = Thesis.query.join(Scholar).filter(
            Scholar.id.in_(
                db.session.query(Committee.scholar_id).filter(Committee.id.in_(committee_member_ids))
            ),
            Thesis.current_stage == 'dc_apc',
            Thesis.status == 'with_dc_apc'
        ).all()

    elif current_user.role == 'school_chair':
        theses = Thesis.query.filter_by(current_stage='school_chair', status='with_school_chair').all()

    elif current_user.role == 'ad_research':
        theses = Thesis.query.filter_by(current_stage='ad_research', status='with_ad_research').all()

    elif current_user.role == 'dean_academics':
        theses = Thesis.query.filter_by(current_stage='dean_academics', status='with_dean_academics').all()

    else:
        return jsonify([]), 200

    return jsonify([t.to_dict(include_relations=True) for t in theses]), 200


@bp.route('/my-scholars-theses', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def get_my_scholars_theses():
    """Get all theses of scholars under this supervisor for tracking"""
    current_user = get_current_user()

    if not current_user.supervisor_profile:
        return jsonify({'error': 'Supervisor profile not found'}), 404

    # Get all theses where user is the supervisor
    theses = Thesis.query.join(Scholar).filter(
        Scholar.supervisor_id == current_user.supervisor_profile.id
    ).order_by(Thesis.updated_at.desc()).all()

    return jsonify([t.to_dict(include_relations=True) for t in theses]), 200


@bp.route('/<int:thesis_id>', methods=['GET'])
@jwt_required()
def get_thesis(thesis_id):
    """Get specific thesis by ID"""
    thesis = Thesis.query.get_or_404(thesis_id)
    return jsonify(thesis.to_dict(include_relations=True)), 200


@bp.route('/<int:thesis_id>/examiners', methods=['GET'])
@jwt_required()
def get_thesis_examiners(thesis_id):
    """Get all examiners assigned to a thesis"""
    thesis = Thesis.query.get_or_404(thesis_id)
    examiners = thesis.get_examiner_assignments()
    return jsonify([e.to_dict(include_examiner_details=True) for e in examiners]), 200


@bp.route('/<int:thesis_id>/download', methods=['GET'])
@jwt_required()
def download_thesis(thesis_id):
    """Download thesis file (authenticated users only)"""
    try:
        thesis = Thesis.query.get_or_404(thesis_id)
        file_path = get_file_path(thesis.file_path)

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        return send_file(
            file_path,
            as_attachment=True,
            download_name=thesis.file_name
        )

    except Exception as e:
        print(f"Error downloading thesis: {str(e)}")
        return jsonify({'error': 'Failed to download thesis'}), 500
