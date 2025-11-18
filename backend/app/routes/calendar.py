from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.exam import Exam
from app.models.seminar import Seminar
from app.models.thesis import Thesis
from app.models.meeting import Meeting
from app.utils.decorators import get_current_user
from datetime import datetime, timedelta

bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')

@bp.route('/events', methods=['GET'])
@jwt_required()
def get_calendar_events():
    """Get all calendar events for current user"""
    current_user = get_current_user()

    # Get date range from query params
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date:
        start_date = datetime.now()
    else:
        start_date = datetime.fromisoformat(start_date)

    if not end_date:
        end_date = start_date + timedelta(days=90)
    else:
        end_date = datetime.fromisoformat(end_date)

    events = []

    # Get scholar ID if user is a scholar
    scholar_id = None
    if current_user.role == 'scholar' and current_user.scholar_profile:
        scholar_id = current_user.scholar_profile.id

    # Get exams
    exam_query = Exam.query.filter(
        Exam.scheduled_date.between(start_date, end_date)
    )
    if scholar_id:
        exam_query = exam_query.filter_by(scholar_id=scholar_id)

    for exam in exam_query.all():
        events.append({
            'id': exam.id,
            'type': 'exam',
            'title': f'{exam.exam_type} Exam',
            'start': exam.scheduled_date.isoformat() if exam.scheduled_date else None,
            'venue': exam.venue,
            'status': exam.status
        })

    # Get seminars
    seminar_query = Seminar.query.filter(
        Seminar.scheduled_date.between(start_date, end_date)
    )
    if scholar_id:
        seminar_query = seminar_query.filter_by(scholar_id=scholar_id)

    for seminar in seminar_query.all():
        events.append({
            'id': seminar.id,
            'type': 'seminar',
            'title': seminar.title,
            'start': seminar.scheduled_date.isoformat() if seminar.scheduled_date else None,
            'venue': seminar.venue,
            'online_link': seminar.online_link,
            'status': seminar.status
        })

    # Get thesis defenses
    thesis_query = Thesis.query.filter(
        Thesis.defense_date.between(start_date, end_date)
    )
    if scholar_id:
        thesis_query = thesis_query.filter_by(scholar_id=scholar_id)

    for thesis in thesis_query.all():
        events.append({
            'id': thesis.id,
            'type': 'thesis_defense',
            'title': 'Thesis Defense',
            'start': thesis.defense_date.isoformat() if thesis.defense_date else None,
            'venue': thesis.defense_venue,
            'status': thesis.defense_status
        })

    # Get meetings
    meeting_query = Meeting.query.filter(
        Meeting.scheduled_at.between(start_date, end_date),
        Meeting.status != 'cancelled'
    )
    if scholar_id:
        meeting_query = meeting_query.filter_by(scholar_id=scholar_id)
    elif current_user.role == 'supervisor' and current_user.supervisor_profile:
        # Show meetings for scholars supervised by this supervisor
        meeting_query = meeting_query.filter_by(supervisor_id=current_user.supervisor_profile.id)

    for meeting in meeting_query.all():
        events.append({
            'id': meeting.id,
            'type': 'meeting',
            'title': f'Meeting with {meeting.scholar.user.name if scholar_id else meeting.supervisor.user.name}',
            'start': meeting.scheduled_at.isoformat() if meeting.scheduled_at else None,
            'venue': meeting.venue,
            'online_link': meeting.online_link,
            'status': meeting.status
        })

    return jsonify(events), 200
