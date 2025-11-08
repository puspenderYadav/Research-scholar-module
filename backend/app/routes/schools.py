from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.school import School
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from app.utils.decorators import role_required, get_current_user

bp = Blueprint('schools', __name__, url_prefix='/api/schools')


@bp.route('/', methods=['GET'])
@jwt_required()
def get_schools():
    """Get list of all schools"""
    schools = School.query.all()
    return jsonify([s.to_dict() for s in schools]), 200


@bp.route('/my-school', methods=['GET'])
@jwt_required()
@role_required('school_chair')
def get_my_school():
    """Get school chair's school with all faculty and students"""
    current_user = get_current_user()

    # Find the school where current user is chair
    school = School.query.filter_by(chair_id=current_user.id).first()

    if not school:
        return jsonify({'error': 'You are not assigned as chair of any school'}), 404

    # Get basic school info
    school_data = school.to_dict()

    # Get all faculty (supervisors) in this school
    faculty = Supervisor.query.filter_by(school_id=school.id).all()
    school_data['faculty'] = []

    for fac in faculty:
        # Get student count for each faculty
        student_count = Scholar.query.filter_by(
            supervisor_id=fac.id,
            status='active'
        ).count()

        faculty_info = {
            'id': fac.id,
            'employee_id': fac.employee_id,
            'designation': fac.designation,
            'specialization': fac.specialization,
            'is_accepting_students': fac.is_accepting_students,
            'max_phd_scholars': fac.max_phd_scholars,
            'max_msc_scholars': fac.max_msc_scholars,
            'current_student_count': student_count,
            'user': {
                'id': fac.user.id,
                'name': fac.user.name,
                'email': fac.user.email,
                'phone': fac.user.phone
            } if fac.user else None
        }
        school_data['faculty'].append(faculty_info)

    # Get all students in this school
    students = Scholar.query.filter_by(school_id=school.id).all()
    school_data['students'] = []

    for student in students:
        student_info = {
            'id': student.id,
            'enrollment_number': student.enrollment_number,
            'program': student.program,
            'research_area': student.research_area,
            'admission_date': student.admission_date.isoformat() if student.admission_date else None,
            'status': student.status,
            'admission_mode': student.admission_mode,
            'thesis_title': student.thesis_title,
            'supervisor': {
                'id': student.supervisor.id,
                'name': student.supervisor.user.name if student.supervisor and student.supervisor.user else None,
                'designation': student.supervisor.designation if student.supervisor else None
            } if student.supervisor else None,
            'user': {
                'id': student.user.id,
                'name': student.user.name,
                'email': student.user.email,
                'phone': student.user.phone
            } if student.user else None
        }
        school_data['students'].append(student_info)

    # Calculate statistics
    active_students = [s for s in students if s.status == 'active']
    phd_students = [s for s in students if s.program == 'PhD']
    msc_students = [s for s in students if s.program == 'M.Sc. (Research)']

    school_data['statistics'] = {
        'total_faculty': len(faculty),
        'total_students': len(students),
        'active_students': len(active_students),
        'phd_students': len(phd_students),
        'msc_students': len(msc_students),
        'on_leave': len([s for s in students if s.status == 'on_leave']),
        'graduated': len([s for s in students if s.status == 'graduated']),
        'faculty_accepting_students': len([f for f in faculty if f.is_accepting_students])
    }

    return jsonify(school_data), 200


@bp.route('/<int:school_id>', methods=['GET'])
@jwt_required()
def get_school(school_id):
    """Get school details"""
    school = School.query.get_or_404(school_id)
    return jsonify(school.to_dict()), 200
