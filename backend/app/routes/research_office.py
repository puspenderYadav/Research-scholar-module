from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.school import School
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from app.models.synopsis import Synopsis
from app.models.progress_report import ProgressReport
from app.models.thesis import Thesis
from app.models.travel_grant import TravelGrant
from app.models.exam import Exam
from app.models.seminar import Seminar
from app.models.supervisor_change_request import SupervisorChangeRequest
from app.models.announcement import Announcement
from app.models.notification import Notification
from app.models.user import User
from app.utils.decorators import role_required, get_current_user
from sqlalchemy import func, desc
from datetime import datetime
from werkzeug.utils import secure_filename
import csv
import io
import os
import json

bp = Blueprint('research_office', __name__, url_prefix='/api/research-office')


@bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required('ad_research')
def get_dashboard():
    """Get comprehensive research office dashboard with all details"""
    current_user = get_current_user()

    # Get all schools
    schools = School.query.all()
    schools_data = []

    for school in schools:
        school_info = {
            'id': school.id,
            'name': school.name,
            'code': school.code,
            'chair': school.chair.to_dict() if school.chair else None,
            'faculty_count': Supervisor.query.filter_by(school_id=school.id).count(),
            'student_count': Scholar.query.filter_by(school_id=school.id).count(),
            'active_students': Scholar.query.filter_by(school_id=school.id, status='active').count()
        }
        schools_data.append(school_info)

    # Get all scholars with detailed info
    scholars = Scholar.query.all()
    scholars_data = []

    for scholar in scholars:
        scholar_info = {
            'id': scholar.id,
            'enrollment_number': scholar.enrollment_number,
            'program': scholar.program,
            'research_area': scholar.research_area,
            'admission_date': scholar.admission_date.isoformat() if scholar.admission_date else None,
            'status': scholar.status,
            'admission_mode': scholar.admission_mode,
            'thesis_title': scholar.thesis_title,
            'school': {
                'id': scholar.school.id,
                'name': scholar.school.name,
                'code': scholar.school.code
            } if scholar.school else None,
            'supervisor': {
                'id': scholar.supervisor.id,
                'name': scholar.supervisor.user.name if scholar.supervisor and scholar.supervisor.user else None,
                'designation': scholar.supervisor.designation if scholar.supervisor else None
            } if scholar.supervisor else None,
            'user': {
                'id': scholar.user.id,
                'name': scholar.user.name,
                'email': scholar.user.email,
                'phone': scholar.user.phone
            } if scholar.user else None
        }
        scholars_data.append(scholar_info)

    # Get all faculty with detailed info
    faculty = Supervisor.query.all()
    faculty_data = []

    for fac in faculty:
        student_count = Scholar.query.filter_by(supervisor_id=fac.id, status='active').count()

        faculty_info = {
            'id': fac.id,
            'employee_id': fac.employee_id,
            'designation': fac.designation,
            'specialization': fac.specialization,
            'is_accepting_students': fac.is_accepting_students,
            'max_phd_scholars': fac.max_phd_scholars,
            'max_msc_scholars': fac.max_msc_scholars,
            'current_student_count': student_count,
            'school': {
                'id': fac.school.id,
                'name': fac.school.name,
                'code': fac.school.code
            } if fac.school else None,
            'user': {
                'id': fac.user.id,
                'name': fac.user.name,
                'email': fac.user.email,
                'phone': fac.user.phone
            } if fac.user else None
        }
        faculty_data.append(faculty_info)

    # Get pending submissions/requests
    pending_synopsis = Synopsis.query.filter_by(status='pending').count()
    pending_progress_reports = ProgressReport.query.filter_by(status='pending').count()
    pending_thesis = Thesis.query.filter_by(status='pending').count()
    pending_travel_grants = TravelGrant.query.filter_by(status='pending').count()
    pending_supervisor_changes = SupervisorChangeRequest.query.filter_by(status='pending').count()

    # Get upcoming events
    upcoming_exams = Exam.query.filter(Exam.scheduled_date >= func.current_date()).limit(5).all()
    upcoming_seminars = Seminar.query.filter(Seminar.scheduled_date >= func.current_date()).limit(5).all()

    # Calculate comprehensive statistics
    total_students = len(scholars)
    active_students = len([s for s in scholars if s.status == 'active'])
    phd_students = len([s for s in scholars if s.program == 'PhD'])
    msc_students = len([s for s in scholars if s.program == 'M.Sc. (Research)'])

    statistics = {
        'schools': {
            'total': len(schools),
            'details': schools_data
        },
        'students': {
            'total': total_students,
            'active': active_students,
            'on_leave': len([s for s in scholars if s.status == 'on_leave']),
            'graduated': len([s for s in scholars if s.status == 'graduated']),
            'withdrawn': len([s for s in scholars if s.status == 'withdrawn']),
            'phd': phd_students,
            'msc': msc_students,
            'by_admission_mode': {
                'regular': len([s for s in scholars if s.admission_mode == 'Regular']),
                'sponsored': len([s for s in scholars if s.admission_mode == 'Sponsored']),
                'external': len([s for s in scholars if s.admission_mode == 'External'])
            }
        },
        'faculty': {
            'total': len(faculty),
            'accepting_students': len([f for f in faculty if f.is_accepting_students]),
            'not_accepting': len([f for f in faculty if not f.is_accepting_students])
        },
        'pending_items': {
            'synopsis': pending_synopsis,
            'progress_reports': pending_progress_reports,
            'thesis': pending_thesis,
            'travel_grants': pending_travel_grants,
            'supervisor_changes': pending_supervisor_changes,
            'total': pending_synopsis + pending_progress_reports + pending_thesis + pending_travel_grants + pending_supervisor_changes
        },
        'upcoming': {
            'exams': [
                {
                    'id': exam.id,
                    'exam_type': exam.exam_type,
                    'scheduled_date': exam.scheduled_date.isoformat() if exam.scheduled_date else None,
                    'scholar': exam.scholar.user.name if exam.scholar and exam.scholar.user else None
                } for exam in upcoming_exams
            ],
            'seminars': [
                {
                    'id': seminar.id,
                    'seminar_type': seminar.seminar_type,
                    'scheduled_date': seminar.scheduled_date.isoformat() if seminar.scheduled_date else None,
                    'title': seminar.title,
                    'scholar': seminar.scholar.user.name if seminar.scholar and seminar.scholar.user else None
                } for seminar in upcoming_seminars
            ]
        }
    }

    dashboard_data = {
        'statistics': statistics,
        'schools': schools_data,
        'scholars': scholars_data,
        'faculty': faculty_data
    }

    return jsonify(dashboard_data), 200


