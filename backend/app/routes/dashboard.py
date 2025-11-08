from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from app.models.travel_grant import TravelGrant
from app.models.exam import Exam
from app.models.seminar import Seminar
from app.utils.decorators import get_current_user, role_required
from sqlalchemy import func

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@bp.route('/scholar', methods=['GET'])
@jwt_required()
@role_required('scholar')
def scholar_dashboard():
    """Get dashboard data for scholar"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    # Get counts
    exams_count = Exam.query.filter_by(scholar_id=scholar.id).count()
    seminars_count = Seminar.query.filter_by(scholar_id=scholar.id).count()
    travel_grants_count = TravelGrant.query.filter_by(scholar_id=scholar.id).count()

    # Get pending items
    pending_exams = Exam.query.filter_by(scholar_id=scholar.id, status='pending').count()
    pending_seminars = Seminar.query.filter_by(scholar_id=scholar.id, status='pending').count()

    return jsonify({
        'scholar': scholar.to_dict(include_relations=True),
        'stats': {
            'exams_count': exams_count,
            'seminars_count': seminars_count,
            'travel_grants_count': travel_grants_count,
            'pending_exams': pending_exams,
            'pending_seminars': pending_seminars
        }
    }), 200

@bp.route('/supervisor', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def supervisor_dashboard():
    """Get dashboard data for supervisor"""
    current_user = get_current_user()
    supervisor = current_user.supervisor_profile

    if not supervisor:
        return jsonify({'error': 'Supervisor profile not found'}), 404

    # Get scholars
    scholars = Scholar.query.filter_by(supervisor_id=supervisor.id, status='active').all()

    # Get pending reviews
    from app.models.synopsis import Synopsis
    from app.models.progress_report import ProgressReport

    pending_synopsis = Synopsis.query.join(Scholar).filter(
        Scholar.supervisor_id == supervisor.id,
        Synopsis.status == 'submitted'
    ).count()

    pending_progress = ProgressReport.query.join(Scholar).filter(
        Scholar.supervisor_id == supervisor.id,
        ProgressReport.status == 'submitted'
    ).count()

    return jsonify({
        'supervisor': supervisor.to_dict(),
        'scholars': [s.to_dict() for s in scholars],
        'stats': {
            'total_scholars': len(scholars),
            'pending_synopsis_reviews': pending_synopsis,
            'pending_progress_reviews': pending_progress
        }
    }), 200

@bp.route('/dean', methods=['GET'])
@jwt_required()
@role_required('dean_academics', 'ad_research')
def dean_dashboard():
    """Get dashboard data for Dean/AD Research"""

    # Get overview statistics
    total_scholars = Scholar.query.filter_by(status='active').count()
    total_supervisors = Supervisor.query.filter_by(is_accepting_students=True).count()

    # Scholars by program
    scholars_by_program = Scholar.query.with_entities(
        Scholar.program, func.count(Scholar.id)
    ).group_by(Scholar.program).all()

    # Travel grants by status
    grants_by_status = TravelGrant.query.with_entities(
        TravelGrant.status, func.count(TravelGrant.id)
    ).group_by(TravelGrant.status).all()

    return jsonify({
        'stats': {
            'total_scholars': total_scholars,
            'total_supervisors': total_supervisors,
            'scholars_by_program': dict(scholars_by_program),
            'grants_by_status': dict(grants_by_status)
        }
    }), 200
