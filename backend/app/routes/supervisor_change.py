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

    # Send notification to BOTH current AND new supervisor with action links
    NotificationService.create_notification(
        user_id=scholar.supervisor.user_id,
        title='Supervisor Change Request - Your Approval Required',
        message=f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has requested to change supervisors. Please review and approve/decline the request.',
        notification_type='supervisor_change',
        priority='high',
        related_entity_type='supervisor_change_request',
        related_entity_id=change_request.id,
        action_link=f'/supervisor-approvals?request_id={change_request.id}',
        send_email=True
    )

    NotificationService.create_notification(
        user_id=new_supervisor.user_id,
        title='Supervisor Change Request - Your Approval Required',
        message=f'Scholar {scholar.enrollment_number} ({scholar.user.name}) has requested you as their new supervisor. Please review and approve/decline the request.',
        notification_type='supervisor_change',
        priority='high',
        related_entity_type='supervisor_change_request',
        related_entity_id=change_request.id,
        action_link=f'/supervisor-approvals?request_id={change_request.id}',
        send_email=True
    )

    return jsonify({
        'message': 'Supervisor change request submitted successfully. Both supervisors have been notified.',
        'request': change_request.to_dict(include_relations=True)
    }), 201


@bp.route('/available-supervisors', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_available_supervisors():
    """Get list of all supervisors available for supervisor change (excluding current supervisor)"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    # Get all active supervisors excluding current supervisor
    query = Supervisor.query.join(User).filter(
        User.is_active == True,
        Supervisor.is_accepting_students == True
    )

    if scholar.supervisor_id:
        query = query.filter(Supervisor.id != scholar.supervisor_id)

    supervisors = query.all()

    supervisors_data = []
    for supervisor in supervisors:
        supervisors_data.append({
            'id': supervisor.id,
            'name': supervisor.user.name,
            'email': supervisor.user.email,
            'designation': supervisor.designation,
            'specialization': supervisor.specialization,
            'school': supervisor.school.name if supervisor.school else None,
            'current_student_count': Scholar.query.filter_by(supervisor_id=supervisor.id, status='active').count()
        })

    return jsonify(supervisors_data), 200


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
    """Current supervisor approves/rejects the request"""
    current_user = get_current_user()
    data = request.get_json()
    
    change_request = SupervisorChangeRequest.query.get_or_404(request_id)
    
    # Verify the current user is the current supervisor
    if change_request.current_supervisor.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized. You are not the current supervisor.'}), 403
    
    if change_request.current_supervisor_status != 'pending':
        return jsonify({'error': 'Request already processed by current supervisor'}), 400
    
    # Check if new supervisor has already rejected
    if change_request.new_supervisor_status == 'rejected':
        return jsonify({'error': 'Cannot approve - new supervisor has already rejected this request'}), 400
    
    action = data.get('action')  # 'approve' or 'reject'
    comment = data.get('comment', '')
    
    if action == 'approve':
        change_request.current_supervisor_status = 'approved'
        change_request.current_supervisor_comment = comment
        change_request.current_supervisor_date = datetime.utcnow()
        
        # Check if BOTH supervisors have now approved
        if change_request.new_supervisor_status == 'approved':
            # Both approved - send to dean
            NotificationService.create_notification(
                user_id=User.query.filter_by(role='dean_academics').first().id,
                title='Supervisor Change Request - Final Approval Required',
                message=f'Both supervisors have approved the supervisor change request for scholar {change_request.scholar.enrollment_number}. Please review for final approval.',
                notification_type='supervisor_change',
                priority='high',
                send_email=True
            )
            message = 'Request approved. Both supervisors have approved - notification sent to Dean.'
        else:
            # Waiting for new supervisor
            message = 'Request approved by current supervisor. Waiting for new supervisor approval.'
        
    else:
        change_request.current_supervisor_status = 'rejected'
        change_request.current_supervisor_comment = comment
        change_request.current_supervisor_date = datetime.utcnow()
        change_request.status = 'rejected'
        
        # Notify scholar and new supervisor
        NotificationService.create_notification(
            user_id=change_request.scholar.user_id,
            title='Supervisor Change Request Rejected',
            message=f'Your supervisor change request has been rejected by your current supervisor. Reason: {comment}',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
        
        NotificationService.create_notification(
            user_id=change_request.new_supervisor.user_id,
            title='Supervisor Change Request Cancelled',
            message=f'Supervisor change request for scholar {change_request.scholar.enrollment_number} has been rejected by current supervisor.',
            notification_type='supervisor_change',
            priority='medium',
            send_email=True
        )
        
        message = 'Request rejected by current supervisor. Scholar and new supervisor have been notified.'
    
    db.session.commit()
    
    return jsonify({
        'message': message,
        'request': change_request.to_dict(include_relations=True)
    }), 200


@bp.route('/<int:request_id>/approve-new-supervisor', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def approve_by_new_supervisor(request_id):
    """New supervisor approves/rejects the request"""
    current_user = get_current_user()
    data = request.get_json()
    
    change_request = SupervisorChangeRequest.query.get_or_404(request_id)
    
    # Verify the current user is the new supervisor
    if change_request.new_supervisor.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized. You are not the requested new supervisor.'}), 403
    
    if change_request.new_supervisor_status != 'pending':
        return jsonify({'error': 'Request already processed by new supervisor'}), 400
    
    # Check if current supervisor has already rejected
    if change_request.current_supervisor_status == 'rejected':
        return jsonify({'error': 'Cannot approve - current supervisor has already rejected this request'}), 400
    
    action = data.get('action')  # 'approve' or 'reject'
    comment = data.get('comment', '')
    
    if action == 'approve':
        change_request.new_supervisor_status = 'approved'
        change_request.new_supervisor_comment = comment
        change_request.new_supervisor_date = datetime.utcnow()
        
        # Check if BOTH supervisors have now approved
        if change_request.current_supervisor_status == 'approved':
            # Both approved - send to dean
            NotificationService.create_notification(
                user_id=User.query.filter_by(role='dean_academics').first().id,
                title='Supervisor Change Request - Final Approval Required',
                message=f'Both supervisors have approved the supervisor change request for scholar {change_request.scholar.enrollment_number}. Please review for final approval.',
                notification_type='supervisor_change',
                priority='high',
                send_email=True
            )
            message = 'Request approved. Both supervisors have approved - notification sent to Dean.'
        else:
            # Waiting for current supervisor
            message = 'Request approved by new supervisor. Waiting for current supervisor approval.'
        
    else:
        change_request.new_supervisor_status = 'rejected'
        change_request.new_supervisor_comment = comment
        change_request.new_supervisor_date = datetime.utcnow()
        change_request.status = 'rejected'
        
        # Notify scholar and current supervisor
        NotificationService.create_notification(
            user_id=change_request.scholar.user_id,
            title='Supervisor Change Request Rejected',
            message=f'Your supervisor change request has been rejected by the requested new supervisor. Reason: {comment}',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
        
        NotificationService.create_notification(
            user_id=change_request.current_supervisor.user_id,
            title='Supervisor Change Request Cancelled',
            message=f'Supervisor change request for scholar {change_request.scholar.enrollment_number} has been rejected by new supervisor.',
            notification_type='supervisor_change',
            priority='medium',
            send_email=True
        )
        
        message = 'Request rejected by new supervisor. Scholar and current supervisor have been notified.'
    
    db.session.commit()
    
    return jsonify({
        'message': message,
        'request': change_request.to_dict(include_relations=True)
    }), 200


@bp.route('/<int:request_id>/approve-dean', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def approve_by_dean(request_id):
    """Dean approves/rejects the request (final approval)"""
    current_user = get_current_user()
    data = request.get_json()
    
    change_request = SupervisorChangeRequest.query.get_or_404(request_id)
    
    if change_request.dean_status != 'pending':
        return jsonify({'error': 'Request already processed by Dean'}), 400
    
    # Check if BOTH supervisors have approved
    if change_request.current_supervisor_status != 'approved':
        return jsonify({'error': 'Current supervisor must approve first'}), 400
    
    if change_request.new_supervisor_status != 'approved':
        return jsonify({'error': 'New supervisor must approve first'}), 400
    
    action = data.get('action')  # 'approve' or 'reject'
    comment = data.get('comment', '')
    
    if action == 'approve':
        change_request.dean_status = 'approved'
        change_request.dean_comment = comment
        change_request.dean_date = datetime.utcnow()
        change_request.status = 'approved'
        
        # Update the scholar's supervisor
        old_supervisor_id = change_request.scholar.supervisor_id
        change_request.scholar.supervisor_id = change_request.new_supervisor_id
        
        # Notify all parties
        NotificationService.create_notification(
            user_id=change_request.scholar.user_id,
            title='Supervisor Change Approved',
            message=f'Your supervisor change request has been approved by Dean. Your new supervisor is {change_request.new_supervisor.user.name}.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
        
        NotificationService.create_notification(
            user_id=change_request.current_supervisor.user_id,
            title='Supervisor Change Completed',
            message=f'Scholar {change_request.scholar.enrollment_number} is no longer under your supervision.',
            notification_type='supervisor_change',
            priority='medium',
            send_email=True
        )
        
        NotificationService.create_notification(
            user_id=change_request.new_supervisor.user_id,
            title='New Scholar Assigned',
            message=f'Scholar {change_request.scholar.enrollment_number} ({change_request.scholar.user.name}) has been assigned to you.',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
        
        message = 'Supervisor change approved and completed. All parties have been notified.'
    else:
        change_request.dean_status = 'rejected'
        change_request.dean_comment = comment
        change_request.dean_date = datetime.utcnow()
        change_request.status = 'rejected'
        
        # Notify all parties
        NotificationService.create_notification(
            user_id=change_request.scholar.user_id,
            title='Supervisor Change Request Rejected',
            message=f'Your supervisor change request has been rejected by Dean. Reason: {comment}',
            notification_type='supervisor_change',
            priority='high',
            send_email=True
        )
        
        NotificationService.create_notification(
            user_id=change_request.current_supervisor.user_id,
            title='Supervisor Change Request Rejected by Dean',
            message=f'Supervisor change request for scholar {change_request.scholar.enrollment_number} has been rejected by Dean.',
            notification_type='supervisor_change',
            priority='medium',
            send_email=True
        )
        
        NotificationService.create_notification(
            user_id=change_request.new_supervisor.user_id,
            title='Supervisor Change Request Rejected by Dean',
            message=f'Supervisor change request for scholar {change_request.scholar.enrollment_number} has been rejected by Dean.',
            notification_type='supervisor_change',
            priority='medium',
            send_email=True
        )
        
        message = 'Request rejected by Dean. All parties have been notified.'
    
    db.session.commit()
    
    return jsonify({
        'message': message,
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
