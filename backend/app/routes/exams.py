from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.exam import Exam
from app.utils.decorators import role_required, get_current_user
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('exams', __name__, url_prefix='/api/exams')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_exams(scholar_id):
    """Get exams for a scholar"""
    exams = Exam.query.filter_by(scholar_id=scholar_id).all()
    return jsonify([e.to_dict() for e in exams]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('supervisor', 'dean_academics')
def schedule_exam():
    """Schedule a comprehensive exam"""
    current_user = get_current_user()
    data = request.get_json()

    exam = Exam(
        scholar_id=data['scholar_id'],
        exam_type=data['exam_type'],
        scheduled_date=datetime.fromisoformat(data['scheduled_date']) if data.get('scheduled_date') else None,
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        status='scheduled',
        venue=data.get('venue'),
        scheduled_by=current_user.id
    )

    db.session.add(exam)
    db.session.commit()

    # Notify scholar
    if exam.scheduled_date:
        NotificationService.notify_exam_scheduled(data['scholar_id'], exam.id, exam.scheduled_date)

    return jsonify(exam.to_dict()), 201

@bp.route('/<int:exam_id>', methods=['PUT'])
@jwt_required()
@role_required('supervisor', 'dean_academics')
def update_exam(exam_id):
    """Update exam details or results"""
    exam = Exam.query.get_or_404(exam_id)
    data = request.get_json()

    if 'status' in data:
        exam.status = data['status']
    if 'result' in data:
        exam.result = data['result']
    if 'marks' in data:
        exam.marks = data['marks']
    if 'remarks' in data:
        exam.remarks = data['remarks']
    if 'completion_date' in data:
        exam.completion_date = datetime.fromisoformat(data['completion_date'])

    db.session.commit()
    return jsonify(exam.to_dict()), 200
