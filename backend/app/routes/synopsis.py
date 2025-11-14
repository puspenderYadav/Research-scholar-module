from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required
from app import db
from app.models.synopsis import Synopsis, SynopsisApproval
from app.models.scholar import Scholar
from app.models.committee import Committee, CommitteeMember
from app.models.user import User
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.notification_service import NotificationService
from datetime import datetime
import os

bp = Blueprint('synopsis', __name__, url_prefix='/api/synopsis')


@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_synopsis(scholar_id):
    synopses = Synopsis.query.filter_by(scholar_id=scholar_id).order_by(Synopsis.version.desc()).all()
    return jsonify([s.to_dict() for s in synopses]), 200


@bp.route('/my-synopsis', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_my_synopsis():
    current_user = get_current_user()
    scholar = current_user.scholar_profile
    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404
    synopses = Synopsis.query.filter_by(scholar_id=scholar.id).order_by(Synopsis.version.desc()).all()
    return jsonify([s.to_dict() for s in synopses]), 200


@bp.route('/submit', methods=['POST'])
@jwt_required()
@role_required('scholar')
def submit_synopsis():
    """Submit a new synopsis"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Save file
        file_path = save_uploaded_file(file, 'synopsis')

        # Get current version
        existing = Synopsis.query.filter_by(scholar_id=scholar.id).order_by(Synopsis.version.desc()).first()
        version = (existing.version + 1) if existing else 1

        # Create synopsis record
        synopsis = Synopsis(
            scholar_id=scholar.id,
            file_path=file_path,
            file_name=file.filename,
            version=version,
            status='with_supervisor',
            current_stage='supervisor'
        )

        db.session.add(synopsis)

        # Create initial approval record for supervisor
        if scholar.supervisor:
            approval = SynopsisApproval(
                synopsis_id=synopsis.id,
                stage='supervisor',
                approver_id=scholar.supervisor.user_id,
                approver_role='supervisor',
                decision='pending'
            )
            db.session.add(approval)

            # Send notification to supervisor
            NotificationService.create_notification(
                user_id=scholar.supervisor.user_id,
                title='New Synopsis Submission',
                message=f'{scholar.user.name} ({scholar.enrollment_number}) has submitted their synopsis for review.',
                type='synopsis_submitted',
                related_id=synopsis.id
            )

        db.session.commit()

        return jsonify({
            'message': 'Synopsis submitted successfully',
            'synopsis': synopsis.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/pending-reviews', methods=['GET'])
@jwt_required()
def get_pending_reviews():
    """Get pending synopsis reviews for current user"""
    current_user = get_current_user()

    # Build query based on user role
    if current_user.role == 'supervisor':
        # Get synopses where user is supervisor
        synopses = Synopsis.query.join(Scholar).filter(
            Scholar.supervisor_id == current_user.supervisor_profile.id,
            Synopsis.current_stage == 'supervisor',
            Synopsis.status == 'with_supervisor'
        ).all()

    elif current_user.role in ['dc_member', 'apc_member']:
        # Get synopses at DC/APC stage
        synopses = Synopsis.query.filter(
            Synopsis.current_stage == 'dc_apc',
            Synopsis.status.in_(['with_dc_apc'])
        ).all()

    elif current_user.role == 'school_chair':
        synopses = Synopsis.query.filter(
            Synopsis.current_stage == 'school_chair',
            Synopsis.status == 'with_school_chair'
        ).all()

    elif current_user.role == 'ad_research':
        synopses = Synopsis.query.filter(
            Synopsis.current_stage == 'ad_research',
            Synopsis.status == 'with_ad_research'
        ).all()

    elif current_user.role == 'dean_academics':
        synopses = Synopsis.query.filter(
            Synopsis.current_stage == 'dean_academics',
            Synopsis.status == 'with_dean'
        ).all()
    else:
        synopses = []

    return jsonify([s.to_dict() for s in synopses]), 200


@bp.route('/<int:synopsis_id>/approve', methods=['POST'])
@jwt_required()
def approve_synopsis(synopsis_id):
    """Approve, reject, or request changes to synopsis"""
    current_user = get_current_user()
    data = request.get_json()

    action = data.get('action')  # approved, rejected, changes_requested
    comments = data.get('comments', '')

    if not action:
        return jsonify({'error': 'Action is required'}), 400

    synopsis = Synopsis.query.get_or_404(synopsis_id)

    try:
        # Create or update approval record
        approval = SynopsisApproval.query.filter_by(
            synopsis_id=synopsis_id,
            stage=synopsis.current_stage,
            approver_id=current_user.id
        ).first()

        if not approval:
            approval = SynopsisApproval(
                synopsis_id=synopsis_id,
                stage=synopsis.current_stage,
                approver_id=current_user.id,
                approver_role=current_user.role
            )
            db.session.add(approval)

        approval.decision = action
        approval.comments = comments
        approval.reviewed_at = datetime.utcnow()

        # Update synopsis status based on action
        if action == 'rejected':
            synopsis.status = 'rejected'
            NotificationService.create_notification(
                user_id=synopsis.scholar.user_id,
                title='Synopsis Rejected',
                message=f'Your synopsis has been rejected. Reason: {comments}',
                type='synopsis_rejected',
                related_id=synopsis_id
            )

        elif action == 'changes_requested':
            synopsis.status = 'changes_requested'
            NotificationService.create_notification(
                user_id=synopsis.scholar.user_id,
                title='Synopsis - Changes Requested',
                message=f'Changes requested for your synopsis: {comments}',
                type='synopsis_changes',
                related_id=synopsis_id
            )

        elif action == 'approved':
            # Move to next stage
            stage_flow = {
                'supervisor': ('dc_apc', 'with_dc_apc'),
                'dc_apc': ('school_chair', 'with_school_chair'),
                'school_chair': ('ad_research', 'with_ad_research'),
                'ad_research': ('dean_academics', 'with_dean'),
                'dean_academics': ('completed', 'approved')
            }

            if synopsis.current_stage in stage_flow:
                next_stage, next_status = stage_flow[synopsis.current_stage]
                synopsis.current_stage = next_stage
                synopsis.status = next_status

                # Check if completed
                if next_stage == 'completed':
                    synopsis.is_approved = True
                    synopsis.approved_at = datetime.utcnow()
                    NotificationService.create_notification(
                        user_id=synopsis.scholar.user_id,
                        title='Synopsis Approved!',
                        message='Congratulations! Your synopsis has been approved by all reviewers.',
                        type='synopsis_approved',
                        related_id=synopsis_id
                    )
                else:
                    NotificationService.create_notification(
                        user_id=synopsis.scholar.user_id,
                        title='Synopsis Advanced',
                        message=f'Your synopsis has been approved and moved to {next_stage} stage.',
                        type='synopsis_progress',
                        related_id=synopsis_id
                    )

        db.session.commit()

        return jsonify({
            'message': f'Synopsis {action} successfully',
            'synopsis': synopsis.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:synopsis_id>/download', methods=['GET'])
@jwt_required()
def download_synopsis(synopsis_id):
    """Download synopsis file"""
    synopsis = Synopsis.query.get_or_404(synopsis_id)

    # Check if user has permission to download
    current_user = get_current_user()

    # Allow scholar, their supervisor, and reviewers to download
    allowed = (
        current_user.role == 'scholar' and synopsis.scholar_id == current_user.scholar_profile.id
    ) or (
        current_user.role in ['supervisor', 'dc_member', 'apc_member', 'school_chair', 'ad_research', 'dean_academics']
    )

    if not allowed:
        return jsonify({'error': 'Permission denied'}), 403

    try:
        directory = os.path.dirname(synopsis.file_path)
        filename = os.path.basename(synopsis.file_path)
        return send_from_directory(directory, filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404
