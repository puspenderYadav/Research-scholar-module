from datetime import datetime, timedelta, time

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import false
from sqlalchemy.orm import joinedload

from app.models.exam import Exam
from app.models.meeting import Meeting
from app.models.scholar import Scholar
from app.models.school import School
from app.models.seminar import Seminar
from app.models.thesis import Thesis
from app.models.thesis_defense import ThesisDefense
from app.models.comprehensive_exam import ComprehensiveExam, ComprehensiveExamRegistration
from app.utils.decorators import get_current_user

bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')


def _parse_iso_datetime(raw_value):
    """Convert ISO date strings (including trailing 'Z') into naive datetime objects."""
    if not raw_value:
        return None

    value = raw_value
    if isinstance(raw_value, str):
        value = raw_value.replace('Z', '+00:00')
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
    else:
        parsed = raw_value

    return parsed.replace(tzinfo=None) if parsed.tzinfo else parsed


def _get_accessible_scholar_ids(user):
    """Return None for full access, otherwise a set of scholar IDs the user can view."""
    if user.role in ('ad_research', 'dean_academics'):
        return None

    scholar_ids = set()

    if user.role == 'scholar' and user.scholar_profile:
        scholar_ids.add(user.scholar_profile.id)
        return scholar_ids

    if user.role == 'supervisor' and user.supervisor_profile:
        supervised = list(getattr(user.supervisor_profile, 'supervised_scholars', []) or [])
        co_supervised = list(getattr(user.supervisor_profile, 'co_supervised_scholars', []) or [])
        scholar_ids.update(s.id for s in supervised)
        scholar_ids.update(s.id for s in co_supervised)

    committee_roles = {'dc_member', 'apc_member', 'committee_member'}
    if user.role in committee_roles and user.supervisor_profile:
        memberships = user.supervisor_profile.committee_memberships or []
        for membership in memberships:
            if membership.is_active and membership.committee:
                scholar_ids.add(membership.committee.scholar_id)

    if user.role == 'school_chair':
        schools = School.query.filter_by(chair_id=user.id, is_deleted=False).all()
        for school in schools:
            for scholar in school.scholars.all():
                scholar_ids.add(scholar.id)

    return scholar_ids


def _build_scholar_payload(scholar):
    if not scholar:
        return None

    return {
        'id': scholar.id,
        'name': scholar.user.name if scholar.user else None,
        'enrollment_number': scholar.enrollment_number,
        'program': scholar.program,
        'school_code': scholar.school.code if scholar.school else None,
    }


def _should_include_scholar(scholar_id, allowed_ids):
    if allowed_ids is None:
        return True
    if not allowed_ids:
        return False
    return scholar_id in allowed_ids