@bp.route('/pending-requests', methods=['GET'])
@jwt_required()
@role_required('ad_research')
def get_pending_requests():
    """Get all pending requests that need research office review"""

    # Get pending synopsis
    pending_synopsis = Synopsis.query.filter_by(status='pending').all()
    synopsis_data = [
        {
            'id': s.id,
            'type': 'synopsis',
            'title': s.title,
            'submitted_date': s.submitted_date.isoformat() if s.submitted_date else None,
            'scholar': {
                'enrollment_number': s.scholar.enrollment_number,
                'name': s.scholar.user.name if s.scholar.user else None
            } if s.scholar else None
        } for s in pending_synopsis
    ]

    # Get pending progress reports
    pending_reports = ProgressReport.query.filter_by(status='pending').all()
    reports_data = [
        {
            'id': r.id,
            'type': 'progress_report',
            'report_period': r.report_period,
            'submitted_date': r.submitted_date.isoformat() if r.submitted_date else None,
            'scholar': {
                'enrollment_number': r.scholar.enrollment_number,
                'name': r.scholar.user.name if r.scholar.user else None
            } if r.scholar else None
        } for r in pending_reports
    ]

    # Get pending thesis
    pending_thesis = Thesis.query.filter_by(status='pending').all()
    thesis_data = [
        {
            'id': t.id,
            'type': 'thesis',
            'title': t.title,
            'submitted_date': t.submitted_date.isoformat() if t.submitted_date else None,
            'scholar': {
                'enrollment_number': t.scholar.enrollment_number,
                'name': t.scholar.user.name if t.scholar.user else None
            } if t.scholar else None
        } for t in pending_thesis
    ]

    # Get pending travel grants
    pending_grants = TravelGrant.query.filter_by(status='pending').all()
    grants_data = [
        {
            'id': g.id,
            'type': 'travel_grant',
            'conference_name': g.conference_name,
            'start_date': g.start_date.isoformat() if g.start_date else None,
            'scholar': {
                'enrollment_number': g.scholar.enrollment_number,
                'name': g.scholar.user.name if g.scholar.user else None
            } if g.scholar else None
        } for g in pending_grants
    ]

    # Get pending supervisor change requests
    pending_changes = SupervisorChangeRequest.query.filter_by(status='pending').all()
    changes_data = [
        {
            'id': c.id,
            'type': 'supervisor_change',
            'reason': c.reason,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'scholar': {
                'enrollment_number': c.scholar.enrollment_number,
                'name': c.scholar.user.name if c.scholar.user else None
            } if c.scholar else None,
            'current_supervisor': c.current_supervisor.user.name if c.current_supervisor and c.current_supervisor.user else None,
            'new_supervisor': c.new_supervisor.user.name if c.new_supervisor and c.new_supervisor.user else None
        } for c in pending_changes
    ]

    all_pending = {
        'synopsis': synopsis_data,
        'progress_reports': reports_data,
        'thesis': thesis_data,
        'travel_grants': grants_data,
        'supervisor_changes': changes_data,
        'total_count': len(synopsis_data) + len(reports_data) + len(thesis_data) + len(grants_data) + len(changes_data)
    }

    return jsonify(all_pending), 200


