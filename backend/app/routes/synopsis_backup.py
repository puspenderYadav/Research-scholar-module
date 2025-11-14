from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required
from app import db
from app.models.synopsis import Synopsis, SynopsisApproval
from app.models.scholar import Scholar
from app.models.committee import Committee, CommitteeMember
from app.models.user import User
from app.utils.decorators import role_required, get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.notification_service import NotificationService
from datetime import datetime
import os

bp = Blueprint('synopsis', __name__, url_prefix='/api/synopsis')


@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_synopsis(scholar_id):
    synopses = Synopsis.query.filter_by(scholar_id=scholar_id).order_by(Synopsis.version.desc()).all()
    return jsonify([s.to_dict() for s in synopses]), 200


@bp.route('/my-synopsis', methods=['GET'])
@jwt_required()
@role_required('scholar')
def get_my_synopsis():
    current_user = get_current_user()
    scholar = current_user.scholar_profile
    if not scholar:
        return jsonify({'error': 'Scholar profile not found'}), 404
    synopses = Synopsis.query.filter_by(scholar_id=scholar.id).order_by(Synopsis.version.desc()).all()
    return jsonify([s.to_dict() for s in synopses]), 200
