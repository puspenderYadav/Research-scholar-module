from flask import current_app
from flask_mail import Message
from app import mail
from app.models.user import User
from datetime import datetime

class EmailService:
    """Service for sending emails"""

    @staticmethod
    def send_email(to_email, subject, body, html_body=None):
        """
        Send an email

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: HTML body (optional)

        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            print(f"   Sending email to: {to_email}")
            print(f"   Subject: {subject}")
            print(f"   From: {current_app.config['MAIL_DEFAULT_SENDER']}")

            msg = Message(
                subject=subject,
                recipients=[to_email],
                body=body,
                html=html_body,
                sender=current_app.config['MAIL_DEFAULT_SENDER']
            )
            mail.send(msg)
            print(f"   SUCCESS: Email sent to {to_email}")
            return True
        except Exception as e:
            print(f"   ERROR sending email to {to_email}: {e}")
            import traceback
            traceback.print_exc()
            return False

    @staticmethod
    def send_notification_email(notification):
        """Send email for a notification"""
        user = User.query.get(notification.user_id)
        if not user or not user.email:
            return False

        subject = f"{current_app.config['APP_NAME']} - {notification.title}"

        body = f"""
Dear {user.name},

{notification.message}

---
This is an automated notification from {current_app.config['APP_NAME']}.
Login to view more details: {current_app.config['FRONTEND_URL']}

Priority: {notification.priority.upper()}
Type: {notification.notification_type}
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">{notification.title}</h2>
        <p>Dear {user.name},</p>
        <p>{notification.message}</p>

        {f'<p><a href="{current_app.config["FRONTEND_URL"]}{notification.action_link}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Details</a></p>' if notification.action_link else ''}

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
            This is an automated notification from {current_app.config['APP_NAME']}.<br>
            Priority: <strong>{notification.priority.upper()}</strong> | Type: {notification.notification_type}
        </p>
    </div>
</body>
</html>
"""

        success = EmailService.send_email(user.email, subject, body, html_body)

        if success:
            notification.email_sent = True
            notification.email_sent_at = datetime.utcnow()
            from app import db
            db.session.commit()

        return success

    @staticmethod
    def send_welcome_email(user, temporary_password):
        """Send welcome email to new user"""
        subject = f"Welcome to {current_app.config['APP_NAME']}"

        body = f"""
Dear {user.name},

Welcome to {current_app.config['APP_NAME']}!

Your account has been created with the following credentials:
Email: {user.email}
Temporary Password: {temporary_password}

Please login and change your password immediately.
Login URL: {current_app.config['FRONTEND_URL']}/login

Best regards,
{current_app.config['APP_NAME']} Team
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Welcome to {current_app.config['APP_NAME']}!</h2>
        <p>Dear {user.name},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 2px 5px; border-radius: 3px;">{temporary_password}</code></p>
        </div>
        <p style="color: #dc2626;"><strong>Important:</strong> Please change your password immediately after logging in.</p>
        <p><a href="{current_app.config['FRONTEND_URL']}/login" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Login Now</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
            If you have any questions, please contact the administrator.<br>
            {current_app.config['APP_NAME']} Team
        </p>
    </div>
</body>
</html>
"""

        return EmailService.send_email(user.email, subject, body, html_body)

    @staticmethod
    def send_scholar_credentials_email(scholar, personal_email, username, password, enrollment_number):
        """Send credentials email to newly admitted scholar"""
        subject = f"Welcome to {current_app.config['APP_NAME']} - Account Created"

        body = f"""
Dear {scholar.user.name},

Congratulations on your admission to {current_app.config['APP_NAME']}!

Your scholar account has been successfully created. Here are your login credentials:

Enrollment Number: {enrollment_number}
Username (Institute Email): {username}
Password: {password}

Program: {scholar.program}
School: {scholar.school.name if scholar.school else 'N/A'}
Supervisor: {scholar.supervisor.user.name if scholar.supervisor else 'Not Assigned'}

Please login using your institute email ({username}) as username and change your password immediately for security purposes.
Login URL: {current_app.config['FRONTEND_URL']}/login

Important: Keep your credentials secure and do not share them with anyone.

