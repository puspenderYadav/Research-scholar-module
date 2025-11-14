from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.seminar import Seminar
from app.models.scholar import Scholar
from app.utils.decorators import role_required, get_current_user
from app.utils.notification_service import NotificationService
from datetime import datetime, timedelta

bp = Blueprint('seminars', __name__, url_prefix='/api/seminars')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_seminars(scholar_id):
    """Get seminars for a scholar with requirement information"""
    scholar = Scholar.query.get_or_404(scholar_id)
    seminars = Seminar.query.filter_by(scholar_id=scholar_id).order_by(Seminar.scheduled_date.desc()).all()
    
    # Determine seminar requirements based on program
    required_seminars = 2 if scholar.program.lower() in ['phd', 'ph.d', 'ph.d.', 'doctor of philosophy'] else 1
    completed_seminars = len([s for s in seminars if s.status == 'completed'])
    
    return jsonify({
        'seminars': [s.to_dict() for s in seminars],
        'required_seminars': required_seminars,
        'completed_seminars': completed_seminars,
        'remaining_seminars': max(0, required_seminars - completed_seminars)
    }), 200

@bp.route('/supervisor/scholars', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def get_supervisor_scholars_seminars():
    """Get seminars for all scholars supervised by current user"""
    current_user = get_current_user()
    
    if not current_user.supervisor_profile:
        return jsonify({'error': 'Supervisor profile not found'}), 404
    
    scholars = current_user.supervisor_profile.supervised_scholars
    seminars_data = []
    
    for scholar in scholars:
        seminars = Seminar.query.filter_by(scholar_id=scholar.id).order_by(Seminar.scheduled_date.desc()).all()
        required_seminars = 2 if scholar.program.lower() in ['phd', 'ph.d', 'ph.d.', 'doctor of philosophy'] else 1
        completed_seminars = len([s for s in seminars if s.status == 'completed'])
        
        seminars_data.append({
            'scholar': {
                'id': scholar.id,
                'name': scholar.user.name,
                'enrollment_number': scholar.enrollment_number,
                'program': scholar.program
            },
            'seminars': [s.to_dict() for s in seminars],
            'required_seminars': required_seminars,
            'completed_seminars': completed_seminars,
            'remaining_seminars': max(0, required_seminars - completed_seminars)
        })
    
    return jsonify(seminars_data), 200

@bp.route('/schedule', methods=['POST'])
@jwt_required()
@role_required('supervisor')
def schedule_seminar():
    """Schedule a seminar for a scholar (supervisor only)"""
    current_user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['scholar_id', 'title', 'seminar_type', 'scheduled_date', 'venue']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    scholar = Scholar.query.get_or_404(data['scholar_id'])
    
    # Verify supervisor is authorized to schedule for this scholar
    if current_user.supervisor_profile.id != scholar.supervisor_id:
        return jsonify({'error': 'You are not authorized to schedule seminars for this scholar'}), 403
    
    # Parse scheduled date
    try:
        scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
    except ValueError:
        scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d %H:%M')
    
    # Check seminar requirements
    existing_seminars = Seminar.query.filter_by(scholar_id=scholar.id).all()
    required_seminars = 2 if scholar.program.lower() in ['phd', 'ph.d', 'ph.d.', 'doctor of philosophy'] else 1
    
    if len(existing_seminars) >= required_seminars:
        return jsonify({'error': f'Scholar has already completed/scheduled the required {required_seminars} seminar(s)'}), 400
    
    seminar = Seminar(
        scholar_id=scholar.id,
        title=data['title'],
        seminar_type=data['seminar_type'],
        scheduled_date=scheduled_date,
        duration_minutes=data.get('duration_minutes', 60),
        venue=data['venue'],
        online_link=data.get('online_link'),
        abstract=data.get('abstract'),
        status='scheduled',
        scheduled_by=current_user.id
    )
    
    db.session.add(seminar)
    db.session.commit()
    
    # Notify scholar about scheduled seminar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='Open Seminar Scheduled',
        message=f'Your {seminar.seminar_type} has been scheduled by your supervisor for {scheduled_date.strftime("%B %d, %Y at %I:%M %p")}. Venue: {seminar.venue}',
        notification_type='seminar',
        priority='high',
        related_entity_type='seminar',
        related_entity_id=seminar.id,
        action_link='/seminars',
        send_email=True
    )
    
    # Create reminder notification for 3 days before
    reminder_date = scheduled_date - timedelta(days=3)
    if reminder_date > datetime.now():
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Seminar Reminder - 3 Days',
            message=f'Reminder: Your {seminar.seminar_type} is scheduled for {scheduled_date.strftime("%B %d, %Y at %I:%M %p")}. Venue: {seminar.venue}',
            notification_type='reminder',
            priority='high',
            related_entity_type='seminar',
            related_entity_id=seminar.id,
            action_link='/seminars',
            send_email=False
        )
    
    # Create reminder notification for 1 day before
    reminder_date_1 = scheduled_date - timedelta(days=1)
    if reminder_date_1 > datetime.now():
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Seminar Reminder - Tomorrow!',
            message=f'Reminder: Your {seminar.seminar_type} is tomorrow at {scheduled_date.strftime("%I:%M %p")}. Venue: {seminar.venue}. Please be prepared!',
            notification_type='reminder',
            priority='urgent',
            related_entity_type='seminar',
            related_entity_id=seminar.id,
            action_link='/seminars',
            send_email=True
        )
    
    return jsonify({
        'message': 'Seminar scheduled successfully. Scholar has been notified.',
        'seminar': seminar.to_dict()
    }), 201

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('supervisor', 'scholar', 'dean_academics')
def create_seminar():
    """Create/Schedule a seminar (legacy endpoint - use /schedule for supervisor scheduling)"""
    current_user = get_current_user()
    data = request.get_json()

    seminar = Seminar(
        scholar_id=data['scholar_id'],
        title=data['title'],
        seminar_type=data['seminar_type'],
        scheduled_date=datetime.fromisoformat(data['scheduled_date']) if data.get('scheduled_date') else None,
        duration_minutes=data.get('duration_minutes', 60),
        venue=data.get('venue'),
        online_link=data.get('online_link'),
        abstract=data.get('abstract'),
        status='scheduled' if data.get('scheduled_date') else 'pending',
        scheduled_by=current_user.id
    )

    db.session.add(seminar)
    db.session.commit()

    # Notify scholar if scheduled by supervisor
    if current_user.role == 'supervisor' and seminar.scheduled_date:
        NotificationService.notify_seminar_scheduled(data['scholar_id'], seminar.id, seminar.scheduled_date)

    return jsonify(seminar.to_dict()), 201

