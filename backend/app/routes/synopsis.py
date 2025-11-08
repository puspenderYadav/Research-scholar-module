from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.synopsis import Synopsis
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('synopsis', __name__, url_prefix='/api/synopsis')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_synopsis(scholar_id):
    """Get synopsis submissions for a scholar"""
    synopses = Synopsis.query.filter_by(scholar_id=scholar_id).order_by(Synopsis.version.desc()).all()
    return jsonify([s.to_dict() for s in synopses]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('scholar')
def submit_synopsis():
    """Submit synopsis"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    relative_path, filename = save_uploaded_file(file, subfolder='synopsis')

    if not relative_path:
        return jsonify({'error': 'File upload failed'}), 500

    # Get version number
    last_synopsis = Synopsis.query.filter_by(scholar_id=scholar.id).order_by(Synopsis.version.desc()).first()
    version = (last_synopsis.version + 1) if last_synopsis else 1

    synopsis = Synopsis(
        scholar_id=scholar.id,
        file_path=relative_path,
        file_name=filename,
        version=version,
        status='submitted'
    )

    db.session.add(synopsis)
    db.session.commit()

    # Notify supervisor
    if scholar.supervisor:
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='Synopsis Submitted',
            message=f'Scholar {scholar.enrollment_number} has submitted synopsis (v{version})',
            notification_type='submission',
            priority='high',
            related_entity_type='synopsis',
            related_entity_id=synopsis.id
        )

    return jsonify(synopsis.to_dict()), 201

@bp.route('/<int:synopsis_id>/review', methods=['POST'])
@jwt_required()
@role_required('supervisor', 'dean_academics')
def review_synopsis(synopsis_id):
    """Review synopsis submission"""
    current_user = get_current_user()
    synopsis = Synopsis.query.get_or_404(synopsis_id)
    data = request.get_json()

    status = data.get('status')  # accepted, changes_requested, rejected
    feedback = data.get('feedback', '')

    if status not in ['accepted', 'changes_requested', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400

    synopsis.status = status
    synopsis.reviewed_by = current_user.id
    synopsis.reviewed_at = datetime.utcnow()
    synopsis.feedback = feedback

    db.session.commit()

    # Notify scholar
    NotificationService.notify_submission_reviewed(
        synopsis.scholar.user_id, 'synopsis', synopsis.id, status, feedback
    )

    return jsonify(synopsis.to_dict()), 200
