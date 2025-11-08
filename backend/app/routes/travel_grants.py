from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app import db
from app.models.travel_grant import TravelGrant, TravelGrantApproval
from app.models.scholar import Scholar
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('travel_grants', __name__, url_prefix='/api/travel-grants')


@bp.route('/', methods=['GET'])
@jwt_required()
def get_travel_grants():
    """Get travel grants based on user role"""
    current_user = get_current_user()

    query = TravelGrant.query

    if current_user.role == 'scholar':
        # Scholar sees only their own grants
        scholar = current_user.scholar_profile
        if not scholar:
            return jsonify({'error': 'Scholar profile not found'}), 404
        query = query.filter_by(scholar_id=scholar.id)

    elif current_user.role == 'supervisor':
        # Supervisor sees grants from their scholars
        if current_user.supervisor_profile:
            scholar_ids = [s.id for s in current_user.supervisor_profile.supervised_scholars]
            query = query.filter(TravelGrant.scholar_id.in_(scholar_ids))

    # Dean, AD Research, School Chair see all grants (can be filtered further based on school)

    grants = query.order_by(TravelGrant.submission_date.desc()).all()
    return jsonify([g.to_dict() for g in grants]), 200


@bp.route('/<int:grant_id>', methods=['GET'])
@jwt_required()
def get_travel_grant(grant_id):
    """Get travel grant details"""
    grant = TravelGrant.query.get_or_404(grant_id)
    return jsonify(grant.to_dict()), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('scholar')
def create_travel_grant():
    """Create a new travel grant application"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    data = request.get_json()

    # Validate required fields
    required_fields = ['purpose', 'destination', 'start_date', 'end_date', 'amount_requested']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Create travel grant
    grant = TravelGrant(
        scholar_id=scholar.id,
        purpose=data['purpose'],
        destination=data['destination'],
        conference_name=data.get('conference_name'),
        start_date=datetime.fromisoformat(data['start_date']) if isinstance(data['start_date'], str) else data['start_date'],
        end_date=datetime.fromisoformat(data['end_date']) if isinstance(data['end_date'], str) else data['end_date'],
        amount_requested=data['amount_requested'],
        status='submitted',
        current_stage='supervisor'
    )

    db.session.add(grant)
    db.session.flush()

    # Notify supervisor
    if scholar.supervisor:
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='New Travel Grant Application',
            message=f'Scholar {scholar.enrollment_number} has submitted a travel grant application for {data["destination"]}',
            notification_type='approval',
            priority='high',
            related_entity_type='travel_grant',
            related_entity_id=grant.id,
            action_link=f'/travel-grants/{grant.id}'
        )

    db.session.commit()

    return jsonify({
        'message': 'Travel grant application submitted successfully',
        'grant': grant.to_dict()
    }), 201


@bp.route('/<int:grant_id>/approve', methods=['POST'])
@jwt_required()
def approve_travel_grant(grant_id):
    """Approve travel grant at current stage"""
    current_user = get_current_user()
    grant = TravelGrant.query.get_or_404(grant_id)
    scholar = grant.scholar

    data = request.get_json()
    decision = data.get('decision')  # approved, rejected, changes_requested
    comments = data.get('comments', '')

    if decision not in ['approved', 'rejected', 'changes_requested']:
        return jsonify({'error': 'Invalid decision'}), 400

    # Determine current user's approval stage
    current_stage = None

    if current_user.role == 'supervisor' and scholar.supervisor_id == current_user.supervisor_profile.id:
        current_stage = 'supervisor'
    elif current_user.role == 'supervisor':  # DC member
        current_stage = 'dc'
    elif current_user.role == 'school_chair':
        current_stage = 'school_chair'
    elif current_user.role == 'ad_research':
        current_stage = 'ad_research'
    elif current_user.role == 'dean_academics':
        current_stage = 'dean_academics'

    if not current_stage or grant.current_stage != current_stage:
        return jsonify({'error': 'Not authorized to approve at this stage'}), 403

    # Create approval record
    approval = TravelGrantApproval(
        travel_grant_id=grant.id,
        approval_stage=current_stage,
        approver_id=current_user.id,
        decision=decision,
        comments=comments
    )

    db.session.add(approval)

    if decision == 'rejected':
        grant.status = 'rejected'
        NotificationService.notify_travel_grant_status(
            scholar.user_id, grant.id, 'rejected', current_stage, comments
        )

    elif decision == 'changes_requested':
        grant.status = 'under_review'
        NotificationService.notify_travel_grant_status(
            scholar.user_id, grant.id, 'changes requested', current_stage, comments
        )

    elif decision == 'approved':
        # Move to next stage
        stage_sequence = ['supervisor', 'dc', 'school_chair', 'ad_research', 'dean_academics']
        current_index = stage_sequence.index(current_stage)

        if current_index == len(stage_sequence) - 1:
            # Final approval
            grant.status = 'approved'
            grant.current_stage = 'completed'
            NotificationService.notify_travel_grant_status(
                scholar.user_id, grant.id, 'approved', 'final', comments
            )
        else:
            # Move to next stage
            next_stage = stage_sequence[current_index + 1]
            grant.current_stage = next_stage
            grant.status = 'under_review'

            # Notify next approver
            next_role = next_stage
            next_approvers = User.query.filter_by(role=next_role, is_active=True).all()

            for approver in next_approvers:
                NotificationService.create_notification(
                    user_id=approver.id,
                    title='Travel Grant Pending Approval',
                    message=f'Travel grant application from {scholar.enrollment_number} is pending your approval',
                    notification_type='approval',
                    priority='high',
                    related_entity_type='travel_grant',
                    related_entity_id=grant.id,
                    action_link=f'/travel-grants/{grant.id}'
                )

    db.session.commit()

    return jsonify({
        'message': f'Travel grant {decision}',
        'grant': grant.to_dict()
    }), 200


@bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get travel grants pending approval for current user"""
    current_user = get_current_user()

    stage_map = {
        'supervisor': 'supervisor',
        'dc_member': 'dc',
        'school_chair': 'school_chair',
        'ad_research': 'ad_research',
        'dean_academics': 'dean_academics'
    }

    current_stage = stage_map.get(current_user.role)

    if not current_stage:
        return jsonify([]), 200

    grants = TravelGrant.query.filter_by(
        current_stage=current_stage,
        status='under_review'
    ).all()

    return jsonify([g.to_dict() for g in grants]), 200
