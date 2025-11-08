from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required
from app import db
from app.models.school import School
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from app.models.synopsis import Synopsis
from app.models.progress_report import ProgressReport
from app.models.thesis import Thesis
from app.models.travel_grant import TravelGrant, TravelGrantApproval
from app.models.exam import Exam
from app.models.seminar import Seminar
from app.models.supervisor_change_request import SupervisorChangeRequest
from app.models.committee import Committee, CommitteeMember
from app.models.user import User
from app.models.announcement import Announcement
from app.models.notification import Notification
from app.utils.decorators import role_required, get_current_user
from app.utils.enrollment_generator import EnrollmentGenerator
from app.utils.email_service import EmailService
from sqlalchemy import func, desc
from datetime import datetime, timedelta, date
import csv
import io
import secrets
import string
import os
from werkzeug.utils import secure_filename

bp = Blueprint('dean', __name__, url_prefix='/api/dean')


@bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def get_dashboard():
    """Get comprehensive dean academics dashboard with complete institutional overview"""
    current_user = get_current_user()

    # Get all schools
    schools = School.query.all()
    schools_data = []

    for school in schools:
        faculty_count = Supervisor.query.filter_by(school_id=school.id).count()
        student_count = Scholar.query.filter_by(school_id=school.id).count()
        active_students = Scholar.query.filter_by(school_id=school.id, status='active').count()

        school_info = {
            'id': school.id,
            'name': school.name,
            'code': school.code,
            'chair': school.chair.to_dict() if school.chair else None,
            'faculty_count': faculty_count,
            'student_count': student_count,
            'active_students': active_students,
            'phd_students': Scholar.query.filter_by(school_id=school.id, program='PhD').count(),
            'msc_students': Scholar.query.filter_by(school_id=school.id, program='M.Sc. (Research)').count()
        }
        schools_data.append(school_info)

    # Get comprehensive student statistics
    all_students = Scholar.query.all()
    students_by_status = {
        'active': len([s for s in all_students if s.status == 'active']),
        'on_leave': len([s for s in all_students if s.status == 'on_leave']),
        'graduated': len([s for s in all_students if s.status == 'graduated']),
        'withdrawn': len([s for s in all_students if s.status == 'withdrawn'])
    }

    students_by_program = {
        'phd': len([s for s in all_students if s.program == 'PhD']),
        'msc': len([s for s in all_students if s.program in ['MSc', 'M.Sc.', 'M.Sc. (Research)']])
    }

    # Admission mode stats - field doesn't exist yet, set to 0
    students_by_admission = {
        'regular': 0,
        'sponsored': 0,
        'external': 0
    }

    # Get faculty statistics
    all_faculty = Supervisor.query.all()
    faculty_stats = {
        'total': len(all_faculty),
        'accepting_students': len([f for f in all_faculty if f.is_accepting_students]),
        'not_accepting': len([f for f in all_faculty if not f.is_accepting_students]),
        'total_capacity_phd': sum(f.max_phd_scholars for f in all_faculty),
        'total_capacity_msc': sum(f.max_msc_scholars for f in all_faculty)
    }

    # Get all pending items for dean review
    pending_supervisor_changes = SupervisorChangeRequest.query.filter_by(
        dean_status='pending',
        current_supervisor_status='approved',
        new_supervisor_status='approved'
    ).count()

    pending_synopsis = Synopsis.query.filter_by(status='pending').count()
    pending_progress = ProgressReport.query.filter_by(status='pending').count()
    pending_thesis = Thesis.query.filter_by(status='pending').count()
    pending_travel = TravelGrant.query.filter_by(status='pending').count()

    # Get recent activities (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    recent_admissions = Scholar.query.filter(
        Scholar.admission_date >= thirty_days_ago.date()
    ).count()

    recent_graduations = Scholar.query.filter(
        Scholar.status == 'graduated',
        Scholar.updated_at >= thirty_days_ago
    ).count()

    # Get upcoming events
    upcoming_exams = Exam.query.filter(
        Exam.scheduled_date >= func.current_date()
    ).order_by(Exam.scheduled_date).limit(10).all()

    upcoming_seminars = Seminar.query.filter(
        Seminar.scheduled_date >= func.current_date()
    ).order_by(Seminar.scheduled_date).limit(10).all()

    # Get committees statistics
    total_committees = Committee.query.count()

    # Get approval statistics
    approved_synopsis = Synopsis.query.filter_by(status='approved').count()
    approved_progress = ProgressReport.query.filter_by(status='approved').count()
    approved_thesis = Thesis.query.filter_by(status='approved').count()
    approved_travel = TravelGrant.query.filter_by(status='approved').count()

    # Compile comprehensive statistics
    statistics = {
        'overview': {
            'total_schools': len(schools),
            'total_students': len(all_students),
            'total_faculty': len(all_faculty),
            'total_committees': total_committees
        },
        'students': {
            'total': len(all_students),
            'by_status': students_by_status,
            'by_program': students_by_program,
            'by_admission_mode': students_by_admission
        },
        'faculty': faculty_stats,
        'pending_approvals': {
            'supervisor_changes': pending_supervisor_changes,
            'synopsis': pending_synopsis,
            'progress_reports': pending_progress,
            'thesis': pending_thesis,
            'travel_grants': pending_travel,
            'total': pending_supervisor_changes + pending_synopsis + pending_progress + pending_thesis + pending_travel
        },
        'approved_items': {
            'synopsis': approved_synopsis,
            'progress_reports': approved_progress,
            'thesis': approved_thesis,
            'travel_grants': approved_travel
        },
        'recent_activity': {
            'new_admissions': recent_admissions,
            'graduations': recent_graduations
        },
        'upcoming': {
            'exams': [
                {
                    'id': exam.id,
                    'exam_type': exam.exam_type,
                    'scheduled_date': exam.scheduled_date.isoformat() if exam.scheduled_date else None,
                    'status': exam.status,
                    'scholar': {
                        'enrollment_number': exam.scholar.enrollment_number,
                        'name': exam.scholar.user.name if exam.scholar.user else None
                    } if exam.scholar else None
                } for exam in upcoming_exams
            ],
            'seminars': [
                {
                    'id': seminar.id,
                    'seminar_type': seminar.seminar_type,
                    'scheduled_date': seminar.scheduled_date.isoformat() if seminar.scheduled_date else None,
                    'title': seminar.title,
                    'scholar': {
                        'enrollment_number': seminar.scholar.enrollment_number,
                        'name': seminar.scholar.user.name if seminar.scholar.user else None
                    } if seminar.scholar else None
                } for seminar in upcoming_seminars
            ]
        }
    }

    dashboard_data = {
        'statistics': statistics,
        'schools': schools_data
    }

    return jsonify(dashboard_data), 200


