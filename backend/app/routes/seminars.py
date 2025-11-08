from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.seminar import Seminar
from app.utils.decorators import role_required, get_current_user
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('seminars', __name__, url_prefix='/api/seminars')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_seminars(scholar_id):
    """Get seminars for a scholar"""
    seminars = Seminar.query.filter_by(scholar_id=scholar_id).all()
    return jsonify([s.to_dict() for s in seminars]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('supervisor', 'scholar', 'dean_academics')
def create_seminar():
    """Create/Schedule a seminar"""
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

@bp.route('/<int:seminar_id>', methods=['PUT'])
@jwt_required()
def update_seminar(seminar_id):
    """Update seminar details"""
    seminar = Seminar.query.get_or_404(seminar_id)
    data = request.get_json()

    if 'status' in data:
        seminar.status = data['status']
    if 'feedback' in data:
        seminar.feedback = data['feedback']
    if 'attendance_count' in data:
        seminar.attendance_count = data['attendance_count']

    db.session.commit()
    return jsonify(seminar.to_dict()), 200
