"""
Script to add 5 schools with their chair users
"""
from app import create_app, db, mail
from app.models import User, School
from werkzeug.security import generate_password_hash
from flask_mail import Message

def send_credentials_email(email, name, password, school_code):
    """Send credentials email to the user"""
    try:
        msg = Message(
            subject='Your School Chair Account Credentials - Research Portal',
            recipients=[email],
            body=f"""Dear {name},

Your School Chair account has been created for the Research Scholars Management Portal.

Login Credentials:
-----------------
Email: {email}
Password: {password}
School Code: {school_code}

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

def add_schools():
    """Add 5 schools with their chair users"""
    app = create_app('development')

    with app.app_context():
        schools_data = [
            {
                'name': 'School of Biosciences and Bioengineering',
                'code': 'SBB',
                'email': 'chair.sbb@iitmandi.ac.in',
                'password': 'sbb@123',
                'chair_name': 'Chair SBB'
            },
            {
                'name': 'School of Mathematical & Statistical Science',
                'code': 'SMSS',
                'email': 'chair.smss@iitmandi.ac.in',
                'password': 'smss@123',
                'chair_name': 'Chair SMSS'
            },
            {
                'name': 'School of Mechanical and Materials Engineering',
                'code': 'SMME',
                'email': 'chair.smme@iitmandi.ac.in',
                'password': 'smme@123',
                'chair_name': 'Chair SMME'
            },
            {
                'name': 'School of Computing and Electrical Engineering',
                'code': 'SCEE',
                'email': 'chair.scee@iitmandi.ac.in',
                'password': 'scee@123',
                'chair_name': 'Chair SCEE'
            },
            {
                'name': 'School of Civil and Environmental Engineering',
                'code': 'SCENE',
                'email': 'chair.scene@iitmandi.ac.in',
                'password': 'scene@123',
                'chair_name': 'Chair SCENE'
            }
        ]

        for school_data in schools_data:
            # Check if school chair user already exists
            chair_user = User.query.filter_by(email=school_data['email']).first()

            if chair_user:
                print(f"Chair user {school_data['email']} already exists. Updating password...")
                chair_user.password_hash = generate_password_hash(school_data['password'])
            else:
                print(f"Creating chair user for {school_data['code']}...")
                chair_user = User(
                    email=school_data['email'],
                    name=school_data['chair_name'],
                    password_hash=generate_password_hash(school_data['password']),
                    role='school_chair',
                    is_active=True
                )
                db.session.add(chair_user)
                db.session.flush()  # Flush to get the user ID

            # Check if school already exists
            school = School.query.filter_by(code=school_data['code']).first()

            if school:
                print(f"School {school_data['code']} already exists. Updating chair...")
                school.chair_id = chair_user.id
                school.is_deleted = False
            else:
                print(f"Creating school {school_data['code']}...")
                school = School(
                    name=school_data['name'],
                    code=school_data['code'],
                    chair_id=chair_user.id
                )
                db.session.add(school)

        db.session.commit()

        print("\nSending credential emails...")
        for school_data in schools_data:
            send_credentials_email(
                email=school_data['email'],
                name=school_data['chair_name'],
                password=school_data['password'],
                school_code=school_data['code']
            )

        print("\nSchools and chair users added successfully!")
        print("\nSchool Chair Credentials:")
        for i, school_data in enumerate(schools_data, 1):
            print(f"{i}. {school_data['code']} - {school_data['email']} / {school_data['password']}")

if __name__ == '__main__':
    add_schools()