@bp.route('/pending-approvals', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def get_pending_approvals():
    """Get all items pending dean's approval"""

    # Supervisor change requests
    supervisor_changes = SupervisorChangeRequest.query.filter_by(
        dean_status='pending',
        current_supervisor_status='approved',
        new_supervisor_status='approved'
    ).all()

    changes_data = [
        {
            'id': c.id,
            'type': 'supervisor_change',
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'reason': c.reason,
            'scholar': {
                'id': c.scholar.id,
                'enrollment_number': c.scholar.enrollment_number,
                'name': c.scholar.user.name if c.scholar.user else None
            } if c.scholar else None,
            'current_supervisor': {
                'id': c.current_supervisor.id,
                'name': c.current_supervisor.user.name if c.current_supervisor.user else None,
                'comment': c.current_supervisor_comment
            } if c.current_supervisor else None,
            'new_supervisor': {
                'id': c.new_supervisor.id,
                'name': c.new_supervisor.user.name if c.new_supervisor.user else None,
                'comment': c.new_supervisor_comment
            } if c.new_supervisor else None
        } for c in supervisor_changes
    ]

    # Synopsis pending approval
    synopsis_pending = Synopsis.query.filter_by(status='pending').all()
    synopsis_data = [
        {
            'id': s.id,
            'type': 'synopsis',
            'title': s.title,
            'submitted_date': s.submitted_date.isoformat() if s.submitted_date else None,
            'scholar': {
                'enrollment_number': s.scholar.enrollment_number,
                'name': s.scholar.user.name if s.scholar.user else None,
                'program': s.scholar.program
            } if s.scholar else None,
            'supervisor_comment': s.supervisor_comment
        } for s in synopsis_pending
    ]

    # Progress reports pending
    progress_pending = ProgressReport.query.filter_by(status='pending').all()
    progress_data = [
        {
            'id': r.id,
            'type': 'progress_report',
            'report_period': r.report_period,
            'submitted_date': r.submitted_date.isoformat() if r.submitted_date else None,
            'scholar': {
                'enrollment_number': r.scholar.enrollment_number,
                'name': r.scholar.user.name if r.scholar.user else None
            } if r.scholar else None
        } for r in progress_pending
    ]

    # Thesis pending
    thesis_pending = Thesis.query.filter_by(status='pending').all()
    thesis_data = [
        {
            'id': t.id,
            'type': 'thesis',
            'title': t.title,
            'submitted_date': t.submitted_date.isoformat() if t.submitted_date else None,
            'defense_date': t.defense_date.isoformat() if t.defense_date else None,
            'scholar': {
                'enrollment_number': t.scholar.enrollment_number,
                'name': t.scholar.user.name if t.scholar.user else None
            } if t.scholar else None
        } for t in thesis_pending
    ]

    # Travel grants pending
    travel_pending = TravelGrant.query.filter_by(status='pending').all()
    travel_data = [
        {
            'id': g.id,
            'type': 'travel_grant',
            'conference_name': g.conference_name,
            'location': g.location,
            'start_date': g.start_date.isoformat() if g.start_date else None,
            'end_date': g.end_date.isoformat() if g.end_date else None,
            'requested_amount': float(g.requested_amount) if g.requested_amount else 0,
            'scholar': {
                'enrollment_number': g.scholar.enrollment_number,
                'name': g.scholar.user.name if g.scholar.user else None
            } if g.scholar else None
        } for g in travel_pending
    ]

    all_pending = {
        'supervisor_changes': changes_data,
        'synopsis': synopsis_data,
        'progress_reports': progress_data,
        'thesis': thesis_data,
        'travel_grants': travel_data,
        'total_count': len(changes_data) + len(synopsis_data) + len(progress_data) + len(thesis_data) + len(travel_data)
    }

    return jsonify(all_pending), 200


@bp.route('/all-scholars', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def get_all_scholars():
    """Get all scholars with complete details"""
    scholars = Scholar.query.all()

    scholars_data = [
        {
            'id': s.id,
            'enrollment_number': s.enrollment_number,
            'program': s.program,
            'research_area': s.research_area,
            'admission_date': s.admission_date.isoformat() if s.admission_date else None,
            'status': s.status,
            'admission_mode': None,  # Field doesn't exist yet
            'thesis_title': s.thesis_title,
            'school': {
                'id': s.school.id,
                'name': s.school.name,
                'code': s.school.code
            } if s.school else None,
            'supervisor': {
                'id': s.supervisor.id,
                'name': s.supervisor.user.name if s.supervisor.user else None,
                'designation': s.supervisor.designation
            } if s.supervisor else None,
            'user': {
                'id': s.user.id,
                'name': s.user.name,
                'email': s.user.email,
                'phone': s.user.phone
            } if s.user else None
        } for s in scholars
    ]

    return jsonify(scholars_data), 200


@bp.route('/all-faculty', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def get_all_faculty():
    """Get all faculty with complete details"""
    faculty = Supervisor.query.all()

    faculty_data = [
        {
            'id': f.id,
            'employee_id': f.employee_id,
            'designation': f.designation,
            'specialization': f.specialization,
            'is_accepting_students': f.is_accepting_students,
            'max_phd_scholars': f.max_phd_scholars,
            'max_msc_scholars': f.max_msc_scholars,
            'current_students': Scholar.query.filter_by(supervisor_id=f.id, status='active').count(),
            'school': {
                'id': f.school.id,
                'name': f.school.name,
                'code': f.school.code
            } if f.school else None,
            'user': {
                'id': f.user.id,
                'name': f.user.name,
                'email': f.user.email,
                'phone': f.user.phone
            } if f.user else None
        } for f in faculty
    ]

    return jsonify(faculty_data), 200


def generate_random_password(length=12):
    """Generate a secure random password"""
    characters = string.ascii_letters + string.digits + string.punctuation
    # Ensure at least one of each type
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(string.punctuation)
    ]
    # Fill the rest randomly
    password += [secrets.choice(characters) for _ in range(length - 4)]
    # Shuffle to avoid predictable patterns
    secrets.SystemRandom().shuffle(password)
    return ''.join(password)


@bp.route('/bulk-upload-scholars', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def bulk_upload_scholars():
    """
    Bulk upload scholars from CSV file

    CSV Format:
    name,personal_email,phone,program,school_code,supervisor_employee_id,co_supervisor_employee_id,admission_date,research_area,thesis_title

    Example:
    John Doe,john.personal@gmail.com,9876543210,PhD,CS,FAC001,,2025-01-15,Machine Learning,Deep Learning Research

    Note:
    - personal_email is where credentials will be sent (NOT the login email)
    - Institute email (username) will be auto-generated as: {enrollment_number}@students.uni.edu
    - Students login with their institute email, not personal email
    """
    current_user = get_current_user()

    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a CSV'}), 400

    try:
        # Read CSV file
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_reader = csv.DictReader(stream)

        # Validate CSV headers
        required_headers = ['name', 'personal_email', 'phone', 'program', 'school_code',
                          'supervisor_employee_id', 'admission_date']
        optional_headers = ['co_supervisor_employee_id', 'research_area', 'thesis_title', 'expected_completion_date']

        if not all(header in csv_reader.fieldnames for header in required_headers):
            missing = [h for h in required_headers if h not in csv_reader.fieldnames]
            return jsonify({'error': f'Missing required columns: {", ".join(missing)}'}), 400

        # Process scholars
        successful_uploads = []
        failed_uploads = []
        row_number = 1

        for row in csv_reader:
            row_number += 1
            try:
                # Validate and extract data
                name = row.get('name', '').strip()
                personal_email = row.get('personal_email', '').strip()
                phone = row.get('phone', '').strip()
                program = row.get('program', '').strip()
                school_code = row.get('school_code', '').strip()
                supervisor_emp_id = row.get('supervisor_employee_id', '').strip()
                co_supervisor_emp_id = row.get('co_supervisor_employee_id', '').strip()
                admission_date_str = row.get('admission_date', '').strip()
                research_area = row.get('research_area', '').strip()
                thesis_title = row.get('thesis_title', '').strip()
                expected_completion_str = row.get('expected_completion_date', '').strip()

                # Validate required fields
                if not all([name, personal_email, program, school_code, admission_date_str]):
                    failed_uploads.append({
                        'row': row_number,
                        'name': name,
                        'error': 'Missing required fields'
                    })
                    continue

                # Validate program
                if program.upper() not in ['PHD', 'PH.D.', 'MSC', 'M.SC.', 'MSCRESEARCH', 'M.SC. (RESEARCH)']:
                    failed_uploads.append({
                        'row': row_number,
                        'name': name,
                        'error': f'Invalid program: {program}. Must be PhD or MSc'
                    })
                    continue

                # Normalize program name
                if program.upper() in ['PHD', 'PH.D.']:
                    program = 'PhD'
                else:
                    program = 'MSc'

                # Parse admission date
                try:
                    admission_date = datetime.strptime(admission_date_str, '%Y-%m-%d').date()
                except ValueError:
                    failed_uploads.append({
                        'row': row_number,
                        'name': name,
                        'error': f'Invalid date format: {admission_date_str}. Use YYYY-MM-DD'
                    })
                    continue

                # Parse expected completion date if provided
                expected_completion_date = None
                if expected_completion_str:
                    try:
                        expected_completion_date = datetime.strptime(expected_completion_str, '%Y-%m-%d').date()
                    except ValueError:
                        # If invalid, calculate default
                        pass

                # Calculate default expected completion if not provided
                if not expected_completion_date:
                    years_to_add = 5 if program == 'PhD' else 2
                    expected_completion_date = date(
                        admission_date.year + years_to_add,
                        admission_date.month,
                        admission_date.day
                    )

                # Find school
                school = School.query.filter_by(code=school_code).first()
                if not school:
                    failed_uploads.append({
                        'row': row_number,
                        'name': name,
                        'error': f'School not found: {school_code}'
                    })
                    continue

                # Find supervisor
                supervisor = None
                if supervisor_emp_id:
                    supervisor = Supervisor.query.filter_by(employee_id=supervisor_emp_id).first()
                    if not supervisor:
                        failed_uploads.append({
                            'row': row_number,
                            'name': name,
                            'error': f'Supervisor not found: {supervisor_emp_id}'
                        })
                        continue

                # Find co-supervisor (optional)
                co_supervisor = None
                if co_supervisor_emp_id:
                    co_supervisor = Supervisor.query.filter_by(employee_id=co_supervisor_emp_id).first()

                # Generate enrollment number
                enrollment_number = EnrollmentGenerator.generate_enrollment_number(
                    program, admission_date.year
                )

                # Check if enrollment number already exists (shouldn't happen, but double-check)
                existing_scholar = Scholar.query.filter_by(enrollment_number=enrollment_number).first()
                if existing_scholar:
                    # Try generating again with a retry
                    failed_uploads.append({
                        'row': row_number,
                        'name': name,
                        'error': f'Enrollment number conflict: {enrollment_number}'
                    })
                    continue

                # Generate institute email from enrollment number
                from flask import current_app
                institute_email = f"{enrollment_number}@{current_app.config['STUDENT_EMAIL_DOMAIN']}"

                # Check if institute email already exists
                existing_user = User.query.filter_by(email=institute_email).first()
                if existing_user:
                    failed_uploads.append({
                        'row': row_number,
                        'name': name,
                        'error': f'Institute email already exists: {institute_email}'
                    })
                    continue

                # Generate password
                password = generate_random_password()

                # Create user account with institute email
                user = User(
                    email=institute_email,
                    name=name,
                    phone=phone,
                    role='scholar',
                    is_active=True
                )
                user.set_password(password)
                db.session.add(user)
                db.session.flush()

                # Create scholar profile with personal email
                scholar = Scholar(
                    user_id=user.id,
                    enrollment_number=enrollment_number,
                    program=program,
                    school_id=school.id,
                    admission_date=admission_date,
                    expected_completion_date=expected_completion_date,
                    personal_email=personal_email,
                    supervisor_id=supervisor.id if supervisor else None,
                    co_supervisor_id=co_supervisor.id if co_supervisor else None,
                    research_area=research_area if research_area else None,
                    thesis_title=thesis_title if thesis_title else None,
                    status='active'
                )
                db.session.add(scholar)
                db.session.flush()

                # Send credentials email
                try:
                    email_sent = EmailService.send_scholar_credentials_email(
                        scholar=scholar,
                        personal_email=personal_email,
                        username=institute_email,
                        password=password,
                        enrollment_number=enrollment_number
                    )
                except Exception as email_error:
                    print(f"Failed to send email to {personal_email}: {email_error}")
                    email_sent = False

                successful_uploads.append({
                    'row': row_number,
                    'name': name,
                    'enrollment_number': enrollment_number,
                    'institute_email': institute_email,
                    'personal_email': personal_email,
                    'program': program,
                    'school': school.name,
                    'supervisor': supervisor.user.name if supervisor else 'Not Assigned',
                    'email_sent': email_sent
                })

            except Exception as e:
                failed_uploads.append({
                    'row': row_number,
                    'name': row.get('name', 'Unknown'),
                    'error': str(e)
                })
                continue

        # Commit all successful additions
        if successful_uploads:
            db.session.commit()
        else:
            db.session.rollback()

        result = {
            'success': True,
            'message': f'Processed {len(successful_uploads) + len(failed_uploads)} rows',
            'successful_count': len(successful_uploads),
            'failed_count': len(failed_uploads),
            'successful_uploads': successful_uploads,
            'failed_uploads': failed_uploads
        }

        return jsonify(result), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error processing CSV: {str(e)}'}), 500


@bp.route('/download-sample-csv', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def download_sample_csv():
    """Download a sample CSV template for bulk upload"""

    sample_data = [
        {
            'name': 'John Doe',
            'personal_email': 'john.doe@email.com',
            'phone': '9876543210',
            'program': 'PhD',
            'school_code': 'CS',
            'supervisor_employee_id': 'FAC001',
            'co_supervisor_employee_id': '',
            'admission_date': '2025-01-15',
            'research_area': 'Machine Learning',
            'thesis_title': 'Deep Learning for Computer Vision',
            'expected_completion_date': '2030-01-15'
        },
        {
            'name': 'Jane Smith',
            'personal_email': 'jane.smith@email.com',
            'phone': '9876543211',
            'program': 'MSc',
            'school_code': 'ENG',
            'supervisor_employee_id': 'FAC002',
            'co_supervisor_employee_id': 'FAC001',
            'admission_date': '2025-01-15',
            'research_area': 'Robotics',
            'thesis_title': 'Autonomous Navigation Systems',
            'expected_completion_date': '2027-01-15'
        }
    ]

    # Create CSV in memory
    output = io.StringIO()
    if sample_data:
        writer = csv.DictWriter(output, fieldnames=sample_data[0].keys())
        writer.writeheader()
        writer.writerows(sample_data)

    # Prepare response
    from flask import Response
    response = Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': 'attachment; filename=scholars_upload_template.csv'
        }
    )

    return response


@bp.route('/suspend-scholar/<int:scholar_id>', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def suspend_scholar(scholar_id):
    """
    Suspend a scholar for a specific time period

    Request JSON:
    {
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "reason": "Reason for suspension"
    }
    """
    current_user = get_current_user()
    data = request.get_json()

    # Validate required fields
    if not all([data.get('start_date'), data.get('end_date'), data.get('reason')]):
        return jsonify({'error': 'Start date, end date, and reason are required'}), 400

    # Find scholar
    scholar = Scholar.query.get(scholar_id)
    if not scholar:
        return jsonify({'error': 'Scholar not found'}), 404

    # Check if already rusticated
    if scholar.is_rusticated:
        return jsonify({'error': 'Cannot suspend a rusticated scholar'}), 400

    # Parse dates
    try:
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Validate dates
    if end_date <= start_date:
        return jsonify({'error': 'End date must be after start date'}), 400

    if start_date < date.today():
        return jsonify({'error': 'Start date cannot be in the past'}), 400

    # Update scholar
    scholar.status = 'suspended'
    scholar.suspension_start_date = start_date
    scholar.suspension_end_date = end_date
    scholar.suspension_reason = data['reason']

    # Disable user account
    scholar.user.is_active = False

    db.session.commit()

    # Send notification email
    try:
        EmailService.send_suspension_email(scholar, start_date, end_date, data['reason'])
    except Exception as e:
        print(f"Failed to send suspension email: {e}")

    return jsonify({
        'success': True,
        'message': f'Scholar {scholar.enrollment_number} has been suspended',
        'scholar': scholar.to_dict(include_relations=True)
    }), 200


@bp.route('/rusticate-scholar/<int:scholar_id>', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def rusticate_scholar(scholar_id):
    """
    Rusticate a scholar (permanent expulsion)

    Request JSON:
    {
        "reason": "Reason for rustication"
    }
    """
    current_user = get_current_user()
    data = request.get_json()

    # Validate required fields
    if not data.get('reason'):
        return jsonify({'error': 'Reason is required'}), 400

    # Find scholar
    scholar = Scholar.query.get(scholar_id)
    if not scholar:
        return jsonify({'error': 'Scholar not found'}), 404

    # Update scholar
    scholar.status = 'rusticated'
    scholar.is_rusticated = True
    scholar.rustication_date = date.today()
    scholar.rustication_reason = data['reason']

    # Clear suspension if any
    scholar.suspension_start_date = None
    scholar.suspension_end_date = None
    scholar.suspension_reason = None

    # Permanently disable user account
    scholar.user.is_active = False

    db.session.commit()

    # Send notification email
    try:
        EmailService.send_rustication_email(scholar, data['reason'])
    except Exception as e:
        print(f"Failed to send rustication email: {e}")

    return jsonify({
        'success': True,
        'message': f'Scholar {scholar.enrollment_number} has been rusticated',
        'scholar': scholar.to_dict(include_relations=True)
    }), 200


@bp.route('/reactivate-scholar/<int:scholar_id>', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def reactivate_scholar(scholar_id):
    """
    Reactivate a suspended scholar
    Cannot reactivate rusticated scholars
    """
    current_user = get_current_user()

    # Find scholar
    scholar = Scholar.query.get(scholar_id)
    if not scholar:
        return jsonify({'error': 'Scholar not found'}), 404

    # Check if rusticated
    if scholar.is_rusticated:
        return jsonify({'error': 'Cannot reactivate a rusticated scholar'}), 400

    # Update scholar
    scholar.status = 'active'
    scholar.suspension_start_date = None
    scholar.suspension_end_date = None
    scholar.suspension_reason = None

    # Reactivate user account
    scholar.user.is_active = True

    db.session.commit()

    # Send notification email
    try:
        EmailService.send_reactivation_email(scholar)
    except Exception as e:
        print(f"Failed to send reactivation email: {e}")

    return jsonify({
        'success': True,
        'message': f'Scholar {scholar.enrollment_number} has been reactivated',
        'scholar': scholar.to_dict(include_relations=True)
    }), 200


@bp.route('/recruit-faculty', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def recruit_faculty():
    """Recruit a new faculty member and create their profile"""
    current_user = get_current_user()
    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'email', 'personal_email', 'employee_id', 'designation', 'school_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Validate school exists
    school = School.query.get(data['school_id'])
    if not school:
        return jsonify({'error': 'School not found'}), 404

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User with this email already exists'}), 400

    # Check if employee_id already exists
    if Supervisor.query.filter_by(employee_id=data['employee_id']).first():
        return jsonify({'error': 'Faculty with this employee ID already exists'}), 400

    try:
        # Generate temporary password
        temporary_password = secrets.token_urlsafe(12)

        # Create user account
        user = User(
            email=data['email'],
            name=data['name'],
            phone=data.get('phone'),
            role='supervisor',
            is_active=True
        )
        user.set_password(temporary_password)

        db.session.add(user)
        db.session.flush()  # Get user.id

        # Create supervisor profile
        supervisor = Supervisor(
            user_id=user.id,
            employee_id=data['employee_id'],
            designation=data['designation'],
            school_id=data['school_id'],
            specialization=data.get('specialization', ''),
            max_phd_scholars=data.get('max_phd_scholars', 8),
            max_msc_scholars=data.get('max_msc_scholars', 5),
            is_accepting_students=data.get('is_accepting_students', True)
        )

        db.session.add(supervisor)
        db.session.commit()

        # Send credentials email to personal email
        try:
            EmailService.send_faculty_credentials_email(
                faculty_name=data['name'],
                personal_email=data['personal_email'],
                institute_email=data['email'],
                password=temporary_password,
                employee_id=data['employee_id'],
                designation=data['designation'],
                school_name=school.name
            )
        except Exception as email_error:
            print(f"Failed to send email: {email_error}")

        return jsonify({
            'message': 'Faculty recruited successfully. Credentials sent to personal email.',
            'user': user.to_dict(),
            'supervisor': supervisor.to_dict(),
            'temporary_password': temporary_password  # In production, don't return this
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating faculty: {str(e)}'}), 500


@bp.route('/create-school', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def create_school():
    """Create a new school/department"""
    current_user = get_current_user()
    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'code']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Check if school code already exists
    if School.query.filter_by(code=data['code'].upper()).first():
        return jsonify({'error': 'School with this code already exists'}), 400

    # Check if school name already exists
    if School.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'School with this name already exists'}), 400

    try:
        # Create school
        school = School(
            name=data['name'],
            code=data['code'].upper(),
            chair_id=data.get('chair_id')  # Optional: can assign chair later
        )

        db.session.add(school)
        db.session.commit()

        return jsonify({
            'message': 'School created successfully',
            'school': school.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating school: {str(e)}'}), 500


@bp.route('/schools', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def get_all_schools():
    """Get all schools with faculty and student counts"""
    schools = School.query.all()

    schools_data = []
    for school in schools:
        faculty_count = Supervisor.query.filter_by(school_id=school.id).count()
        student_count = Scholar.query.filter_by(school_id=school.id).count()

        school_info = school.to_dict()
        school_info['faculty_count'] = faculty_count
        school_info['student_count'] = student_count
        schools_data.append(school_info)

    return jsonify({'schools': schools_data}), 200


# Announcement Endpoints

UPLOAD_FOLDER = 'uploads/announcements'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('/announcements', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def create_announcement():
    """Create a new announcement"""
    current_user = get_current_user()

    # Handle multipart/form-data
    data = request.form.to_dict()

    # Validate required fields
    required_fields = ['title', 'message', 'target_audience', 'scheduled_time']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Parse target audience (should be JSON string)
    import json
    try:
        target_audience = json.loads(data['target_audience'])
        if not isinstance(target_audience, list):
            return jsonify({'error': 'target_audience must be an array'}), 400
    except:
        return jsonify({'error': 'Invalid target_audience format'}), 400

    # Parse scheduled_time
    try:
        scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
    except:
        return jsonify({'error': 'Invalid scheduled_time format. Use ISO format'}), 400

    # Handle file upload
    attachment_url = None
    attachment_filename = None

    if 'attachment' in request.files:
        file = request.files['attachment']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to make filename unique
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"

            # Create upload directory if it doesn't exist
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)

            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(filepath)

            attachment_url = f'/api/dean/announcements/attachments/{unique_filename}'
            attachment_filename = filename

    try:
        # Create announcement
        announcement = Announcement(
            title=data['title'],
            message=data['message'],
            target_audience=target_audience,
            scheduled_time=scheduled_time,
            attachment_url=attachment_url,
            attachment_filename=attachment_filename,
            created_by_id=current_user.id,
            is_published=False
        )

        db.session.add(announcement)
        db.session.commit()

        # If scheduled time is now or past, publish immediately and create notifications
        if scheduled_time <= datetime.utcnow():
            publish_announcement(announcement.id)

        return jsonify({
            'message': 'Announcement created successfully',
            'announcement': announcement.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating announcement: {str(e)}'}), 500


@bp.route('/announcements', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def get_announcements():
    """Get all announcements"""
    announcements = Announcement.query.order_by(desc(Announcement.created_at)).all()

    return jsonify({
        'announcements': [a.to_dict() for a in announcements]
    }), 200


@bp.route('/announcements/<int:id>', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def get_announcement(id):
    """Get a specific announcement"""
    announcement = Announcement.query.get(id)

    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404

    return jsonify({'announcement': announcement.to_dict()}), 200


@bp.route('/announcements/<int:id>', methods=['PUT'])
@jwt_required()
@role_required('dean_academics')
def update_announcement(id):
    """Update an announcement"""
    announcement = Announcement.query.get(id)

    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404

    # Don't allow editing published announcements
    if announcement.is_published:
        return jsonify({'error': 'Cannot edit published announcements'}), 400

    data = request.get_json()

    if 'title' in data:
        announcement.title = data['title']
    if 'message' in data:
        announcement.message = data['message']
    if 'target_audience' in data:
        announcement.target_audience = data['target_audience']
    if 'scheduled_time' in data:
        try:
            announcement.scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid scheduled_time format'}), 400

    try:
        db.session.commit()
        return jsonify({
            'message': 'Announcement updated successfully',
            'announcement': announcement.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating announcement: {str(e)}'}), 500


@bp.route('/announcements/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required('dean_academics')
def delete_announcement(id):
    """Delete an announcement"""
    current_user = get_current_user()
    announcement = Announcement.query.get(id)

    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404

    # Check ownership - users can only delete their own announcements
    if announcement.created_by_id != current_user.id:
        return jsonify({'error': 'You can only delete announcements you created'}), 403

    try:
        # Delete attachment file if exists
        if announcement.attachment_url:
            filename = announcement.attachment_url.split('/')[-1]
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(filepath):
                os.remove(filepath)

        db.session.delete(announcement)
        db.session.commit()

        return jsonify({'message': 'Announcement deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting announcement: {str(e)}'}), 500


@bp.route('/announcements/<int:id>/publish', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def publish_announcement_route(id):
    """Manually publish an announcement"""
    announcement = Announcement.query.get(id)

    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404

    if announcement.is_published:
        return jsonify({'error': 'Announcement already published'}), 400

    try:
        publish_announcement(id)
        return jsonify({'message': 'Announcement published successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Error publishing announcement: {str(e)}'}), 500


@bp.route('/announcements/attachments/<filename>', methods=['GET'])
@jwt_required()
def get_announcement_attachment(filename):
    """Download announcement attachment"""
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    return send_file(filepath, as_attachment=True)


def publish_announcement(announcement_id):
    """Publish announcement and create notifications for target audience"""
    announcement = Announcement.query.get(announcement_id)

    if not announcement or announcement.is_published:
        return

    # Mark as published
    announcement.is_published = True
    announcement.published_at = datetime.utcnow()

    # Get target users based on audience
    target_users = []

    if 'all' in announcement.target_audience:
        target_users = User.query.filter_by(is_active=True).all()
    else:
        for role in announcement.target_audience:
            users = User.query.filter_by(role=role, is_active=True).all()
            target_users.extend(users)

    # Remove duplicates
    target_users = list(set(target_users))

    # Create notifications for each target user
    for user in target_users:
        notification = Notification(
            user_id=user.id,
            title=announcement.title,
            message=announcement.message,
            type='announcement',
            is_read=False
        )
        db.session.add(notification)

    db.session.commit()


@bp.route('/export-scholars', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def export_scholars():
    """Export all scholars data to CSV with comprehensive information"""
    scholars = Scholar.query.all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write comprehensive headers
    headers = [
        'Enrollment Number', 'Name', 'Institute Email', 'Personal Email', 'Phone',
        'Program', 'School', 'School Code', 'Admission Date', 'Expected Completion Date',
        'Research Area', 'Thesis Title', 'Status',
        'Supervisor Name', 'Supervisor Email', 'Supervisor Designation',
        'Co-Supervisor Name', 'Co-Supervisor Email', 'Co-Supervisor Designation',
        'Account Status', 'Account Created Date',
        'Suspension Start Date', 'Suspension End Date', 'Suspension Reason',
        'Is Rusticated', 'Rustication Date', 'Rustication Reason',
        'Total Exams', 'Total Seminars', 'Total Progress Reports', 'Total Travel Grants',
        'Committee Members Count', 'Synopsis Submitted', 'Thesis Submitted'
    ]
    writer.writerow(headers)

    # Write scholar data
    for s in scholars:
        row = [
            # Basic Information
            s.enrollment_number or '',
            s.user.name if s.user else '',
            s.user.email if s.user else '',
            s.personal_email or '',
            s.user.phone if s.user else '',

            # Academic Information
            s.program or '',
            s.school.name if s.school else '',
            s.school.code if s.school else '',
            s.admission_date.strftime('%Y-%m-%d') if s.admission_date else '',
            s.expected_completion_date.strftime('%Y-%m-%d') if s.expected_completion_date else '',
            s.research_area or '',
            s.thesis_title or '',
            s.status or '',

            # Supervisor Information
            s.supervisor.user.name if s.supervisor and s.supervisor.user else '',
            s.supervisor.user.email if s.supervisor and s.supervisor.user else '',
            s.supervisor.designation if s.supervisor else '',

            # Co-Supervisor Information
            s.co_supervisor.user.name if s.co_supervisor and s.co_supervisor.user else '',
            s.co_supervisor.user.email if s.co_supervisor and s.co_supervisor.user else '',
            s.co_supervisor.designation if s.co_supervisor else '',

            # Account Status
            'Active' if s.user and s.user.is_active else 'Inactive',
            s.created_at.strftime('%Y-%m-%d %H:%M:%S') if s.created_at else '',

            # Suspension/Rustication Information
            s.suspension_start_date.strftime('%Y-%m-%d') if s.suspension_start_date else '',
            s.suspension_end_date.strftime('%Y-%m-%d') if s.suspension_end_date else '',
            s.suspension_reason or '',
            'Yes' if s.is_rusticated else 'No',
            s.rustication_date.strftime('%Y-%m-%d') if s.rustication_date else '',
            s.rustication_reason or '',

            # Academic Activity Counts
            s.exams.count() if s.exams else 0,
            s.seminars.count() if s.seminars else 0,
            s.progress_reports.count() if s.progress_reports else 0,
            s.travel_grants.count() if s.travel_grants else 0,

            # Committee and Submissions
            len(s.committee.members) if s.committee and hasattr(s.committee, 'members') else 0,
            'Yes' if s.synopsis_reports.count() > 0 else 'No',
            'Yes' if s.thesis_submissions.count() > 0 else 'No',
        ]
        writer.writerow(row)

    # Prepare the CSV file for download
    output.seek(0)

    # Create a BytesIO object for send_file
    mem = io.BytesIO()
    mem.write(output.getvalue().encode('utf-8'))
    mem.seek(0)

    filename = f'scholars_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

    return send_file(
        mem,
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )
