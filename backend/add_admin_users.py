"""
Script to add Dean and AD Research admin users
"""
from app import create_app, db, mail
from app.models import User
from werkzeug.security import generate_password_hash
from flask_mail import Message

def send_credentials_email(email, name, password, role):
    """Send credentials email to the user"""
    try:
        role_display = 'Dean of Academics' if role == 'dean_academics' else 'Associate Dean (Research)'
        msg = Message(
            subject=f'Your {role_display} Account Credentials - Research Portal',
            recipients=[email],
            body=f"""Dear {name},

Your {role_display} account has been created for the Research Scholars Management Portal.

Login Credentials:
-----------------
Email: {email}
Password: {password}
Role: {role_display}

You can log in at: http://localhost:3000

For security reasons, please change your password after your first login.

If you have any questions, please contact the administration.

Best regards,
Research Portal Team
"""
        )
        mail.send(msg)
        print(f"  Email sent to {email}")
        return True
    except Exception as e:
        print(f"  Failed to send email to {email}: {str(e)}")
        return False

def add_admin_users():
    """Add Dean and AD Research users"""
    app = create_app('development')

    with app.app_context():
        # Check if users already exist
        dean = User.query.filter_by(email='dean.academics@iitmandi.ac.in').first()
        ad_research = User.query.filter_by(email='ad.research@iitmandi.ac.in').first()

        if dean:
            print("Dean user already exists. Updating password...")
            dean.password_hash = generate_password_hash('Dean@123')
        else:
            print("Creating Dean user...")
            dean = User(
                email='dean.academics@iitmandi.ac.in',
                name='Dean Academics',
                password_hash=generate_password_hash('Dean@123'),
                role='dean_academics',
                is_active=True
            )
            db.session.add(dean)

        if ad_research:
            print("AD Research user already exists. Updating password...")
            ad_research.password_hash = generate_password_hash('AdResearch@123')
        else:
            print("Creating AD Research user...")
            ad_research = User(
                email='ad.research@iitmandi.ac.in',
                name='AD Research',
                password_hash=generate_password_hash('AdResearch@123'),
                role='ad_research',
                is_active=True
            )
            db.session.add(ad_research)

        db.session.commit()

        print("\nSending credential emails...")
        send_credentials_email(
            email='dean.academics@iitmandi.ac.in',
            name='Dean Academics',
            password='Dean@123',
            role='dean_academics'
        )
        send_credentials_email(
            email='ad.research@iitmandi.ac.in',
            name='AD Research',
            password='AdResearch@123',
            role='ad_research'
        )

        print("\nAdmin users added successfully!")
        print("\nCredentials:")
        print("1. Dean - dean.academics@iitmandi.ac.in / Dean@123")
        print("2. AD Research - ad.research@iitmandi.ac.in / AdResearch@123")

if __name__ == '__main__':
    add_admin_users()
