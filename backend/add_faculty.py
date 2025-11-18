"""
Script to add 8 faculty members across 4 schools
"""
from app import create_app, db, mail
from app.models import User, Supervisor, School
from werkzeug.security import generate_password_hash
from flask_mail import Message
import secrets

def send_credentials_email(personal_email, institute_email, name, password, employee_id):
    """Send credentials email to the faculty member's personal email"""
    try:
        msg = Message(
            subject='Your Faculty Account Credentials - Research Portal',
            recipients=[personal_email],
            body=f"""Dear {name},

Your Faculty account has been created for the Research Scholars Management Portal.

Login Credentials:
-----------------
Institute Email (Login): {institute_email}
Password: {password}
Employee ID: {employee_id}

You can log in at: http://localhost:3000

IMPORTANT: Use your institute email ({institute_email}) to log in to the portal.
This password has been sent to your personal email for security purposes.

For security reasons, please change your password after your first login.

If you have any questions, please contact the administration.

Best regards,
Research Portal Team
"""
        )
        mail.send(msg)
        print(f"  Email sent to {personal_email}")
        return True
    except Exception as e:
        print(f"  Failed to send email to {personal_email}: {str(e)}")
        return False

def add_faculty():
    """Add 8 faculty members across 4 schools"""
    app = create_app('development')

    with app.app_context():
        # Get schools from database
        scee = School.query.filter_by(code='SCEE').first()
        sbb = School.query.filter_by(code='SBB').first()
        smme = School.query.filter_by(code='SMME').first()
        scene = School.query.filter_by(code='SCENE').first()

        if not all([scee, sbb, smme, scene]):
            print("Error: Not all schools found. Please run add_schools.py first.")
            return

        # Faculty data: 2 per school (SCEE, SBB, SMME, SCENE)
        faculty_data = [
            # SCEE Faculty
            {
                'name': 'Dr. Rajesh Kumar',
                'employee_id': 'SCEE001',
                'school_id': scee.id,
                'school_code': 'SCEE',
                'designation': 'Associate Professor',
                'specialization': 'Machine Learning, Artificial Intelligence, Computer Vision',
                'phone': '+91-9876543201',
                'personal_email': 'paridhimittal3106@gmail.com'
            },
            {
                'name': 'Dr. Priya Sharma',
                'employee_id': 'SCEE002',
                'school_id': scee.id,
                'school_code': 'SCEE',
                'designation': 'Assistant Professor',
                'specialization': 'VLSI Design, Embedded Systems, IoT',
                'phone': '+91-9876543202',
                'personal_email': 'paridhimittal3106@gmail.com'
            },
            # SBB Faculty
            {
                'name': 'Dr. Amit Patel',
                'employee_id': 'SBB001',
                'school_id': sbb.id,
                'school_code': 'SBB',
                'designation': 'Professor',
                'specialization': 'Molecular Biology, Genetic Engineering, Bioinformatics',
                'phone': '+91-9876543203',
                'personal_email': 'paridhimittal3106@gmail.com'
            },
            {
                'name': 'Dr. Sneha Verma',
                'employee_id': 'SBB002',
                'school_id': sbb.id,
                'school_code': 'SBB',
                'designation': 'Associate Professor',
                'specialization': 'Biomedical Engineering, Tissue Engineering, Biomaterials',
                'phone': '+91-9876543204',
                'personal_email': 'paridhimittal3106@gmail.com'
            },
            # SMME Faculty
            {
                'name': 'Dr. Vikram Singh',
                'employee_id': 'SMME001',
                'school_id': smme.id,
                'school_code': 'SMME',
                'designation': 'Professor',
                'specialization': 'Thermal Engineering, Renewable Energy, Heat Transfer',
                'phone': '+91-9876543205',
                'personal_email': 'paridhimittal3106@gmail.com'
            },
            {
                'name': 'Dr. Kavita Reddy',
                'employee_id': 'SMME002',
                'school_id': smme.id,
                'school_code': 'SMME',
                'designation': 'Assistant Professor',
                'specialization': 'Materials Science, Nanomaterials, Composite Materials',
                'phone': '+91-9876543206',
                'personal_email': 'paridhimittal3106@gmail.com'
            },
            # SCENE Faculty
            {
                'name': 'Dr. Arjun Mehta',
                'employee_id': 'SCENE001',
                'school_id': scene.id,
                'school_code': 'SCENE',
                'designation': 'Associate Professor',
                'specialization': 'Structural Engineering, Earthquake Engineering, Concrete Technology',
                'phone': '+91-9876543207',
                'personal_email': 'paridhimittal3106@gmail.com'
            },
            {
                'name': 'Dr. Deepika Iyer',
                'employee_id': 'SCENE002',
                'school_id': scene.id,
                'school_code': 'SCENE',
                'designation': 'Assistant Professor',
                'specialization': 'Environmental Engineering, Water Resources, Sustainable Development',
                'phone': '+91-9876543208',
                'personal_email': 'paridhimittal3106@gmail.com'
            }
        ]

        for faculty in faculty_data:
            # Generate email and password
            institute_email = f"{faculty['employee_id'].lower()}@iitmandi.ac.in"
            password = secrets.token_urlsafe(12)  # Generate random password

            # Check if user already exists
            existing_user = User.query.filter_by(email=institute_email).first()
            existing_supervisor = Supervisor.query.filter_by(employee_id=faculty['employee_id']).first()

            if existing_user or existing_supervisor:
                print(f"Faculty {faculty['employee_id']} already exists. Skipping...")
                continue

            print(f"Creating faculty: {faculty['name']} ({faculty['employee_id']})...")

            # Create user
            user = User(
                email=institute_email,
                name=faculty['name'],
                phone=faculty['phone'],
                role='supervisor',
                is_active=True
            )
            user.set_password(password)

            db.session.add(user)
            db.session.flush()  # Get user.id

            # Create supervisor profile
            supervisor = Supervisor(
                user_id=user.id,
                employee_id=faculty['employee_id'],
                designation=faculty['designation'],
                school_id=faculty['school_id'],
                specialization=faculty['specialization'],
                personal_email=faculty['personal_email'],
                max_phd_scholars=8,
                max_msc_scholars=5,
                is_accepting_students=True
            )

            db.session.add(supervisor)

            # Store password for email
            faculty['password'] = password
            faculty['institute_email'] = institute_email

        db.session.commit()

        print("\nSending credential emails...")
        for faculty in faculty_data:
            if 'password' in faculty:  # Only send email if newly created
                send_credentials_email(
                    personal_email=faculty['personal_email'],
                    institute_email=faculty['institute_email'],
                    name=faculty['name'],
                    password=faculty['password'],
                    employee_id=faculty['employee_id']
                )

        print("\nFaculty members added successfully!")
        print("\nFaculty Credentials:")
        print("=" * 80)
        for i, faculty in enumerate(faculty_data, 1):
            if 'password' in faculty:
                print(f"{i}. {faculty['name']} ({faculty['school_code']})")
                print(f"   Email: {faculty['institute_email']}")
                print(f"   Password: {faculty['password']}")
                print(f"   Employee ID: {faculty['employee_id']}")
                print(f"   Designation: {faculty['designation']}")
                print("-" * 80)

if __name__ == '__main__':
    add_faculty()
