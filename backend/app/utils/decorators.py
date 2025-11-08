from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User

def role_required(*allowed_roles):
    """
    Decorator to restrict access based on user roles
    Usage: @role_required('dean_academics', 'ad_research')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = int(get_jwt_identity())  # Convert string to int
            user = User.query.get(current_user_id)

            if not user:
                return jsonify({'error': 'User not found'}), 404

            if not user.is_active:
                return jsonify({'error': 'User account is inactive'}), 403

            if user.role not in allowed_roles:
                return jsonify({
                    'error': 'Access denied',
                    'message': f'This endpoint requires one of these roles: {", ".join(allowed_roles)}'
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def scholar_or_supervisor_required(fn):
    """
    Decorator to allow both scholars and their supervisors to access resources
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = int(get_jwt_identity())  # Convert string to int
        user = User.query.get(current_user_id)

        if not user or not user.is_active:
            return jsonify({'error': 'Unauthorized access'}), 403

        # Allow if user is scholar, supervisor, or admin roles
        allowed_roles = ['scholar', 'supervisor', 'dean_academics', 'ad_research']
        if user.role not in allowed_roles:
            return jsonify({'error': 'Access denied'}), 403

        return fn(*args, **kwargs)
    return wrapper


def get_current_user():
    """Helper function to get current authenticated user"""
    verify_jwt_in_request()
    current_user_id = int(get_jwt_identity())  # Convert string to int
    return User.query.get(current_user_id)
