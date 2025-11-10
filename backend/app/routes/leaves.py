from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app import db
from app.models.leave import Leave, LeaveApproval, LeaveBalance
from app.models.scholar import Scholar
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('leaves', __name__, url_prefix='/api/leaves')


@bp.route('', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_leaves():
    """Get leaves based on user role"""
    current_user = get_current_user()

    query = Leave.query

    if current_user.role == 'scholar':
        # Scholar sees only their own leaves
        scholar = current_user.scholar_profile
        if not scholar:
            return jsonify({'error': 'Scholar profile not found'}), 404
        query = query.filter_by(scholar_id=scholar.id)

    elif current_user.role == 'supervisor':
        # Supervisor sees leaves from their scholars
        if current_user.supervisor_profile:
            scholar_ids = [s.id for s in current_user.supervisor_profile.supervised_scholars]
            query = query.filter(Leave.scholar_id.in_(scholar_ids))

    elif current_user.role == 'school_chair':
        # School chair sees leaves from their school
        from app.models.school import School
        school = School.query.filter_by(chair_id=current_user.id).first()
        if school:
            scholar_ids = [s.id for s in school.scholars]
            query = query.filter(Leave.scholar_id.in_(scholar_ids))

    leaves = query.order_by(Leave.submission_date.desc()).all()
    return jsonify([leave.to_dict(include_scholar=True) for leave in leaves]), 200


@bp.route('/<int:leave_id>', methods=['GET'])
@jwt_required()
def get_leave(leave_id):
    """Get leave details"""
    leave = Leave.query.get_or_404(leave_id)
    return jsonify(leave.to_dict(include_scholar=True)), 200


@bp.route('/balance', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_leave_balance():
    """Get leave balance for current scholar"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    # Get or create leave balance
    balance = LeaveBalance.query.filter_by(scholar_id=scholar.id).first()
    if not balance:
        balance = LeaveBalance(scholar_id=scholar.id)
        db.session.add(balance)
        db.session.commit()

    return jsonify(balance.to_dict()), 200


@bp.route('', methods=['POST'], strict_slashes=False)
@jwt_required()
@role_required('scholar')
def create_leave():
    """Create a new leave application"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    # Handle multipart/form-data
    leave_type = request.form.get('leave_type')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    total_days = request.form.get('total_days')
    reason = request.form.get('reason')

    # Validate required fields
    if not all([leave_type, start_date, end_date, total_days, reason]):
        return jsonify({'error': 'All fields are required'}), 400

    # Validate leave type
    if leave_type not in ['personal', 'medical', 'maternity', 'paternity']:
        return jsonify({'error': 'Invalid leave type'}), 400

    # Check leave balance
    balance = LeaveBalance.query.filter_by(scholar_id=scholar.id).first()
    if not balance:
        balance = LeaveBalance(scholar_id=scholar.id)
        db.session.add(balance)
        db.session.flush()

    total_days_int = int(total_days)

    # Validate leave availability
    if leave_type == 'personal':
        if balance.personal_leave_used + total_days_int > balance.personal_leave_total:
            return jsonify({'error': 'Insufficient personal leave balance'}), 400
    elif leave_type == 'medical':
        if balance.medical_leave_used + total_days_int > balance.medical_leave_total:
            return jsonify({'error': 'Insufficient medical leave balance'}), 400
    elif leave_type == 'maternity':
        if balance.maternity_leave_taken:
            return jsonify({'error': 'Maternity leave already taken'}), 400
    elif leave_type == 'paternity':
        if balance.paternity_leave_taken:
            return jsonify({'error': 'Paternity leave already taken'}), 400

    # Handle file upload (supporting document)
    supporting_document = None
    if 'supporting_document' in request.files:
        file = request.files['supporting_document']
        if file and file.filename:
            supporting_document = save_uploaded_file(file, 'leaves')

    # Validate supporting document for non-personal leaves
    if leave_type != 'personal' and not supporting_document:
        return jsonify({'error': f'Supporting document is required for {leave_type} leave'}), 400

    # Create leave application
    leave = Leave(
        scholar_id=scholar.id,
        leave_type=leave_type,
        start_date=datetime.fromisoformat(start_date).date() if isinstance(start_date, str) else start_date,
        end_date=datetime.fromisoformat(end_date).date() if isinstance(end_date, str) else end_date,
        total_days=total_days_int,
        reason=reason,
        supporting_document=supporting_document,
        status='submitted',
        current_stage='supervisor'
    )

    db.session.add(leave)
    db.session.flush()

    # Notify supervisor
    if scholar.supervisor:
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='New Leave Application',
            message=f'Scholar {scholar.enrollment_number} has submitted a {leave_type} leave application for {total_days} days',
            notification_type='approval',
            priority='high',
            related_entity_type='leave',
            related_entity_id=leave.id,
            action_link=f'/leaves/{leave.id}'
        )

    db.session.commit()

    return jsonify({
        'message': 'Leave application submitted successfully',
        'leave': leave.to_dict()
    }), 201


@bp.route('/<int:leave_id>/approve', methods=['POST'])
@jwt_required()
def approve_leave(leave_id):
    """Approve or reject leave application"""
    current_user = get_current_user()
    leave = Leave.query.get_or_404(leave_id)
    scholar = leave.scholar

    data = request.get_json()
    decision = data.get('decision')  # approved, rejected
    feedback = data.get('feedback', '')

    if decision not in ['approved', 'rejected']:
        return jsonify({'error': 'Invalid decision'}), 400

    # Determine current user's approval stage
    current_stage = None

    if current_user.role == 'supervisor' and scholar.supervisor_id == current_user.supervisor_profile.id:
        current_stage = 'supervisor'
    elif current_user.role == 'school_chair':
        current_stage = 'school_chair'

    if not current_stage or leave.current_stage != current_stage:
        return jsonify({'error': 'Not authorized to approve at this stage'}), 403

    # Reject requires feedback
    if decision == 'rejected' and not feedback:
        return jsonify({'error': 'Feedback is required for rejection'}), 400

    # Create approval record
    approval = LeaveApproval(
        leave_id=leave.id,
        approval_stage=current_stage,
        approver_id=current_user.id,
        decision=decision,
        feedback=feedback
    )

    db.session.add(approval)

    if decision == 'rejected':
        leave.status = 'rejected'

        # Notify scholar
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Leave Application Rejected',
            message=f'Your {leave.leave_type} leave application has been rejected by {current_user.name}. Feedback: {feedback}',
            notification_type='alert',
            priority='high',
            related_entity_type='leave',
            related_entity_id=leave.id,
            action_link=f'/leaves'
        )

    elif decision == 'approved':
        # Move to next stage or approve
        if current_stage == 'supervisor':
            leave.current_stage = 'school_chair'
            leave.status = 'under_review'

            # Notify school chair
            if scholar.school and scholar.school.chair:
                NotificationService.create_notification(
                    user_id=scholar.school.chair_id,
                    title='Leave Application Pending Approval',
                    message=f'Scholar {scholar.enrollment_number} has a {leave.leave_type} leave application pending your approval',
                    notification_type='approval',
                    priority='high',
                    related_entity_type='leave',
                    related_entity_id=leave.id,
                    action_link=f'/leaves/{leave.id}'
                )

        elif current_stage == 'school_chair':
            leave.status = 'approved'

            # Update leave balance
            balance = LeaveBalance.query.filter_by(scholar_id=scholar.id).first()
            if balance:
                if leave.leave_type == 'personal':
                    balance.personal_leave_used += leave.total_days
                elif leave.leave_type == 'medical':
                    balance.medical_leave_used += leave.total_days
                elif leave.leave_type == 'maternity':
                    balance.maternity_leave_taken = True
                elif leave.leave_type == 'paternity':
                    balance.paternity_leave_taken = True

            # Notify scholar
            NotificationService.create_notification(
                user_id=scholar.user_id,
                title='Leave Application Approved',
                message=f'Your {leave.leave_type} leave application for {leave.total_days} days has been approved',
                notification_type='success',
                priority='high',
                related_entity_type='leave',
                related_entity_id=leave.id,
                action_link=f'/leaves'
            )

    db.session.commit()

    return jsonify({
        'message': f'Leave application {decision} successfully',
        'leave': leave.to_dict()
    }), 200


@bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_leaves():
    """Get pending leave approvals for current user"""
    current_user = get_current_user()

    query = Leave.query.filter(Leave.status.in_(['submitted', 'under_review']))

    if current_user.role == 'supervisor':
        # Get leaves from supervised scholars that are pending supervisor approval
        if current_user.supervisor_profile:
            scholar_ids = [s.id for s in current_user.supervisor_profile.supervised_scholars]
            query = query.filter(
                Leave.scholar_id.in_(scholar_ids),
                Leave.current_stage == 'supervisor'
            )

    elif current_user.role == 'school_chair':
        # Get leaves from school scholars that are pending school chair approval
        from app.models.school import School
        school = School.query.filter_by(chair_id=current_user.id).first()
        if school:
            scholar_ids = [s.id for s in school.scholars]
            query = query.filter(
                Leave.scholar_id.in_(scholar_ids),
                Leave.current_stage == 'school_chair'
            )
    else:
        return jsonify([]), 200

    leaves = query.order_by(Leave.submission_date.desc()).all()
    return jsonify([leave.to_dict(include_scholar=True) for leave in leaves]), 200
