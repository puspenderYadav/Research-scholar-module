from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.scholar import Scholar
from app.models.user import User
from app.utils.decorators import role_required, get_current_user

bp = Blueprint('scholars', __name__, url_prefix='/api/scholars')


@bp.route('/', methods=['GET'])
@jwt_required()
@role_required('dean_academics', 'ad_research', 'school_chair', 'supervisor')
def get_scholars():
    """Get list of all scholars (filtered by access)"""
    current_user = get_current_user()

    query = Scholar.query

    # Filter based on role
    if current_user.role == 'school_chair':
        query = query.filter_by(school_id=current_user.supervisor_profile.school_id if current_user.supervisor_profile else None)
    elif current_user.role == 'supervisor':
        query = query.filter_by(supervisor_id=current_user.supervisor_profile.id if current_user.supervisor_profile else None)

    scholars = query.all()
    return jsonify([s.to_dict(include_relations=True) for s in scholars]), 200


@bp.route('/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar(scholar_id):
    """Get scholar details"""
    scholar = Scholar.query.get_or_404(scholar_id)
    return jsonify(scholar.to_dict(include_relations=True)), 200


@bp.route('/<int:scholar_id>', methods=['PUT'])
@jwt_required()
def update_scholar(scholar_id):
    """Update scholar profile"""
    current_user = get_current_user()
    scholar = Scholar.query.get_or_404(scholar_id)

    # Check permissions
    if current_user.role == 'scholar' and scholar.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()

    # Update allowed fields
    if current_user.role in ['dean_academics', 'ad_research']:
        if 'supervisor_id' in data:
            scholar.supervisor_id = data['supervisor_id']
        if 'co_supervisor_id' in data:
            scholar.co_supervisor_id = data['co_supervisor_id']
        if 'status' in data:
            scholar.status = data['status']

    # Scholar can update their own research info
    if 'research_area' in data:
        scholar.research_area = data['research_area']
    if 'thesis_title' in data:
        scholar.thesis_title = data['thesis_title']

    db.session.commit()

    return jsonify({
        'message': 'Scholar profile updated successfully',
        'scholar': scholar.to_dict(include_relations=True)
    }), 200


@bp.route('/my-profile', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_my_profile():
    """Get current scholar's profile"""
    current_user = get_current_user()

    if not current_user.scholar_profile:
        return jsonify({'error': 'Scholar profile not found'}), 404

    return jsonify(current_user.scholar_profile.to_dict(include_relations=True)), 200


@bp.route('/request-supervisor-change', methods=['POST'])
@jwt_required()
@role_required('scholar')
def request_supervisor_change():
    """Request supervisor change (simplified - should include approval workflow)"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    data = request.get_json()

    if not data.get('new_supervisor_id') or not data.get('reason'):
        return jsonify({'error': 'New supervisor ID and reason are required'}), 400

    # In production, this should create a request for approval
    # For now, we'll just create a notification to dean
    from app.utils.notification_service import NotificationService
    from app.models.supervisor import Supervisor

    new_supervisor = Supervisor.query.get(data['new_supervisor_id'])
    if not new_supervisor:
        return jsonify({'error': 'Supervisor not found'}), 404

    # Create notification for Dean
    dean = User.query.filter_by(role='dean_academics').first()
    if dean:
        NotificationService.create_notification(
            user_id=dean.id,
            title='Supervisor Change Request',
            message=f'Scholar {scholar.enrollment_number} has requested to change supervisor. Reason: {data["reason"]}',
            notification_type='general',
            priority='medium'
        )

    return jsonify({'message': 'Supervisor change request submitted successfully'}), 200