Best regards,
{current_app.config['APP_NAME']} Team
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to {current_app.config['APP_NAME']}!</h1>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear <strong>{scholar.user.name}</strong>,</p>
            <p>Congratulations on your admission! Your scholar account has been successfully created.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <h3 style="margin-top: 0; color: #2563eb;">Your Login Credentials</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Enrollment Number:</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">{enrollment_number}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Username (Institute Email):</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">{username}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Password:</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px; color: #dc2626;">{password}</code></td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0; color: #92400e; font-size: 16px;">Your Program Details</h3>
                <p style="margin: 5px 0;"><strong>Program:</strong> {scholar.program}</p>
                <p style="margin: 5px 0;"><strong>School:</strong> {scholar.school.name if scholar.school else 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Supervisor:</strong> {scholar.supervisor.user.name if scholar.supervisor else 'Not Assigned Yet'}</p>
                <p style="margin: 5px 0;"><strong>Admission Date:</strong> {scholar.admission_date.strftime('%B %d, %Y') if scholar.admission_date else 'N/A'}</p>
            </div>

            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="margin: 0; color: #991b1b;"><strong>⚠️ Important Security Notice:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #991b1b;">
                    <li>Change your password immediately after first login</li>
                    <li>Use your institute email ({username}) to login, not this personal email</li>
                    <li>Do not share your credentials with anyone</li>
                    <li>Keep your password secure</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{current_app.config['FRONTEND_URL']}/login" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Login to Your Account</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                If you have any questions or need assistance, please contact the academic office.<br>
                <strong>{current_app.config['APP_NAME']}</strong>
            </p>
        </div>
    </div>
</body>
</html>
"""

        return EmailService.send_email(personal_email, subject, body, html_body)

    @staticmethod
    def send_faculty_credentials_email(faculty_name, personal_email, institute_email, password, employee_id, designation, school_name):
        """Send credentials email to newly recruited faculty"""
        print(f"\n[EMAIL] Preparing to send faculty credentials email...")
        print(f"   To: {personal_email}")
        print(f"   Faculty: {faculty_name}")
        print(f"   Employee ID: {employee_id}")

        subject = f"Welcome to {current_app.config['APP_NAME']} - Faculty Account Created"

        body = f"""
Dear {faculty_name},

Welcome to {current_app.config['APP_NAME']}!

Your faculty account has been successfully created. Here are your login credentials:

Employee ID: {employee_id}
Designation: {designation}
School: {school_name}

Login Credentials:
Username (Institute Email): {institute_email}
Temporary Password: {password}

Please login using your institute email and change your password immediately for security purposes.
Login URL: {current_app.config['FRONTEND_URL']}/login

Important: Keep your credentials secure and do not share them with anyone.

Best regards,
{current_app.config['APP_NAME']} Team
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to {current_app.config['APP_NAME']}!</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Faculty Account Created</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear <strong>{faculty_name}</strong>,</p>
            <p>Welcome to our institution! Your faculty account has been successfully created.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <h3 style="margin-top: 0; color: #2563eb;">Your Login Credentials</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Employee ID:</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">{employee_id}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Username:</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">{institute_email}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Temporary Password:</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px; color: #dc2626;">{password}</code></td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="margin-top: 0; color: #065f46; font-size: 16px;">Your Profile Details</h3>
                <p style="margin: 5px 0;"><strong>Designation:</strong> {designation}</p>
                <p style="margin: 5px 0;"><strong>School:</strong> {school_name}</p>
                <p style="margin: 5px 0;"><strong>Institute Email:</strong> {institute_email}</p>
            </div>

            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="margin: 0; color: #991b1b;"><strong>⚠️ Important Security Notice:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #991b1b;">
                    <li>Change your password immediately after first login</li>
                    <li>Do not share your credentials with anyone</li>
                    <li>Use your institute email ({institute_email}) to login</li>
                    <li>Select "Supervisor/Faculty" as your role when logging in</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{current_app.config['FRONTEND_URL']}/login" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Login to Your Account</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                If you have any questions or need assistance, please contact the Dean's office.<br>
                <strong>{current_app.config['APP_NAME']}</strong>
            </p>
        </div>
    </div>
</body>
</html>
"""

        return EmailService.send_email(personal_email, subject, body, html_body)

    @staticmethod
    def send_school_chair_credentials_email(chair_name, chair_email, password, school_name):
        """Send credentials email to newly appointed school chair"""
        print(f"\n[EMAIL] Preparing to send school chair credentials email...")
        print(f"   To: {chair_email}")
        print(f"   Chair: {chair_name}")
        print(f"   School: {school_name}")

        subject = f"Welcome to {current_app.config['APP_NAME']} - School Chair Account Created"

        body = f"""
Dear {chair_name},

Welcome to {current_app.config['APP_NAME']}!

You have been appointed as the School Chair for {school_name}. Your account has been successfully created.

Login Credentials:
Email: {chair_email}
Temporary Password: {password}

Please login using your email and change your password immediately for security purposes.
Login URL: {current_app.config['FRONTEND_URL']}/login

Important: Keep your credentials secure and do not share them with anyone. Select "School Chair" as your role when logging in.

Best regards,
{current_app.config['APP_NAME']} Team
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #7c3aed; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to {current_app.config['APP_NAME']}!</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">School Chair Account Created</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear <strong>{chair_name}</strong>,</p>
            <p>Congratulations! You have been appointed as the <strong>School Chair</strong> for <strong>{school_name}</strong>.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed;">
                <h3 style="margin-top: 0; color: #7c3aed;">Your Login Credentials</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Email:</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">{chair_email}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Temporary Password:</strong></td>
                        <td style="padding: 8px 0;"><code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px; color: #dc2626;">{password}</code></td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #ede9fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
                <h3 style="margin-top: 0; color: #5b21b6; font-size: 16px;">Your Responsibilities</h3>
                <p style="margin: 5px 0;"><strong>School:</strong> {school_name}</p>
                <p style="margin: 5px 0;">As School Chair, you can manage faculty and students in your school.</p>
            </div>

            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="margin: 0; color: #991b1b;"><strong>⚠️ Important Security Notice:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #991b1b;">
                    <li>Change your password immediately after first login</li>
                    <li>Do not share your credentials with anyone</li>
                    <li>Select "School Chair" as your role when logging in</li>
                    <li>Use your email ({chair_email}) to login</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{current_app.config['FRONTEND_URL']}/login" style="display: inline-block; padding: 12px 30px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Login to Your Account</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                If you have any questions or need assistance, please contact the Dean's office.<br>
                <strong>{current_app.config['APP_NAME']}</strong>
            </p>
        </div>
    </div>
</body>
</html>
"""

        return EmailService.send_email(chair_email, subject, body, html_body)

    @staticmethod
    def send_suspension_email(scholar, start_date, end_date, reason):
        """Send email notification for scholar suspension"""
        subject = f"{current_app.config['APP_NAME']} - Account Suspension Notice"
        to_email = scholar.personal_email if scholar.personal_email else scholar.user.email

        body = f"""
Dear {scholar.user.name},

This is to inform you that your scholar account has been SUSPENDED.

Suspension Details:
Enrollment Number: {scholar.enrollment_number}
Start Date: {start_date.strftime('%B %d, %Y')}
End Date: {end_date.strftime('%B %d, %Y')}
Reason: {reason}

During this suspension period:
- Your account access has been temporarily disabled
- You will not be able to login to the portal
- All academic activities are suspended

Your account will be reviewed for reactivation after the suspension period ends.
If you believe this action was taken in error, please contact the Dean's office.

Best regards,
{current_app.config['APP_NAME']}
Dean of Academics
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Account Suspension Notice</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>{scholar.user.name}</strong>,</p>
            <p>Your scholar account has been <strong style="color: #dc2626;">SUSPENDED</strong>.</p>
            <p><strong>Enrollment:</strong> {scholar.enrollment_number}<br>
            <strong>Start:</strong> {start_date.strftime('%B %d, %Y')}<br>
            <strong>End:</strong> {end_date.strftime('%B %d, %Y')}<br>
            <strong>Reason:</strong> {reason}</p>
        </div>
    </div>
</body>
</html>
"""
        return EmailService.send_email(to_email, subject, body, html_body)

    @staticmethod
    def send_rustication_email(scholar, reason):
        """Send email notification for scholar rustication"""
        subject = f"{current_app.config['APP_NAME']} - Rustication Notice"
        to_email = scholar.personal_email if scholar.personal_email else scholar.user.email

        body = f"""
Dear {scholar.user.name},

This is to inform you that you have been RUSTICATED from {current_app.config['APP_NAME']}.

Rustication Details:
Enrollment Number: {scholar.enrollment_number}
Date: {scholar.rustication_date.strftime('%B %d, %Y')}
Reason: {reason}

Rustication means:
- Your enrollment has been permanently terminated
- Your account has been permanently deactivated
- You will not be able to login to the portal
- You are no longer a student of this institution

If you wish to appeal, please contact the Dean's office within 30 days.

Best regards,
{current_app.config['APP_NAME']}
Dean of Academics
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #991b1b; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Rustication Notice</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>{scholar.user.name}</strong>,</p>
            <p>You have been <strong style="color: #991b1b;">RUSTICATED</strong> from {current_app.config['APP_NAME']}.</p>
            <p><strong>Enrollment:</strong> {scholar.enrollment_number}<br>
            <strong>Date:</strong> {scholar.rustication_date.strftime('%B %d, %Y')}<br>
            <strong>Reason:</strong> {reason}</p>
        </div>
    </div>
</body>
</html>
"""
        return EmailService.send_email(to_email, subject, body, html_body)

    @staticmethod
    def send_reactivation_email(scholar):
        """Send email notification for scholar reactivation"""
        subject = f"{current_app.config['APP_NAME']} - Account Reactivated"
        to_email = scholar.personal_email if scholar.personal_email else scholar.user.email

        body = f"""
Dear {scholar.user.name},

Good news! Your scholar account has been REACTIVATED.

Account Details:
Enrollment Number: {scholar.enrollment_number}
Status: Active
Login URL: {current_app.config['FRONTEND_URL']}/login

Your account has been fully restored and you can now:
- Login to the portal
- Access all academic resources
- Resume your academic activities

If you have any questions, please contact the Dean's office.

Best regards,
{current_app.config['APP_NAME']}
Dean of Academics
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #059669; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Account Reactivated</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>{scholar.user.name}</strong>,</p>
            <p>Your scholar account has been <strong style="color: #059669;">REACTIVATED</strong>.</p>
            <p><strong>Enrollment:</strong> {scholar.enrollment_number}<br>
            <strong>Status:</strong> <span style="color: #059669;">Active</span></p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="{current_app.config['FRONTEND_URL']}/login" style="display: inline-block; padding: 12px 30px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">Login to Your Account</a>
            </div>
        </div>
    </div>
</body>
</html>
"""
        return EmailService.send_email(to_email, subject, body, html_body)


    @staticmethod
    def send_password_reset_email(user, reset_token):
        """Send password reset email with reset link"""
        subject = f"{current_app.config['APP_NAME']} - Password Reset Request"

        # Create reset link
        reset_link = f"{current_app.config['FRONTEND_URL']}/reset-password?token={reset_token}"

        body = f"""
Dear {user.name},

We received a request to reset your password for your {current_app.config['APP_NAME']} account.

Email: {user.email}
Role: {user.role}

To reset your password, click the link below:
{reset_link}

This link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
{current_app.config['APP_NAME']} Team
"""

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear <strong>{user.name}</strong>,</p>
            <p>We received a request to reset your password for your account.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <h3 style="margin-top: 0; color: #2563eb;">Account Details</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> {user.email}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> {user.role}</p>
            </div>

            <p>Click the button below to reset your password:</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">{reset_link}</p>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;"><strong>⚠️ Security Notice:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
                    <li>This link will expire in <strong>1 hour</strong></li>
                    <li>If you didn't request this reset, you can safely ignore this email</li>
                    <li>Your password won't change until you click the link and set a new one</li>
                </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                If you have any concerns about your account security, please contact support.<br>
                <strong>{current_app.config['APP_NAME']}</strong>
            </p>
        </div>
    </div>
</body>
</html>
"""

        return EmailService.send_email(user.email, subject, body, html_body)