@bp.route('/events', methods=['GET'])
@jwt_required()
def get_calendar_events():
    """Return upcoming events (meetings, seminars, exams, defenses) scoped to the user."""
    current_user = get_current_user()

    start_date = _parse_iso_datetime(request.args.get('start_date')) or datetime.utcnow()
    end_date = _parse_iso_datetime(request.args.get('end_date')) or (start_date + timedelta(days=90))

    accessible_scholar_ids = _get_accessible_scholar_ids(current_user)
    if accessible_scholar_ids is not None and len(accessible_scholar_ids) == 0:
        return jsonify([]), 200

    events = []

    # Exams / comprehensive exams
    exam_query = Exam.query.options(
        joinedload(Exam.scholar).joinedload(Scholar.user),
        joinedload(Exam.scholar).joinedload(Scholar.school),
    ).filter(Exam.scheduled_date.isnot(None), Exam.scheduled_date.between(start_date, end_date))

    if accessible_scholar_ids is not None:
        exam_query = exam_query.filter(Exam.scholar_id.in_(accessible_scholar_ids))

    for exam in exam_query.all():
        if not _should_include_scholar(exam.scholar_id, accessible_scholar_ids):
            continue
        scholar_payload = _build_scholar_payload(exam.scholar)
        events.append({
            'id': f'exam-{exam.id}',
            'type': 'exam',
            'title': f"{exam.exam_type.title()} Exam - {scholar_payload['name'] if scholar_payload else 'Scholar'}",
            'start': exam.scheduled_date.isoformat(),
            'venue': exam.venue,
            'status': exam.status,
            'scholar': scholar_payload,
            'details': {
                'exam_type': exam.exam_type,
                'result': exam.result,
                'remarks': exam.remarks,
            },
        })

    # Seminars
    seminar_query = Seminar.query.options(
        joinedload(Seminar.scholar).joinedload(Scholar.user),
        joinedload(Seminar.scholar).joinedload(Scholar.school),
    ).filter(Seminar.scheduled_date.isnot(None), Seminar.scheduled_date.between(start_date, end_date))

    if accessible_scholar_ids is not None:
        seminar_query = seminar_query.filter(Seminar.scholar_id.in_(accessible_scholar_ids))

    for seminar in seminar_query.all():
        if not _should_include_scholar(seminar.scholar_id, accessible_scholar_ids):
            continue
        scholar_payload = _build_scholar_payload(seminar.scholar)
        events.append({
            'id': f'seminar-{seminar.id}',
            'type': 'seminar',
            'title': seminar.title or seminar.seminar_type,
            'start': seminar.scheduled_date.isoformat(),
            'venue': seminar.venue,
            'online_link': seminar.online_link,
            'status': seminar.status,
            'scholar': scholar_payload,
            'details': {
                'seminar_type': seminar.seminar_type,
                'duration_minutes': seminar.duration_minutes,
                'abstract': seminar.abstract,
            },
        })

    # Thesis defenses (new model)
    defense_query = ThesisDefense.query.join(Thesis).options(
        joinedload(ThesisDefense.thesis).joinedload(Thesis.scholar).joinedload(Scholar.user),
        joinedload(ThesisDefense.thesis).joinedload(Thesis.scholar).joinedload(Scholar.school),
    ).filter(
        ThesisDefense.defense_date.between(start_date.date(), end_date.date())
    )

    if accessible_scholar_ids is not None:
        defense_query = defense_query.filter(Thesis.scholar_id.in_(accessible_scholar_ids))

    for defense in defense_query.all():
        thesis = defense.thesis
        scholar = thesis.scholar if thesis else None
        scholar_payload = _build_scholar_payload(scholar)
        defense_time = defense.defense_time or time(hour=10, minute=0)
        defense_dt = datetime.combine(defense.defense_date, defense_time)

        events.append({
            'id': f'defense-{defense.id}',
            'type': 'thesis_defense',
            'title': f"Thesis Defense - {scholar_payload['name'] if scholar_payload else 'Scholar'}",
            'start': defense_dt.isoformat(),
            'venue': defense.venue,
            'status': defense.status,
            'scholar': scholar_payload,
            'details': {
                'outcome': defense.outcome,
                'committee_comments': defense.committee_comments,
            },
        })

    # Legacy thesis defense fields (fallback)
    legacy_thesis_query = Thesis.query.options(
        joinedload(Thesis.scholar).joinedload(Scholar.user),
        joinedload(Thesis.scholar).joinedload(Scholar.school),
    ).filter(Thesis.defense_date.isnot(None), Thesis.defense_date.between(start_date, end_date))

    if accessible_scholar_ids is not None:
        legacy_thesis_query = legacy_thesis_query.filter(Thesis.scholar_id.in_(accessible_scholar_ids))

    for thesis in legacy_thesis_query.all():
        if not thesis.defense_date:
            continue
        scholar_payload = _build_scholar_payload(thesis.scholar)
        events.append({
            'id': f'thesis-{thesis.id}',
            'type': 'thesis_defense',
            'title': f"Thesis Defense - {scholar_payload['name'] if scholar_payload else 'Scholar'}",
            'start': thesis.defense_date.isoformat(),
            'venue': thesis.defense_venue,
            'status': thesis.defense_status,
            'scholar': scholar_payload,
        })

    # Meetings
    meeting_query = Meeting.query.options(
        joinedload(Meeting.scholar).joinedload(Scholar.user),
        joinedload(Meeting.scholar).joinedload(Scholar.school),
        joinedload(Meeting.faculty),
    ).filter(
        Meeting.meeting_date.isnot(None),
        Meeting.meeting_date.between(start_date, end_date),
    )

    if current_user.role == 'scholar' and current_user.scholar_profile:
        meeting_query = meeting_query.filter(Meeting.scholar_id == current_user.scholar_profile.id)
    elif current_user.role == 'supervisor':
        meeting_query = meeting_query.filter(Meeting.faculty_id == current_user.id)
    else:
        meeting_query = meeting_query.filter(false())

    for meeting in meeting_query.all():
        if current_user.role == 'supervisor' and meeting.faculty_id != current_user.id:
            continue
        if current_user.role == 'scholar' and (not current_user.scholar_profile or meeting.scholar_id != current_user.scholar_profile.id):
            continue
        scholar_payload = _build_scholar_payload(meeting.scholar)
        events.append({
            'id': f'meeting-{meeting.id}',
            'type': 'meeting',
            'title': f"Meeting - {scholar_payload['name'] if scholar_payload else 'Scholar'}",
            'start': meeting.meeting_date.isoformat(),
            'status': meeting.status,
            'scholar': scholar_payload,
            'details': {
                'description': meeting.description,
                'faculty': meeting.faculty.name if meeting.faculty else None,
                'notes': meeting.notes,
            },
        })

    # Comprehensive Exams
    comp_exam_query = ComprehensiveExam.query.options(
        joinedload(ComprehensiveExam.school)
    ).filter(
        ComprehensiveExam.exam_date.isnot(None),
        ComprehensiveExam.exam_date.between(start_date.date(), end_date.date())
    )

    # Filter based on user role
    if current_user.role == 'scholar' and current_user.scholar_profile:
        # Scholars see exams they are registered for
        registrations = ComprehensiveExamRegistration.query.filter_by(
            scholar_id=current_user.scholar_profile.id
        ).all()
        registered_exam_ids = [reg.exam_id for reg in registrations]
        if registered_exam_ids:
            comp_exam_query = comp_exam_query.filter(ComprehensiveExam.id.in_(registered_exam_ids))
        else:
            comp_exam_query = comp_exam_query.filter(false())
    elif current_user.role == 'supervisor':
        # Supervisors see exams from schools where they have scholars
        if current_user.supervisor_profile:
            supervised = list(getattr(current_user.supervisor_profile, 'supervised_scholars', []) or [])
            co_supervised = list(getattr(current_user.supervisor_profile, 'co_supervised_scholars', []) or [])
            school_ids = set()
            for scholar in supervised + co_supervised:
                if scholar.school_id:
                    school_ids.add(scholar.school_id)
            if school_ids:
                comp_exam_query = comp_exam_query.filter(ComprehensiveExam.school_id.in_(school_ids))
            else:
                comp_exam_query = comp_exam_query.filter(false())
        else:
            comp_exam_query = comp_exam_query.filter(false())
    elif current_user.role == 'school_chair':
        # School chairs see exams from their school
        schools = School.query.filter_by(chair_id=current_user.id, is_deleted=False).all()
        school_ids = [school.id for school in schools]
        if school_ids:
            comp_exam_query = comp_exam_query.filter(ComprehensiveExam.school_id.in_(school_ids))
        else:
            comp_exam_query = comp_exam_query.filter(false())
    # AD Research and Dean see all exams (no filter needed)

    for comp_exam in comp_exam_query.all():
        exam_time = comp_exam.exam_time or time(hour=10, minute=0)
        exam_dt = datetime.combine(comp_exam.exam_date, exam_time)
        
        # Get school name
        school_name = comp_exam.school.name if comp_exam.school else 'Unknown School'
        
        events.append({
            'id': f'comprehensive-exam-{comp_exam.id}',
            'type': 'exam',
            'title': comp_exam.title,
            'start': exam_dt.isoformat(),
            'venue': comp_exam.venue,
            'status': comp_exam.status,
            'details': {
                'description': comp_exam.description,
                'school': school_name,
                'program': comp_exam.program or 'All Programs',
                'duration_minutes': comp_exam.duration_minutes,
                'instructions': comp_exam.instructions,
                'syllabus': comp_exam.syllabus,
            },
        })

    events = [event for event in events if event.get('start')]
    events.sort(key=lambda e: e.get('start'))

    return jsonify(events), 200
