from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.supervisor_change_request import SupervisorChangeRequest
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from app.models.user import User
from app.utils.decorators import role_required, get_current_user
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('supervisor_change', __name__, url_prefix='/api/supervisor-change')


@bp.route('/request', methods=['POST'])
@jwt_required()
@role_required('scholar')
def create_request():
    """Scholar submits a supervisor change request"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    data = request.get_json()

    # Validate required fields
    if not data.get('new_supervisor_id') or not data.get('reason'):
        return jsonify({'error': 'New supervisor and reason are required'}), 400

    new_supervisor_id = data['new_supervisor_id']
    reason = data['reason']
    additional_comments = data.get('additional_comments', '')

    # Validate new supervisor exists
    new_supervisor = Supervisor.query.get(new_supervisor_id)
    if not new_supervisor:
        return jsonify({'error': 'New supervisor not found'}), 404

    # Check if scholar already has a pending request
    existing_request = SupervisorChangeRequest.query.filter_by(
        scholar_id=scholar.id,
        status='pending'
    ).first()

    if existing_request:
        return jsonify({'error': 'You already have a pending supervisor change request'}), 400

    # Get current supervisor
    if not scholar.supervisor_id:
        return jsonify({'error': 'You do not have a current supervisor assigned'}), 400

    # Check if new supervisor is different from current
    if scholar.supervisor_id == new_supervisor_id:
        return jsonify({'error': 'New supervisor must be different from current supervisor'}), 400

    # Create the request
    change_request = SupervisorChangeRequest(
        scholar_id=scholar.id,
        current_supervisor_id=scholar.supervisor_id,
        new_supervisor_id=new_supervisor_id,
        reason=reason,
        additional_comments=additional_comments,
        status='pending',
        current_supervisor_status='pending',
        new_supervisor_status='pending',
        dean_status='pending'
    )

    db.session.add(change_request)
    db.session.commit()

    # Send notification to current supervisor
    NotificationService.create_notification(
        user_id=scholar.supervisor.user_id,
        title='Supervisor Change Request',
        message=f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has requested to change supervisors. Please review the request.',
        notification_type='supervisor_change',
        priority='high',
        send_email=True
    )

    return jsonify({
        'message': 'Supervisor change request submitted successfully',
        'request': change_request.to_dict(include_relations=True)
    }), 201


@bp.route('/my-requests', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_my_requests():
    """Get all supervisor change requests for current scholar"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    requests = SupervisorChangeRequest.query.filter_by(
        scholar_id=scholar.id
    ).order_by(SupervisorChangeRequest.created_at.desc()).all()

    return jsonify([req.to_dict(include_relations=True) for req in requests]), 200


