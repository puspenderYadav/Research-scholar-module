from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.meeting import Meeting
from app.models.scholar import Scholar
from app.utils.decorators import role_required, get_current_user
from app.utils.notification_service import NotificationService
from datetime import datetime, timedelta

bp = Blueprint('meetings', __name__, url_prefix='/api/meetings')


@bp.route('', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_meetings():
    """Get meetings based on user role"""
    current_user = get_current_user()

    query = Meeting.query

    if current_user.role == 'scholar':
        # Scholar sees only their own meetings
        scholar = current_user.scholar_profile
        if not scholar:
            return jsonify({'error': 'Scholar profile not found'}), 404
        query = query.filter_by(scholar_id=scholar.id)

    elif current_user.role == 'supervisor':
        # Supervisor sees meetings they organized
        query = query.filter_by(faculty_id=current_user.id)

    else:
        return jsonify({'error': 'Unauthorized'}), 403

    # Get all meetings, ordered by date
    meetings = query.order_by(Meeting.meeting_date.desc()).all()

    # Include scholar and faculty details
    result = []
    for meeting in meetings:
        meeting_dict = meeting.to_dict()

        # Add scholar details
        scholar = Scholar.query.get(meeting.scholar_id)
        if scholar:
            meeting_dict['scholar'] = {
                'id': scholar.id,
                'name': scholar.user.name,
                'enrollment_number': scholar.enrollment_number
            }

        # Add faculty details
        from app.models.user import User
        faculty = User.query.get(meeting.faculty_id)
        if faculty:
            meeting_dict['faculty'] = {
                'id': faculty.id,
                'name': faculty.name
            }

        # Calculate time remaining for future meetings
        if meeting.meeting_date > datetime.utcnow() and meeting.status == 'scheduled':
            time_diff = meeting.meeting_date - datetime.utcnow()
            days = time_diff.days
            hours = time_diff.seconds // 3600
            minutes = (time_diff.seconds % 3600) // 60

            meeting_dict['time_remaining'] = {
                'days': days,
                'hours': hours,
                'minutes': minutes,
                'total_seconds': time_diff.total_seconds()
            }

        result.append(meeting_dict)

    return jsonify(result), 200


@bp.route('/<int:meeting_id>', methods=['GET'])
@jwt_required()
def get_meeting(meeting_id):
    """Get meeting details"""
    current_user = get_current_user()
    meeting = Meeting.query.get_or_404(meeting_id)

    # Check authorization
    if current_user.role == 'scholar':
        scholar = current_user.scholar_profile
        if not scholar or meeting.scholar_id != scholar.id:
            return jsonify({'error': 'Unauthorized'}), 403
    elif current_user.role == 'supervisor':
        if meeting.faculty_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
    else:
        return jsonify({'error': 'Unauthorized'}), 403

    meeting_dict = meeting.to_dict()

    # Add scholar details
    scholar = Scholar.query.get(meeting.scholar_id)
    if scholar:
        meeting_dict['scholar'] = {
            'id': scholar.id,
            'name': scholar.user.name,
            'enrollment_number': scholar.enrollment_number
        }

    return jsonify(meeting_dict), 200


@bp.route('/supervised-scholars', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def get_supervised_scholars():
    """Get scholars supervised by current faculty"""
    current_user = get_current_user()

    if not current_user.supervisor_profile:
        return jsonify({'error': 'Supervisor profile not found'}), 404

    scholars = current_user.supervisor_profile.supervised_scholars

    result = [{
        'id': scholar.id,
        'name': scholar.user.name,
        'enrollment_number': scholar.enrollment_number
    } for scholar in scholars]

    return jsonify(result), 200


@bp.route('', methods=['POST'], strict_slashes=False)
@jwt_required()
@role_required('supervisor')
def create_meeting():
    """Create a new meeting (faculty only)"""
    current_user = get_current_user()
    data = request.get_json()

    # Validate required fields
    scholar_id = data.get('scholar_id')
    meeting_date = data.get('meeting_date')
    description = data.get('description')

    if not all([scholar_id, meeting_date]):
        return jsonify({'error': 'Scholar ID and meeting date are required'}), 400

    # Validate scholar is supervised by current faculty
    scholar = Scholar.query.get(scholar_id)
    if not scholar:
        return jsonify({'error': 'Scholar not found'}), 404

    if not current_user.supervisor_profile:
        return jsonify({'error': 'Supervisor profile not found'}), 404

    if scholar.supervisor_id != current_user.supervisor_profile.id:
        return jsonify({'error': 'You can only schedule meetings with scholars you supervise'}), 403

    # Parse meeting date
    try:
        meeting_datetime = datetime.fromisoformat(meeting_date.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    # Create meeting
    meeting = Meeting(
        faculty_id=current_user.id,
        scholar_id=scholar_id,
        meeting_date=meeting_datetime,
        description=description,
        status='scheduled'
    )

    db.session.add(meeting)
    db.session.flush()

    # Notify scholar
    NotificationService.create_notification(
        user_id=scholar.user_id,
        title='New Meeting Scheduled',
        message=f'{current_user.name} has scheduled a meeting with you on {meeting_datetime.strftime("%B %d, %Y at %I:%M %p")}',
        notification_type='meeting',
        priority='high',
        related_entity_type='meeting',
        related_entity_id=meeting.id,
        action_link=f'/meetings/{meeting.id}'
    )

    db.session.commit()

    return jsonify({
        'message': 'Meeting scheduled successfully',
        'meeting': meeting.to_dict()
    }), 201


@bp.route('/<int:meeting_id>', methods=['PUT'])
@jwt_required()
@role_required('supervisor')
def update_meeting(meeting_id):
    """Update a meeting"""
    current_user = get_current_user()
    meeting = Meeting.query.get_or_404(meeting_id)

    # Check authorization
    if meeting.faculty_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    # Update fields
    if 'meeting_date' in data:
        try:
            meeting.meeting_date = datetime.fromisoformat(data['meeting_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

    if 'description' in data:
        meeting.description = data['description']

    if 'status' in data:
        if data['status'] not in ['scheduled', 'completed', 'cancelled', 'missed']:
            return jsonify({'error': 'Invalid status'}), 400
        meeting.status = data['status']

    if 'notes' in data:
        meeting.notes = data['notes']

    # Notify scholar about update
    scholar = Scholar.query.get(meeting.scholar_id)
    if scholar:
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Meeting Updated',
            message=f'{current_user.name} has updated the meeting scheduled for {meeting.meeting_date.strftime("%B %d, %Y at %I:%M %p")}',
            notification_type='meeting',
            priority='medium',
            related_entity_type='meeting',
            related_entity_id=meeting.id,
            action_link=f'/meetings/{meeting.id}'
        )

    db.session.commit()

    return jsonify({
        'message': 'Meeting updated successfully',
        'meeting': meeting.to_dict()
    }), 200


@bp.route('/<int:meeting_id>', methods=['DELETE'])
@jwt_required()
@role_required('supervisor')
def cancel_meeting(meeting_id):
    """Cancel a meeting"""
    current_user = get_current_user()
    meeting = Meeting.query.get_or_404(meeting_id)

    # Check authorization
    if meeting.faculty_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    meeting.status = 'cancelled'

    # Notify scholar
    scholar = Scholar.query.get(meeting.scholar_id)
    if scholar:
        NotificationService.create_notification(
            user_id=scholar.user_id,
            title='Meeting Cancelled',
            message=f'{current_user.name} has cancelled the meeting scheduled for {meeting.meeting_date.strftime("%B %d, %Y at %I:%M %p")}',
            notification_type='meeting',
            priority='high',
            related_entity_type='meeting',
            related_entity_id=meeting.id
        )

    db.session.commit()

    return jsonify({'message': 'Meeting cancelled successfully'}), 200


@bp.route('/<int:meeting_id>/scholar-comment', methods=['POST'])
@jwt_required()
@role_required('scholar')
def add_scholar_comment(meeting_id):
    """Add or update scholar comment on a meeting"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    meeting = Meeting.query.get_or_404(meeting_id)

    # Check authorization - scholar can only comment on their own meetings
    if meeting.scholar_id != scholar.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    comment = data.get('comment', '')

    meeting.scholar_comment = comment

    # Notify faculty about the comment
    from app.models.user import User
    faculty = User.query.get(meeting.faculty_id)
    if faculty and comment:
        NotificationService.create_notification(
            user_id=faculty.id,
            title='Scholar Added Comment to Meeting',
            message=f'{current_user.name} has added a comment to the meeting scheduled for {meeting.meeting_date.strftime("%B %d, %Y at %I:%M %p")}: "{comment}"',
            notification_type='meeting',
            priority='medium',
            related_entity_type='meeting',
            related_entity_id=meeting.id,
            action_link=f'/meetings/{meeting.id}'
        )

    db.session.commit()

    return jsonify({
        'message': 'Comment added successfully',
        'meeting': meeting.to_dict()
    }), 200


@bp.route('/cleanup-old', methods=['POST'])
@jwt_required()
def cleanup_old_meetings():
    """Cleanup old meetings (keeps only last 10 for each faculty-scholar pair)"""
    current_user = get_current_user()

    if current_user.role == 'supervisor':
        # Get all meetings organized by this faculty
        all_meetings = Meeting.query.filter_by(faculty_id=current_user.id).order_by(Meeting.meeting_date.desc()).all()

        # Group by scholar
        scholar_meetings = {}
        for meeting in all_meetings:
            if meeting.scholar_id not in scholar_meetings:
                scholar_meetings[meeting.scholar_id] = []
            scholar_meetings[meeting.scholar_id].append(meeting)

        # Delete old meetings (keep only 10 per scholar)
        deleted_count = 0
        for scholar_id, meetings in scholar_meetings.items():
            if len(meetings) > 10:
                # Delete oldest meetings
                for meeting in meetings[10:]:
                    db.session.delete(meeting)
                    deleted_count += 1

        db.session.commit()

        return jsonify({'message': f'{deleted_count} old meetings deleted'}), 200

    return jsonify({'error': 'Unauthorized'}), 403


@bp.route('/cleanup-notifications', methods=['POST'])
@jwt_required()
def cleanup_meeting_notifications():
    """Cleanup meeting notifications older than 24 hours after meeting time"""
    from app.models.notification import Notification

    # Find meeting notifications older than their meeting time + 24 hours
    old_notifications = Notification.query.filter(
        Notification.notification_type == 'meeting',
        Notification.related_entity_type == 'meeting'
    ).all()

    deleted_count = 0
    for notification in old_notifications:
        if notification.related_entity_id:
            meeting = Meeting.query.get(notification.related_entity_id)
            if meeting and meeting.meeting_date:
                # Delete if 24 hours have passed since meeting
                if datetime.utcnow() > meeting.meeting_date + timedelta(hours=24):
                    db.session.delete(notification)
                    deleted_count += 1

    db.session.commit()

    return jsonify({'message': f'{deleted_count} old notifications deleted'}), 200
