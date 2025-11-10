from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app import db
from app.models.travel_grant import TravelGrant, TravelGrantApproval
from app.models.scholar import Scholar
from app.models.user import User
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
    try:
        current_user = get_current_user()
        scholar = current_user.scholar_profile

        if not scholar:
            return jsonify({'error': 'Scholar profile not found'}), 404

        data = request.form.to_dict() if request.form else request.get_json()
        
        # Validate required fields
        required_fields = ['grant_type', 'event_name', 'organizers', 'venue_country', 
                          'broad_area', 'reasons_for_visit', 'anticipated_expenses']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Handle file uploads
        invitation_letter_path = None
        registration_waiver_path = None
        
        if request.files:
            if 'invitation_letter' in request.files:
                rel_path, _ = save_uploaded_file(
                    request.files['invitation_letter'],
                    subfolder='travel_grants'
                )
                invitation_letter_path = rel_path
            
            if 'registration_waiver_document' in request.files:
                rel_path, _ = save_uploaded_file(
                    request.files['registration_waiver_document'],
                    subfolder='travel_grants'
                )
                registration_waiver_path = rel_path

        # Parse dates
        start_date = None
        end_date = None
        
        if data.get('start_date'):
            try:
                start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00')).date()
            except ValueError:
                start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        
        if data.get('end_date'):
            try:
                end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00')).date()
            except ValueError:
                end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()

        # Create travel grant
        grant = TravelGrant(
            scholar_id=scholar.id,
            grant_type=data['grant_type'],
            event_name=data['event_name'],
            organizers=data['organizers'],
            venue_country=data['venue_country'],
            invitation_letter=invitation_letter_path,
            broad_area=data['broad_area'],
            reasons_for_visit=data['reasons_for_visit'],
            start_date=start_date,
            end_date=end_date,
            funds_from_other_agencies=data.get('funds_from_other_agencies', 'false').lower() == 'true',
            institute_amount=data.get('institute_amount'),
            institute_reasons=data.get('institute_reasons'),
            funding_agency_name=data.get('funding_agency_name'),
            sanctioned_amount=data.get('sanctioned_amount'),
            registration_waiver_requested=data.get('registration_waiver_requested', 'false').lower() == 'true',
            registration_waiver_document=registration_waiver_path,
            funds_from_supervisor_grant=data.get('funds_from_supervisor_grant', 'false').lower() == 'true',
            supervisor_grant_amount=data.get('supervisor_grant_amount'),
            anticipated_expenses=data['anticipated_expenses'],
            other_financial_details=data.get('other_financial_details'),
            presenting_paper=data.get('presenting_paper', 'false').lower() == 'true',
            paper_title=data.get('paper_title'),
            number_of_papers=data.get('number_of_papers'),
            paper_links=data.get('paper_links'),
            paper_other_details=data.get('paper_other_details'),
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
                message=f'Scholar {scholar.enrollment_number} has submitted a travel grant application for {data["event_name"]}',
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
    
    except Exception as e:
        db.session.rollback()
        print(f"Error creating travel grant: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to create travel grant: {str(e)}'}), 500


@bp.route('/<int:grant_id>/approve', methods=['POST'])
@jwt_required()
def approve_travel_grant(grant_id):
    """Approve or reject travel grant at current stage"""
    current_user = get_current_user()
    grant = TravelGrant.query.get_or_404(grant_id)
    scholar = grant.scholar

    data = request.get_json()
    decision = data.get('decision')  # approved, rejected
    comments = data.get('comments', '')

    if decision not in ['approved', 'rejected']:
        return jsonify({'error': 'Invalid decision. Must be "approved" or "rejected"'}), 400

    # Determine current user's approval stage
    current_stage = None

    if current_user.role == 'supervisor' and scholar.supervisor_id == current_user.supervisor_profile.id:
        current_stage = 'supervisor'
    elif current_user.role == 'supervisor':  # DC member
        # Check if user is a DC member for this scholar
        dc_members = [m.supervisor_id for m in scholar.committee.members if scholar.committee] if hasattr(scholar, 'committee') and scholar.committee else []
        if current_user.supervisor_profile and current_user.supervisor_profile.id in dc_members:
            current_stage = 'dc'
    elif current_user.role == 'school_chair':
        current_stage = 'school_chair'
    elif current_user.role == 'ad_research':
        current_stage = 'ad_research'
    elif current_user.role == 'dean_academics':
        current_stage = 'dean_academics'

    if not current_stage:
        return jsonify({'error': 'Not authorized to approve travel grants'}), 403

    if grant.current_stage != current_stage:
        return jsonify({'error': f'This grant is currently at {grant.current_stage} stage, not {current_stage}'}), 403

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
        # Notify scholar
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Travel Grant Application Rejected',
            message=f'Your travel grant application for {grant.event_name} has been rejected at {current_stage} stage. Reason: {comments}',
            notification_type='alert',
            priority='high',
            related_entity_type='travel_grant',
            related_entity_id=grant.id,
            action_link=f'/travel-grants/{grant.id}'
        )

    elif decision == 'approved':
        # Move to next stage
        stage_sequence = ['supervisor', 'dc', 'school_chair', 'ad_research', 'dean_academics']
        current_index = stage_sequence.index(current_stage)

        if current_index == len(stage_sequence) - 1:
            # Final approval
            grant.status = 'approved'
            grant.current_stage = 'completed'
            NotificationService.create_notification(
                user_id=scholar.user_id,
                title='Travel Grant Application Approved',
                message=f'Congratulations! Your travel grant application for {grant.event_name} has been fully approved.',
                notification_type='success',
                priority='high',
                related_entity_type='travel_grant',
                related_entity_id=grant.id,
                action_link=f'/travel-grants/{grant.id}'
            )
        else:
            # Move to next stage
            next_stage = stage_sequence[current_index + 1]
            grant.current_stage = next_stage
            grant.status = 'under_review'

            # Notify scholar about progress
            NotificationService.create_notification(
                user_id=scholar.user_id,
                title='Travel Grant Application Progress',
                message=f'Your travel grant application for {grant.event_name} has been approved by {current_stage} and moved to {next_stage} stage.',
                notification_type='info',
                priority='medium',
                related_entity_type='travel_grant',
                related_entity_id=grant.id,
                action_link=f'/travel-grants/{grant.id}'
            )

            # Notify next approver(s)
            next_role = next_stage
            if next_stage == 'dc':
                # Notify all DC members
                if hasattr(scholar, 'committee') and scholar.committee:
                    dc_supervisors = [m.supervisor for m in scholar.committee.members]
                    for supervisor in dc_supervisors:
                        if supervisor and supervisor.user:
                            NotificationService.create_notification(
                                user_id=supervisor.user_id,
                                title='Travel Grant Pending Approval',
                                message=f'Travel grant application from {scholar.enrollment_number} is pending your approval as DC member',
                                notification_type='approval',
                                priority='high',
                                related_entity_type='travel_grant',
                                related_entity_id=grant.id,
                                action_link=f'/travel-grants/{grant.id}'
                            )
            else:
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
        'message': f'Travel grant {decision} successfully',
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
