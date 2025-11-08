from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from datetime import timedelta

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    if not data.get('role'):
        return jsonify({'error': 'Please select a role'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is inactive. Please contact administrator'}), 403

    # Validate role matches user's actual role
    selected_role = data.get('role')
    if user.role != selected_role:
        return jsonify({'error': f'Invalid role selected. You are registered as {user.role}'}), 403

    # Create tokens (convert ID to string for JWT compatibility)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    # Get additional profile info based on role
    profile_data = None
    if user.role == 'scholar' and user.scholar_profile:
        profile_data = user.scholar_profile.to_dict()
    elif user.role == 'supervisor' and user.supervisor_profile:
        profile_data = user.supervisor_profile.to_dict()

    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(),
        'profile': profile_data
    }), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)

    return jsonify({
        'access_token': access_token
    }), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    current_user_id = int(get_jwt_identity())  # Convert string to int
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get additional profile info based on role
    profile_data = None
    if user.role == 'scholar' and user.scholar_profile:
        profile_data = user.scholar_profile.to_dict(include_relations=True)
    elif user.role == 'supervisor' and user.supervisor_profile:
        profile_data = user.supervisor_profile.to_dict()

    return jsonify({
        'user': user.to_dict(),
        'profile': profile_data
    }), 200


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    current_user_id = int(get_jwt_identity())  # Convert string to int
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Old password and new password are required'}), 400

    if not user.check_password(data['old_password']):
        return jsonify({'error': 'Old password is incorrect'}), 401

    if len(data['new_password']) < 8:
        return jsonify({'error': 'New password must be at least 8 characters long'}), 400

    user.set_password(data['new_password'])
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200


@bp.route('/register-scholar', methods=['POST'])
@jwt_required()
def register_scholar():
    """Register a new scholar (Admin only)"""
    from app.utils.decorators import get_current_user
    from app.utils.email_service import EmailService
    import secrets

    current_user = get_current_user()

    # Only dean_academics can create new scholars
    if current_user.role != 'dean_academics':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['email', 'name', 'enrollment_number', 'program', 'school_id', 'admission_date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User with this email already exists'}), 400

    if Scholar.query.filter_by(enrollment_number=data['enrollment_number']).first():
        return jsonify({'error': 'Scholar with this enrollment number already exists'}), 400

    # Generate temporary password
    temporary_password = secrets.token_urlsafe(12)

    # Create user
    user = User(
        email=data['email'],
        name=data['name'],
        phone=data.get('phone'),
        role='scholar',
        is_active=True
    )
    user.set_password(temporary_password)

    db.session.add(user)
    db.session.flush()  # Get user.id

    # Create scholar profile
    from datetime import datetime as dt
    scholar = Scholar(
        user_id=user.id,
        enrollment_number=data['enrollment_number'],
        program=data['program'],
        school_id=data['school_id'],
        admission_date=dt.fromisoformat(data['admission_date']) if isinstance(data['admission_date'], str) else data['admission_date'],
        research_area=data.get('research_area'),
        expected_completion_date=dt.fromisoformat(data['expected_completion_date']) if data.get('expected_completion_date') else None
    )

    db.session.add(scholar)
    db.session.commit()

    # Send welcome email
    EmailService.send_welcome_email(user, temporary_password)

    return jsonify({
        'message': 'Scholar registered successfully',
        'user': user.to_dict(),
        'scholar': scholar.to_dict(),
        'temporary_password': temporary_password  # In production, don't return this
    }), 201