@bp.route('/<int:seminar_id>', methods=['GET'])
@jwt_required()
def get_seminar_details(seminar_id):
    """Get detailed information about a specific seminar"""
    seminar = Seminar.query.get_or_404(seminar_id)
    seminar_dict = seminar.to_dict()
    
    # Add scholar information
    scholar = seminar.scholar
    seminar_dict['scholar'] = {
        'id': scholar.id,
        'name': scholar.user.name,
        'enrollment_number': scholar.enrollment_number,
        'program': scholar.program,
        'research_area': scholar.research_area
    }
    
    # Add scheduled by information
    if seminar.scheduled_by_user:
        seminar_dict['scheduled_by'] = {
            'name': seminar.scheduled_by_user.name,
            'role': seminar.scheduled_by_user.role
        }
    
    return jsonify(seminar_dict), 200

@bp.route('/<int:seminar_id>', methods=['PUT'])
@jwt_required()
def update_seminar(seminar_id):
    """Update seminar details"""
    current_user = get_current_user()
    seminar = Seminar.query.get_or_404(seminar_id)
    data = request.get_json()
    
    # Only supervisor who scheduled or admin can update
    if current_user.role not in ['dean_academics', 'ad_research']:
        if current_user.role == 'supervisor':
            if current_user.id != seminar.scheduled_by:
                return jsonify({'error': 'Not authorized to update this seminar'}), 403
        else:
            return jsonify({'error': 'Not authorized'}), 403
    
    # Update fields
    if 'title' in data:
        seminar.title = data['title']
    if 'scheduled_date' in data:
        try:
            old_date = seminar.scheduled_date
            seminar.scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
            
            # Notify scholar if date changed
            if old_date != seminar.scheduled_date and seminar.scheduled_date:
                NotificationService.create_notification(
                    user_id=seminar.scholar.user_id,
                    title='Seminar Date Updated',
                    message=f'Your {seminar.seminar_type} has been rescheduled to {seminar.scheduled_date.strftime("%B %d, %Y at %I:%M %p")}',
                    notification_type='seminar',
                    priority='high',
                    related_entity_type='seminar',
                    related_entity_id=seminar.id,
                    action_link='/seminars',
                    send_email=True
                )
        except ValueError:
            seminar.scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d %H:%M')
    
    if 'venue' in data:
        seminar.venue = data['venue']
    if 'online_link' in data:
        seminar.online_link = data['online_link']
    if 'duration_minutes' in data:
        seminar.duration_minutes = data['duration_minutes']
    if 'abstract' in data:
        seminar.abstract = data['abstract']
    if 'status' in data:
        seminar.status = data['status']
        
        # Notify scholar if status changed to completed
        if data['status'] == 'completed':
            NotificationService.create_notification(
                user_id=seminar.scholar.user_id,
                title='Seminar Marked as Completed',
                message=f'Your {seminar.seminar_type} has been marked as completed.',
                notification_type='success',
                priority='medium',
                related_entity_type='seminar',
                related_entity_id=seminar.id,
                action_link='/seminars',
                send_email=False
            )
    
    if 'feedback' in data:
        seminar.feedback = data['feedback']
    if 'attendance_count' in data:
        seminar.attendance_count = data['attendance_count']

    seminar.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Seminar updated successfully',
        'seminar': seminar.to_dict()
    }), 200
