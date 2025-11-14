from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.supervisor import Supervisor
from app.models.scholar import Scholar
from app.models.committee import CommitteeMember
from app.utils.decorators import role_required, get_current_user

bp = Blueprint('supervisors', __name__, url_prefix='/api/supervisors')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_supervisors():
    """Get list of all supervisors"""
    supervisors = Supervisor.query.all()
    return jsonify([s.to_dict() for s in supervisors]), 200

@bp.route('/my-profile', methods=['GET'])
@jwt_required()
@role_required('supervisor', 'faculty')
def get_my_profile():
    """Get current supervisor's profile with students and committees"""
    current_user = get_current_user()
    supervisor = current_user.supervisor_profile

    if not supervisor:
        return jsonify({'error': 'Supervisor profile not found'}), 404

    # Get basic supervisor info
    profile_data = supervisor.to_dict()

    # Get students under supervision
    students = Scholar.query.filter_by(supervisor_id=supervisor.id).all()
    profile_data['students'] = [
        {
            'id': s.id,
            'enrollment_number': s.enrollment_number,
            'program': s.program,
            'research_area': s.research_area,
            'admission_date': s.admission_date.isoformat() if s.admission_date else None,
            'status': s.status,
            'user': {
                'id': s.user.id,
                'name': s.user.name,
                'email': s.user.email,
                'phone': s.user.phone
            } if s.user else None
        } for s in students
    ]

    # Get committees the supervisor is part of
    committee_memberships = CommitteeMember.query.filter_by(supervisor_id=supervisor.id).all()
    profile_data['committees'] = [
        {
            'id': cm.committee.id,
            'member_type': cm.member_type,  # DC, APC, or ADC
            'is_active': cm.is_active,
            'assigned_date': cm.assigned_date.isoformat() if cm.assigned_date else None,
            'scholar': {
                'id': cm.committee.scholar.id,
                'enrollment_number': cm.committee.scholar.enrollment_number,
                'name': cm.committee.scholar.user.name if cm.committee.scholar.user else None,
                'program': cm.committee.scholar.program
            } if cm.committee.scholar else None
        } for cm in committee_memberships
    ]

    # Get school information
    if supervisor.school:
        profile_data['school'] = {
            'id': supervisor.school.id,
            'name': supervisor.school.name,
            'code': supervisor.school.code
        }

    # Get statistics
    profile_data['statistics'] = {
        'total_students': len(students),
        'phd_students': len([s for s in students if s.program == 'PhD']),
        'msc_students': len([s for s in students if s.program == 'M.Sc. (Research)']),
        'active_students': len([s for s in students if s.status == 'active']),
        'total_committees': len(committee_memberships)
    }

    return jsonify(profile_data), 200

@bp.route('/<int:supervisor_id>', methods=['GET'])
@jwt_required()
def get_supervisor(supervisor_id):
    """Get supervisor details"""
    supervisor = Supervisor.query.get_or_404(supervisor_id)
    return jsonify(supervisor.to_dict()), 200