@bp.route('/all-scholars', methods=['GET'])
@jwt_required()
@role_required('ad_research')
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
            } if s.user else None,
            'suspension_start_date': s.suspension_start_date.isoformat() if s.suspension_start_date else None,
            'suspension_end_date': s.suspension_end_date.isoformat() if s.suspension_end_date else None,
            'is_rusticated': s.is_rusticated
        } for s in scholars
    ]

    return jsonify(scholars_data), 200


@bp.route('/all-faculty', methods=['GET'])
@jwt_required()
@role_required('ad_research')
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


@bp.route('/export-scholars', methods=['GET'])
@jwt_required()
@role_required('ad_research')
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


@bp.route('/announcements', methods=['GET'])
@jwt_required()
@role_required('ad_research')
def get_announcements():
    """Get all announcements (published and drafts for ad_research)"""
    current_user = get_current_user()

    # AD Research can see all announcements, research_office only sees published
    if current_user.role == 'ad_research':
        announcements = Announcement.query.order_by(Announcement.created_at.desc()).all()
    else:
        announcements = Announcement.query.filter_by(is_published=True).order_by(Announcement.created_at.desc()).all()

    announcements_data = [ann.to_dict() for ann in announcements]

    return jsonify({'announcements': announcements_data}), 200


# Helper functions for announcements
def allowed_file(filename):
    """Check if file extension is allowed"""
    from flask import current_app
    ALLOWED_EXTENSIONS = current_app.config.get('ALLOWED_EXTENSIONS', {'pdf', 'doc', 'docx', 'txt'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def publish_announcement(announcement_id):
    """Publish announcement and create notifications"""
    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return

    announcement.is_published = True
    announcement.published_at = datetime.utcnow()
    db.session.commit()

    # Create notifications for target audience
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


@bp.route('/announcements', methods=['POST'])
@jwt_required()
@role_required('ad_research')
def create_announcement():
    """Create a new announcement (AD Research only)"""
    from flask import current_app
    current_user = get_current_user()

    # Handle multipart/form-data
    data = request.form.to_dict()

    # Validate required fields
    required_fields = ['title', 'message', 'target_audience', 'scheduled_time']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Parse target audience (should be JSON string)
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
    UPLOAD_FOLDER = current_app.config.get('UPLOAD_FOLDER')

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

            attachment_url = f'/api/research-office/announcements/attachments/{unique_filename}'
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


@bp.route('/announcements/<int:id>', methods=['GET'])
@jwt_required()
@role_required('ad_research')
def get_announcement(id):
    """Get a specific announcement (AD Research only)"""
    announcement = Announcement.query.get(id)

    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404

    return jsonify({'announcement': announcement.to_dict()}), 200


@bp.route('/announcements/<int:id>', methods=['PUT'])
@jwt_required()
@role_required('ad_research')
def update_announcement(id):
    """Update an announcement (AD Research only)"""
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
@role_required('ad_research')
def delete_announcement(id):
    """Delete an announcement (AD Research only)"""
    from flask import current_app
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
            UPLOAD_FOLDER = current_app.config.get('UPLOAD_FOLDER')
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
@role_required('ad_research')
def publish_announcement_route(id):
    """Manually publish an announcement (AD Research only)"""
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
    from flask import current_app, send_from_directory
    UPLOAD_FOLDER = current_app.config.get('UPLOAD_FOLDER')
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    return send_from_directory(UPLOAD_FOLDER, filename)


@bp.route('/bulk-admission', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def bulk_admission():
    """
    Bulk admission of scholars via CSV upload (Dean Academics only)
    CSV Format: name, email, phone, enrollment_number, program, school_code, admission_date, 
                admission_mode, research_area, supervisor_email, co_supervisor_email,
                dc_member1_email, dc_member2_email, dc_member3_email,
                apc_member1_email, apc_member2_email, apc_member3_email
    """
    from app.models.committee import Committee, CommitteeMember
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a CSV'}), 400

    try:
        # Read CSV file
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_reader = csv.DictReader(stream)
        
        success_count = 0
        error_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 to account for header
            try:
                # Validate required fields
                required_fields = ['name', 'email', 'enrollment_number', 'program', 'school_code', 
                                 'supervisor_email', 'dc_member1_email', 'dc_member2_email', 'dc_member3_email',
                                 'apc_member1_email', 'apc_member2_email', 'apc_member3_email']
                
                missing_fields = [field for field in required_fields if not row.get(field)]
                if missing_fields:
                    errors.append(f"Row {row_num}: Missing required fields: {', '.join(missing_fields)}")
                    error_count += 1
                    continue

                # Check if user already exists
                existing_user = User.query.filter_by(email=row['email'].strip()).first()
                if existing_user:
                    errors.append(f"Row {row_num}: User with email {row['email']} already exists")
                    error_count += 1
                    continue

                # Check if enrollment number exists
                existing_scholar = Scholar.query.filter_by(enrollment_number=row['enrollment_number'].strip()).first()
                if existing_scholar:
                    errors.append(f"Row {row_num}: Scholar with enrollment number {row['enrollment_number']} already exists")
                    error_count += 1
                    continue

                # Find school
                school = School.query.filter_by(code=row['school_code'].strip()).first()
                if not school:
                    errors.append(f"Row {row_num}: School with code {row['school_code']} not found")
                    error_count += 1
                    continue

                # Find supervisor
                supervisor_user = User.query.filter_by(email=row['supervisor_email'].strip()).first()
                if not supervisor_user or not supervisor_user.supervisor_profile:
                    errors.append(f"Row {row_num}: Supervisor with email {row['supervisor_email']} not found")
                    error_count += 1
                    continue
                supervisor = supervisor_user.supervisor_profile

                # Find co-supervisor (optional)
                co_supervisor = None
                if row.get('co_supervisor_email') and row['co_supervisor_email'].strip():
                    co_supervisor_user = User.query.filter_by(email=row['co_supervisor_email'].strip()).first()
                    if co_supervisor_user and co_supervisor_user.supervisor_profile:
                        co_supervisor = co_supervisor_user.supervisor_profile

                # Find doctoral committee members
                dc_members = []
                for i in range(1, 4):  # dc_member1, dc_member2, dc_member3
                    dc_email_key = f'dc_member{i}_email'
                    dc_email = row.get(dc_email_key, '').strip()
                    
                    if not dc_email:
                        errors.append(f"Row {row_num}: Doctoral committee member {i} email is required")
                        error_count += 1
                        break
                    
                    dc_user = User.query.filter_by(email=dc_email).first()
                    if not dc_user or not dc_user.supervisor_profile:
                        errors.append(f"Row {row_num}: Doctoral committee member with email {dc_email} not found")
                        error_count += 1
                        break
                    
                    dc_members.append(dc_user.supervisor_profile)
                
                # Skip if any DC member not found
                if len(dc_members) != 3:
                    continue

                # Find academic progress committee members
                apc_members = []
                for i in range(1, 4):  # apc_member1, apc_member2, apc_member3
                    apc_email_key = f'apc_member{i}_email'
                    apc_email = row.get(apc_email_key, '').strip()
                    
                    if not apc_email:
                        errors.append(f"Row {row_num}: Academic Progress Committee member {i} email is required")
                        error_count += 1
                        break
                    
                    apc_user = User.query.filter_by(email=apc_email).first()
                    if not apc_user or not apc_user.supervisor_profile:
                        errors.append(f"Row {row_num}: Academic Progress Committee member with email {apc_email} not found")
                        error_count += 1
                        break
                    
                    apc_members.append(apc_user.supervisor_profile)
                
                # Skip if any APC member not found
                if len(apc_members) != 3:
                    continue

                # Parse admission date
                admission_date = None
                if row.get('admission_date') and row['admission_date'].strip():
                    try:
                        admission_date = datetime.strptime(row['admission_date'].strip(), '%Y-%m-%d').date()
                    except ValueError:
                        try:
                            admission_date = datetime.strptime(row['admission_date'].strip(), '%d/%m/%Y').date()
                        except ValueError:
                            errors.append(f"Row {row_num}: Invalid admission_date format. Use YYYY-MM-DD or DD/MM/YYYY")
                            error_count += 1
                            continue

                # Create user
                user = User(
                    name=row['name'].strip(),
                    email=row['email'].strip(),
                    phone=row.get('phone', '').strip() or None,
                    role='scholar',
                    is_active=True
                )
                # Set default password (should be changed on first login)
                default_password = row.get('password', 'Scholar@123')
                user.set_password(default_password)
                
                db.session.add(user)
                db.session.flush()

                # Create scholar profile
                scholar = Scholar(
                    user_id=user.id,
                    enrollment_number=row['enrollment_number'].strip(),
                    program=row['program'].strip(),
                    school_id=school.id,
                    supervisor_id=supervisor.id,
                    co_supervisor_id=co_supervisor.id if co_supervisor else None,
                    admission_date=admission_date,
                    admission_mode=row.get('admission_mode', '').strip() or None,
                    research_area=row.get('research_area', '').strip() or None,
                    status='active'
                )
                
                db.session.add(scholar)
                db.session.flush()

                # Create doctoral committee
                committee = Committee(scholar_id=scholar.id)
                db.session.add(committee)
                db.session.flush()

                # Add doctoral committee members
                for dc_member in dc_members:
                    committee_member = CommitteeMember(
                        committee_id=committee.id,
                        supervisor_id=dc_member.id,
                        member_type='DC',
                        is_active=True
                    )
                    db.session.add(committee_member)

                # Add academic progress committee members
                for apc_member in apc_members:
                    committee_member = CommitteeMember(
                        committee_id=committee.id,
                        supervisor_id=apc_member.id,
                        member_type='APC',
                        is_active=True
                    )
                    db.session.add(committee_member)

                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                error_count += 1
                continue

        # Commit all changes if there were any successes
        if success_count > 0:
            db.session.commit()
        else:
            db.session.rollback()

        return jsonify({
            'message': f'Bulk admission completed. {success_count} scholars added, {error_count} errors.',
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors if errors else None
        }), 200 if error_count == 0 else 207  # 207 = Multi-Status

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error processing CSV: {str(e)}'}), 500


@bp.route('/bulk-admission/template', methods=['GET'])
@jwt_required()
@role_required('dean_academics')
def download_bulk_admission_template():
    """Download CSV template for bulk admission"""
    
    # Create CSV template
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row with all required fields
    writer.writerow([
        'name',
        'email', 
        'phone',
        'enrollment_number',
        'program',
        'school_code',
        'admission_date',
        'admission_mode',
        'research_area',
        'supervisor_email',
        'co_supervisor_email',
        'dc_member1_email',
        'dc_member2_email',
        'dc_member3_email',
        'apc_member1_email',
        'apc_member2_email',
        'apc_member3_email',
        'password'
    ])
    
    # Add sample data row
    writer.writerow([
        'John Doe',
        'john.doe@university.edu',
        '1234567890',
        'PHD2025001',
        'PhD',
        'CS',
        '2025-01-15',
        'Regular',
        'Machine Learning',
        'supervisor1@university.edu',
        '',
        'dc1@university.edu',
        'dc2@university.edu',
        'dc3@university.edu',
        'apc1@university.edu',
        'apc2@university.edu',
        'apc3@university.edu',
        'Scholar@123'
    ])
    
    # Prepare response
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='bulk_admission_template.csv'
    )
