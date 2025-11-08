from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.thesis import Thesis
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('thesis', __name__, url_prefix='/api/thesis')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_thesis(scholar_id):
    """Get thesis submissions for a scholar"""
    theses = Thesis.query.filter_by(scholar_id=scholar_id).order_by(Thesis.version.desc()).all()
    return jsonify([t.to_dict() for t in theses]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('scholar')
def submit_thesis():
    """Submit thesis"""
    current_user = get_current_user()
    scholar = current_user.scholar_profile

    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    relative_path, filename = save_uploaded_file(file, subfolder='thesis')

    if not relative_path:
        return jsonify({'error': 'File upload failed'}), 500

    data = request.form

    # Get version number
    last_thesis = Thesis.query.filter_by(scholar_id=scholar.id).order_by(Thesis.version.desc()).first()
    version = (last_thesis.version + 1) if last_thesis else 1

    thesis = Thesis(
        scholar_id=scholar.id,
        file_path=relative_path,
        file_name=filename,
        version=version,
        submission_type=data.get('submission_type', 'initial'),
        status='submitted'
    )

    db.session.add(thesis)
    db.session.commit()

    # Notify supervisor
    if scholar.supervisor:
        NotificationService.create_notification(
            user_id=scholar.supervisor.user_id,
            title='Thesis Submitted',
            message=f'Scholar {scholar.enrollment_number} has submitted thesis (v{version} - {thesis.submission_type})',
            notification_type='submission',
            priority='high',
            related_entity_type='thesis',
            related_entity_id=thesis.id
        )

    return jsonify(thesis.to_dict()), 201

@bp.route('/<int:thesis_id>/schedule-defense', methods=['POST'])
@jwt_required()
@role_required('supervisor', 'dean_academics')
def schedule_defense(thesis_id):
    """Schedule thesis defense"""
    thesis = Thesis.query.get_or_404(thesis_id)
    data = request.get_json()

    thesis.defense_date = datetime.fromisoformat(data['defense_date'])
    thesis.defense_venue = data.get('defense_venue')
    thesis.defense_status = 'scheduled'
    thesis.status = 'defense_scheduled'

    db.session.commit()

    # Notify scholar
    NotificationService.create_notification(
        user_id=thesis.scholar.user_id,
        title='Thesis Defense Scheduled',
        message=f'Your thesis defense has been scheduled for {thesis.defense_date.strftime("%Y-%m-%d %H:%M")}',
        notification_type='exam',
        priority='high',
        related_entity_type='thesis',
        related_entity_id=thesis.id
    )

    return jsonify(thesis.to_dict()), 200
