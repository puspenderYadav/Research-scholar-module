from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.comprehensive_exam import ComprehensiveExam, ComprehensiveExamRegistration
from app.models.scholar import Scholar
from app.models.school import School
from app.models.user import User
from app.utils.decorators import role_required, get_current_user
from app.utils.notification_service import NotificationService
from datetime import datetime, date, time

bp = Blueprint('comprehensive_exams', __name__, url_prefix='/api/comprehensive-exams')


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('school_chair')
def create_exam():
    """Create a comprehensive exam and notify all eligible students (School Chair only)"""
    current_user = get_current_user()
    data = request.get_json()

    # Validate required fields
    required_fields = ['title', 'exam_date', 'exam_time', 'duration_minutes', 'venue']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    try:
        # Parse date and time
        exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
        exam_time = datetime.strptime(data['exam_time'], '%H:%M').time()

        # Create exam
        exam = ComprehensiveExam(
            title=data['title'],
            description=data.get('description'),
            exam_date=exam_date,
            exam_time=exam_time,
            duration_minutes=int(data['duration_minutes']),
            venue=data['venue'],
            program=data.get('program'),  # PhD, MSc, or None for all
            school_id=data.get('school_id'),  # Specific school or None for all
            admission_year=data.get('admission_year'),  # Specific year or None for all
            instructions=data.get('instructions'),
            syllabus=data.get('syllabus'),
            created_by_id=current_user.id,
            status='scheduled'
        )

        db.session.add(exam)
        db.session.flush()

        # Find eligible scholars based on criteria
        query = Scholar.query.filter_by(status='active')

        if exam.program:
            query = query.filter_by(program=exam.program)

        if exam.school_id:
            query = query.filter_by(school_id=exam.school_id)

        if exam.admission_year:
            query = query.filter(
                db.extract('year', Scholar.admission_date) == exam.admission_year
            )

        eligible_scholars = query.all()

        # Auto-register eligible scholars and send notifications
        notification_count = 0
        for scholar in eligible_scholars:
            # Create registration
            registration = ComprehensiveExamRegistration(
                exam_id=exam.id,
                scholar_id=scholar.id,
                attendance_status='registered'
            )
            db.session.add(registration)

            # Send notification
            if scholar.user:
                message = f"You have been scheduled for {exam.title} on {exam.exam_date.strftime('%B %d, %Y')} at {exam.exam_time.strftime('%I:%M %p')}. Venue: {exam.venue}"
                NotificationService.create_notification(
                    user_id=scholar.user.id,
                    title='Comprehensive Exam Scheduled',
                    message=message,
                    notification_type='exam',
                    priority='high',
                    related_entity_type='exam',
                    related_entity_id=exam.id,
                    action_link='/exams',
                    send_email=True
                )
                notification_count += 1

        db.session.commit()

        # Send notification to AD Research and Dean Academics
        # Get AD Research and Dean users
        ad_research_users = User.query.filter_by(role='ad_research').all()
        dean_users = User.query.filter_by(role='dean_academics').all()

        notification_message = f"New comprehensive exam '{exam.title}' has been scheduled by {current_user.name} on {exam.exam_date.strftime('%B %d, %Y')} at {exam.exam_time.strftime('%I:%M %p')}. Venue: {exam.venue}. {notification_count} students have been notified."

        for ad_user in ad_research_users:
            NotificationService.create_notification(
                user_id=ad_user.id,
                title='Comprehensive Exam Scheduled',
                message=notification_message,
                notification_type='exam',
                priority='medium',
                related_entity_type='exam',
                related_entity_id=exam.id,
                action_link='/exams',
                send_email=True
            )

        for dean_user in dean_users:
            NotificationService.create_notification(
                user_id=dean_user.id,
                title='Comprehensive Exam Scheduled',
                message=notification_message,
                notification_type='exam',
                priority='medium',
                related_entity_type='exam',
                related_entity_id=exam.id,
                action_link='/exams',
                send_email=True
            )

        result = exam.to_dict()
        result['notified_students'] = notification_count

        return jsonify({
            'message': f'Comprehensive exam scheduled and {notification_count} students notified',
            'exam': result
        }), 201

    except ValueError as e:
        return jsonify({'error': f'Invalid date/time format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/', methods=['GET'])
@jwt_required()
def get_exams():
    """Get all comprehensive exams (filtered by role)"""
    current_user = get_current_user()

    if current_user.role == 'scholar':
        # Scholars see only their registered exams
        scholar = current_user.scholar_profile
        if not scholar:
            return jsonify({'error': 'Scholar profile not found'}), 404

        registrations = ComprehensiveExamRegistration.query.filter_by(
            scholar_id=scholar.id
        ).all()

        exams = []
        for reg in registrations:
            exam_dict = reg.exam.to_dict()
            exam_dict['registration'] = reg.to_dict()
            exams.append(exam_dict)

        return jsonify(exams), 200
    else:
        # Admin users see all exams
        status = request.args.get('status')
        query = ComprehensiveExam.query

        if status:
            query = query.filter_by(status=status)

        exams = query.order_by(ComprehensiveExam.exam_date.desc()).all()
        return jsonify([exam.to_dict() for exam in exams]), 200


@bp.route('/<int:exam_id>', methods=['GET'])
@jwt_required()
def get_exam(exam_id):
    """Get comprehensive exam details"""
    exam = ComprehensiveExam.query.get_or_404(exam_id)
    exam_dict = exam.to_dict()

    # Include registrations for admin users
    current_user = get_current_user()
    if current_user.role in ['ad_research', 'dean_academics']:
        registrations = ComprehensiveExamRegistration.query.filter_by(exam_id=exam_id).all()
        exam_dict['registrations'] = [reg.to_dict() for reg in registrations]

    return jsonify(exam_dict), 200


@bp.route('/<int:exam_id>', methods=['PUT'])
@jwt_required()
@role_required('school_chair')
def update_exam(exam_id):
    """Update comprehensive exam (School Chair only)"""
    exam = ComprehensiveExam.query.get_or_404(exam_id)
    data = request.get_json()

    try:
        if data.get('title'):
            exam.title = data['title']
        if data.get('description'):
            exam.description = data['description']
        if data.get('exam_date'):
            exam.exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
        if data.get('exam_time'):
            exam.exam_time = datetime.strptime(data['exam_time'], '%H:%M').time()
        if data.get('duration_minutes'):
            exam.duration_minutes = int(data['duration_minutes'])
        if data.get('venue'):
            exam.venue = data['venue']
        if data.get('instructions'):
            exam.instructions = data['instructions']
        if data.get('syllabus'):
            exam.syllabus = data['syllabus']
        if data.get('status'):
            exam.status = data['status']

        exam.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Exam updated successfully',
            'exam': exam.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:exam_id>/registrations/<int:registration_id>/result', methods=['POST'])
@jwt_required()
@role_required('ad_research', 'dean_academics')
def update_result(exam_id, registration_id):
    """Update student result for comprehensive exam"""
    registration = ComprehensiveExamRegistration.query.get_or_404(registration_id)

    if registration.exam_id != exam_id:
        return jsonify({'error': 'Registration does not belong to this exam'}), 400

    data = request.get_json()

    try:
        if 'marks_obtained' in data:
            registration.marks_obtained = float(data['marks_obtained'])
        if 'total_marks' in data:
            registration.total_marks = float(data['total_marks'])
        if 'grade' in data:
            registration.grade = data['grade']
        if 'result' in data:
            registration.result = data['result']
        if 'remarks' in data:
            registration.remarks = data['remarks']
        if 'attendance_status' in data:
            registration.attendance_status = data['attendance_status']

        db.session.commit()

        # Notify student about result
        if registration.scholar and registration.scholar.user and registration.result:
            message = f"Your result for {registration.exam.title} has been published. Result: {registration.result.upper()}"
            if registration.grade:
                message += f", Grade: {registration.grade}"

            NotificationService.create_notification(
                user_id=registration.scholar.user.id,
                title='Comprehensive Exam Result Published',
                message=message,
                notification_type='exam',
                priority='high',
                related_entity_type='exam',
                related_entity_id=exam_id,
                action_link='/exams',
                send_email=True
            )

        return jsonify({
            'message': 'Result updated successfully',
            'registration': registration.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:exam_id>', methods=['DELETE'])
@jwt_required()
@role_required('school_chair')
def delete_exam(exam_id):
    """Delete comprehensive exam (School Chair only)"""
    exam = ComprehensiveExam.query.get_or_404(exam_id)

    try:
        db.session.delete(exam)
        db.session.commit()
        return jsonify({'message': 'Exam deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