@bp.route('/pending-approvals', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get pending approval requests for current user (supervisor or dean)"""
    current_user = get_current_user()

    if current_user.role == 'supervisor':
        supervisor = current_user.supervisor_profile
        if not supervisor:
            return jsonify({'error': 'Supervisor profile not found'}), 404

        # Get requests where this supervisor needs to approve
        requests = SupervisorChangeRequest.query.filter(
            db.or_(
                db.and_(
                    SupervisorChangeRequest.current_supervisor_id == supervisor.id,
                    SupervisorChangeRequest.current_supervisor_status == 'pending'
                ),
                db.and_(
                    SupervisorChangeRequest.new_supervisor_id == supervisor.id,
                    SupervisorChangeRequest.new_supervisor_status == 'pending',
                    SupervisorChangeRequest.current_supervisor_status == 'approved'
                )
            )
        ).order_by(SupervisorChangeRequest.created_at.desc()).all()

    elif current_user.role in ['dean_academics', 'ad_research']:
        # Get requests where dean needs to approve
        requests = SupervisorChangeRequest.query.filter_by(
            dean_status='pending'
        ).filter(
            SupervisorChangeRequest.current_supervisor_status == 'approved',
            SupervisorChangeRequest.new_supervisor_status == 'approved'
        ).order_by(SupervisorChangeRequest.created_at.desc()).all()

    else:
        return jsonify({'error': 'Access denied'}), 403

    return jsonify([req.to_dict(include_relations=True) for req in requests]), 200


@bp.route('/<int:request_id>/approve-current-supervisor', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def approve_by_current_supervisor(request_id):
    """Current supervisor approves or rejects the request"""
    current_user = get_current_user()
    supervisor = current_user.supervisor_profile

    if not supervisor:
        return jsonify({'error': 'Supervisor profile not found'}), 404

    change_request = SupervisorChangeRequest.query.get_or_404(request_id)

    # Verify this is the current supervisor
    if change_request.current_supervisor_id != supervisor.id:
        return jsonify({'error': 'You are not authorized to approve this request'}), 403

    # Check if already reviewed
    if change_request.current_supervisor_status != 'pending':
        return jsonify({'error': 'Request has already been reviewed by current supervisor'}), 400

    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    comment = data.get('comment', '')

    if action not in ['approve', 'reject']:
        return jsonify({'error': 'Invalid action. Must be "approve" or "reject"'}), 400

    # Update request
    change_request.current_supervisor_status = 'approved' if action == 'approve' else 'rejected'
    change_request.current_supervisor_comment = comment
    change_request.current_supervisor_reviewed_at = datetime.utcnow()

    if action == 'reject':
        change_request.status = 'rejected_by_current'
        # Notify scholar
        NotificationService.create_notification(
            user_id=change_request.scholar.user_id,
            title='Supervisor Change Request Rejected',
            message=f'Your supervisor change request has been rejected by your current supervisor.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
    else:
        # Approved by current supervisor, notify new supervisor
        NotificationService.create_notification(
            user_id=change_request.new_supervisor.user_id,
            title='New Supervisor Change Request',
            message=f'Scholar {change_request.scholar.enrollment_number} has requested you as their new supervisor. The current supervisor has approved. Please review the request.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )

    db.session.commit()

    return jsonify({
        'message': f'Request {action}d successfully',
        'request': change_request.to_dict(include_relations=True)
    }), 200


@bp.route('/<int:request_id>/approve-new-supervisor', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def approve_by_new_supervisor(request_id):
    """New supervisor approves or rejects the request"""
    current_user = get_current_user()
    supervisor = current_user.supervisor_profile

    if not supervisor:
        return jsonify({'error': 'Supervisor profile not found'}), 404

    change_request = SupervisorChangeRequest.query.get_or_404(request_id)

    # Verify this is the new supervisor
    if change_request.new_supervisor_id != supervisor.id:
        return jsonify({'error': 'You are not authorized to approve this request'}), 403

    # Check if current supervisor approved first
    if change_request.current_supervisor_status != 'approved':
        return jsonify({'error': 'Current supervisor must approve first'}), 400

    # Check if already reviewed
    if change_request.new_supervisor_status != 'pending':
        return jsonify({'error': 'Request has already been reviewed by new supervisor'}), 400

    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    comment = data.get('comment', '')

    if action not in ['approve', 'reject']:
        return jsonify({'error': 'Invalid action. Must be "approve" or "reject"'}), 400

    # Update request
    change_request.new_supervisor_status = 'approved' if action == 'approve' else 'rejected'
    change_request.new_supervisor_comment = comment
    change_request.new_supervisor_reviewed_at = datetime.utcnow()

    if action == 'reject':
        change_request.status = 'rejected_by_new'
        # Notify scholar
        NotificationService.create_notification(
            user_id=change_request.scholar.user_id,
            title='Supervisor Change Request Rejected',
            message=f'Your supervisor change request has been rejected by the requested new supervisor.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
    else:
        # Approved by new supervisor, notify dean
        dean = User.query.filter_by(role='dean_academics').first()
        if dean:
            NotificationService.create_notification(
                user_id=dean.id,
                title='Supervisor Change Request - Final Approval Required',
                message=f'Supervisor change request for scholar {change_request.scholar.enrollment_number} has been approved by both supervisors. Please provide final approval.',
                notification_type='supervisor_change',
                priority='high',
                send_email=True
            )

    db.session.commit()

    return jsonify({
        'message': f'Request {action}d successfully',
        'request': change_request.to_dict(include_relations=True)
    }), 200


@bp.route('/<int:request_id>/approve-dean', methods=['POST'])
@jwt_required()
@role_required('dean_academics', 'ad_research')
def approve_by_dean(request_id):
    """Dean provides final approval or rejection"""
    current_user = get_current_user()
    change_request = SupervisorChangeRequest.query.get_or_404(request_id)

    # Check if both supervisors approved first
    if change_request.current_supervisor_status != 'approved':
        return jsonify({'error': 'Current supervisor must approve first'}), 400

    if change_request.new_supervisor_status != 'approved':
        return jsonify({'error': 'New supervisor must approve first'}), 400

    # Check if already reviewed
    if change_request.dean_status != 'pending':
        return jsonify({'error': 'Request has already been reviewed by dean'}), 400

    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    comment = data.get('comment', '')

    if action not in ['approve', 'reject']:
        return jsonify({'error': 'Invalid action. Must be "approve" or "reject"'}), 400

    # Update request
    change_request.dean_status = 'approved' if action == 'approve' else 'rejected'
    change_request.dean_comment = comment
    change_request.dean_reviewed_at = datetime.utcnow()
    change_request.dean_reviewed_by = current_user.id

    if action == 'reject':
        change_request.status = 'rejected_by_dean'
        # Notify scholar
        NotificationService.create_notification(
            user_id=change_request.scholar.user_id,
            title='Supervisor Change Request Rejected',
            message=f'Your supervisor change request has been rejected by the Dean.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
    else:
        # Final approval - change the supervisor
        scholar = change_request.scholar
        old_supervisor_id = scholar.supervisor_id

        scholar.supervisor_id = change_request.new_supervisor_id
        change_request.status = 'completed'
        change_request.completed_at = datetime.utcnow()

        # Notify scholar
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Supervisor Changed Successfully',
            message=f'Your supervisor change request has been approved. Your new supervisor is {change_request.new_supervisor.user.name}.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )

        # Notify both supervisors
        NotificationService.create_notification(
            user_id=change_request.current_supervisor.user_id,
            title='Supervisor Change Completed',
            message=f'Scholar {scholar.enrollment_number} has been transferred to a new supervisor.',
            notification_type='supervisor_change',
            priority='medium',
            send_email=True
        )

        NotificationService.create_notification(
            user_id=change_request.new_supervisor.user_id,
            title='New Scholar Assigned',
            message=f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has been assigned to you as their new supervisor.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )

    db.session.commit()

    return jsonify({
        'message': f'Request {action}d successfully' + (' and supervisor changed' if action == 'approve' else ''),
        'request': change_request.to_dict(include_relations=True)
    }), 200


@bp.route('/<int:request_id>', methods=['GET'])
@jwt_required()
def get_request_details(request_id):
    """Get details of a specific supervisor change request"""
    current_user = get_current_user()
    change_request = SupervisorChangeRequest.query.get_or_404(request_id)

    # Check permissions
    allowed = False
    if current_user.role == 'scholar' and current_user.scholar_profile.id == change_request.scholar_id:
        allowed = True
    elif current_user.role == 'supervisor' and current_user.supervisor_profile:
        supervisor = current_user.supervisor_profile
        if supervisor.id in [change_request.current_supervisor_id, change_request.new_supervisor_id]:
            allowed = True
    elif current_user.role in ['dean_academics', 'ad_research']:
        allowed = True

    if not allowed:
        return jsonify({'error': 'Access denied'}), 403

    return jsonify(change_request.to_dict(include_relations=True)), 200


@bp.route('/all', methods=['GET'])
@jwt_required()
@role_required('dean_academics', 'ad_research')
def get_all_requests():
    """Get all supervisor change requests (admin only)"""
    status_filter = request.args.get('status')  # Optional filter by status

    query = SupervisorChangeRequest.query

    if status_filter:
        query = query.filter_by(status=status_filter)

    requests = query.order_by(SupervisorChangeRequest.created_at.desc()).all()

    return jsonify([req.to_dict(include_relations=True) for req in requests]), 200
