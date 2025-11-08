from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import get_current_user
from app.utils.notification_service import NotificationService

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for current user"""
    current_user = get_current_user()
    notifications = NotificationService.get_user_notifications(current_user.id, limit=50)
    return jsonify([n.to_dict() for n in notifications]), 200

@bp.route('/unread', methods=['GET'])
@jwt_required()
def get_unread_notifications():
    """Get unread notifications count"""
    current_user = get_current_user()
    count = NotificationService.get_unread_count(current_user.id)
    return jsonify({'unread_count': count}), 200

@bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    NotificationService.mark_as_read(notification_id)
    return jsonify({'message': 'Notification marked as read'}), 200

@bp.route('/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read"""
    current_user = get_current_user()
    NotificationService.mark_all_as_read(current_user.id)
    return jsonify({'message': 'All notifications marked as read'}), 200
