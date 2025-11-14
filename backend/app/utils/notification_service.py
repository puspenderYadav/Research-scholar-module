from app import db
from app.models.notification import Notification
from app.utils.email_service import EmailService
from datetime import datetime

class NotificationService:
    """Service for creating and managing notifications"""

    @staticmethod
    def create_notification(user_id, title, message, notification_type,
                          priority='medium', related_entity_type=None,
                          related_entity_id=None, action_link=None,
                          send_email=True):
        """
        Create a new notification for a user

        Args:
            user_id: ID of the user to notify
            title: Notification title
            message: Notification message
            notification_type: Type of notification (exam, seminar, submission, etc.)
            priority: Priority level (low, medium, high, urgent)
            related_entity_type: Type of related entity (optional)
            related_entity_id: ID of related entity (optional)
            action_link: Link for user action (optional)
            send_email: Whether to send email notification

        Returns:
            Notification: Created notification object
        """
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            action_link=action_link
        )

        db.session.add(notification)
        db.session.commit()

        # Send email if requested
        if send_email:
            EmailService.send_notification_email(notification)

        return notification

    @staticmethod
    def create_bulk_notifications(user_ids, title, message, notification_type, **kwargs):
        """Create notifications for multiple users"""
        notifications = []
        for user_id in user_ids:
            notification = NotificationService.create_notification(
                user_id, title, message, notification_type, **kwargs
            )
            notifications.append(notification)
        return notifications

    @staticmethod
    def get_user_notifications(user_id, unread_only=False, limit=50, notification_type=None, is_read=None):
        """Get notifications for a user with optional filtering"""
        query = Notification.query.filter_by(user_id=user_id)

        # Filter by type if specified
        if notification_type:
            query = query.filter_by(notification_type=notification_type)
        
        # Filter by read status if specified
        if is_read is not None:
            is_read_bool = is_read.lower() == 'true' if isinstance(is_read, str) else is_read
            query = query.filter_by(is_read=is_read_bool)
        elif unread_only:
            query = query.filter_by(is_read=False)

        return query.order_by(Notification.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_as_read(notification_id):
        """Mark a notification as read"""
        notification = Notification.query.get(notification_id)
        if notification:
            notification.mark_as_read()
            return True
        return False

    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user"""
        Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        db.session.commit()

    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications"""
        return Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
    
    @staticmethod
    def delete_notification(notification_id):
        """Delete a notification"""
        notification = Notification.query.get(notification_id)
        if notification:
            db.session.delete(notification)
            db.session.commit()
            return True
        return False

    # Specific notification creators

    @staticmethod
    def notify_exam_scheduled(scholar_id, exam_id, exam_date):
        """Notify scholar about scheduled exam"""
        return NotificationService.create_notification(
            user_id=scholar_id,
            title='Comprehensive Exam Scheduled',
            message=f'Your comprehensive exam has been scheduled for {exam_date.strftime("%Y-%m-%d %H:%M")}',
            notification_type='exam',
            priority='high',
            related_entity_type='exam',
            related_entity_id=exam_id,
            action_link=f'/exams/{exam_id}'
        )

    @staticmethod
    def notify_seminar_scheduled(scholar_id, seminar_id, seminar_date):
        """Notify scholar about scheduled seminar"""
        return NotificationService.create_notification(
            user_id=scholar_id,
            title='Seminar Scheduled',
            message=f'Your seminar has been scheduled for {seminar_date.strftime("%Y-%m-%d %H:%M")}',
            notification_type='seminar',
            priority='high',
            related_entity_type='seminar',
            related_entity_id=seminar_id,
            action_link=f'/seminars/{seminar_id}'
        )

    @staticmethod
    def notify_submission_reviewed(scholar_id, submission_type, submission_id, status, feedback=None):
        """Notify scholar about review of their submission"""
        status_text = status.replace('_', ' ').title()
        message = f'Your {submission_type} has been {status_text}.'
        if feedback:
            message += f' Feedback: {feedback[:100]}...'

        return NotificationService.create_notification(
            user_id=scholar_id,
            title=f'{submission_type.title()} Review Complete',
            message=message,
            notification_type='submission',
            priority='high',
            related_entity_type=submission_type,
            related_entity_id=submission_id
        )

    @staticmethod
    def notify_travel_grant_status(scholar_id, grant_id, status, stage, comments=None):
        """Notify about travel grant approval status"""
        message = f'Your travel grant application has been {status} at {stage} stage.'
        if comments:
            message += f' Comments: {comments[:100]}...'

        return NotificationService.create_notification(
            user_id=scholar_id,
            title='Travel Grant Status Update',
            message=message,
            notification_type='approval',
            priority='high',
            related_entity_type='travel_grant',
            related_entity_id=grant_id,
            action_link=f'/travel-grants/{grant_id}'
        )

    @staticmethod
    def notify_deadline_approaching(user_id, deadline_type, deadline_date, entity_id=None):
        """Notify about approaching deadline"""
        days_left = (deadline_date - datetime.now().date()).days

        return NotificationService.create_notification(
            user_id=user_id,
            title=f'{deadline_type} Deadline Approaching',
            message=f'You have {days_left} days left for {deadline_type}',
            notification_type='deadline',
            priority='urgent' if days_left <= 7 else 'high',
            related_entity_id=entity_id
        )
