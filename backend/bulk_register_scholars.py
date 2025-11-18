"""
Script to bulk register scholars from CSV file
"""
from app import create_app, db, mail
from app.models import User, Scholar, Supervisor, School
from app.utils.enrollment_generator import EnrollmentGenerator
from flask_mail import Message
from datetime import date
import csv
import secrets

def send_admission_email(personal_email, name, enrollment_number, password, program):
    """Send admission email with credentials"""
    try:
        msg = Message(
            subject='Admission Confirmation - Research Scholars Management Portal',
            recipients=[personal_email],
            body=f"""Dear {name},

Congratulations! You have been admitted to the {program} program at IIT Mandi.

Your admission details:
---------------------
Enrollment Number: {enrollment_number}
Program: {program}
Student Email (Login): {enrollment_number.lower()}@students.iitmandi.ac.in
Password: {password}

You can log in to the Research Scholars Management Portal at:
https://tvfnnfqc-3000.inc1.devtunnels.ms/

IMPORTANT:
- Use your enrollment number email ({enrollment_number.lower()}@students.iitmandi.ac.in) to log in
- This admission confirmation has been sent to your personal email
- Please change your password after your first login for security

Your supervisor and doctoral committee will be assigned shortly.

For any queries, please contact the Dean of Academics office.

Welcome to IIT Mandi!

Best regards,
Research Office
IIT Mandi
"""
        )
        mail.send(msg)
        print(f"  [EMAIL SENT] {personal_email}")
        return True
    except Exception as e:
        print(f"  [EMAIL FAILED] {personal_email}: {str(e)}")
        return False

def bulk_register_scholars():
    """Register scholars from CSV file"""
    app = create_app('development')

    with app.app_context():
        csv_file = 'scholars_bulk_registration.csv'

        print("=" * 80)
        print("BULK SCHOLAR REGISTRATION")
        print("=" * 80)

        # Read CSV file
        scholars_data = []
        with open(csv_file, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                scholars_data.append(row)

        print(f"\nFound {len(scholars_data)} scholars in CSV file")
        print("\nProcessing registrations...\n")

        created_count = 0
        skipped_count = 0

        for scholar_data in scholars_data:
            name = scholar_data['name']
            program = scholar_data['program']
            admission_year = int(scholar_data['admission_year'])
            research_area = scholar_data['research_area']
            phone = scholar_data['phone']
            personal_email = scholar_data['personal_email']
            school_code = scholar_data['school_code']
            supervisor_employee_id = scholar_data['supervisor_employee_id']

            # Get school
            school = School.query.filter_by(code=school_code).first()
            if not school:
                print(f"[SKIP] {name} - School {school_code} not found")
                skipped_count += 1
                continue

            # Get supervisor
            supervisor = Supervisor.query.filter_by(employee_id=supervisor_employee_id).first()
            if not supervisor:
                print(f"[SKIP] {name} - Supervisor {supervisor_employee_id} not found")
                skipped_count += 1
                continue

            # Generate enrollment number
            enrollment_number = EnrollmentGenerator.generate_enrollment_number(
                program,
                admission_year
            )

            # Create email and password
            student_email = f"{enrollment_number.lower()}@students.iitmandi.ac.in"
            password = f"{enrollment_number}@123"

            # Check if user already exists
            existing_user = User.query.filter_by(email=student_email).first()
            if existing_user:
                print(f"[SKIP] {name} ({enrollment_number}) - Already exists")
                skipped_count += 1
                continue

            print(f"[CREATE] {name} ({enrollment_number})...")

            # Create user
            user = User(
                email=student_email,
                name=name,
                phone=phone,
                role='scholar',
                is_active=True
            )
            user.set_password(password)

            db.session.add(user)
            db.session.flush()  # Get user.id

            # Create scholar profile
            scholar = Scholar(
                user_id=user.id,
                enrollment_number=enrollment_number,
                program=program,
                school_id=school.id,
                supervisor_id=supervisor.id,
                admission_date=date(admission_year, 7, 1),  # July 1st
                research_area=research_area,
                status='active'
            )

            db.session.add(scholar)

            # Store for email
            scholar_data['enrollment_number'] = enrollment_number
            scholar_data['student_email'] = student_email
            scholar_data['password'] = password
            scholar_data['supervisor_name'] = supervisor.user.name

            created_count += 1

        # Commit all changes
        db.session.commit()

        print(f"\n{'=' * 80}")
        print(f"Registration Summary:")
        print(f"  Created: {created_count}")
        print(f"  Skipped: {skipped_count}")
        print(f"{'=' * 80}\n")

        # Send admission emails
        if created_count > 0:
            print("Sending admission emails...\n")
            for scholar_data in scholars_data:
                if 'enrollment_number' in scholar_data:
                    send_admission_email(
                        personal_email=scholar_data['personal_email'],
                        name=scholar_data['name'],
                        enrollment_number=scholar_data['enrollment_number'],
                        password=scholar_data['password'],
                        program=scholar_data['program']
                    )

        # Print credentials
        print(f"\n{'=' * 80}")
        print("SCHOLAR CREDENTIALS")
        print(f"{'=' * 80}\n")

        # PhD scholars
        print("PhD SCHOLARS:")
        print("-" * 80)
        for scholar_data in scholars_data:
            if 'enrollment_number' in scholar_data and scholar_data['program'] == 'PhD':
                print(f"{scholar_data['enrollment_number']} | {scholar_data['name']:25} | {scholar_data['school_code']:6}")
                print(f"         Student Email: {scholar_data['student_email']}")
                print(f"         Password: {scholar_data['password']}")
                print(f"         Personal Email: {scholar_data['personal_email']}")
                print(f"         Supervisor: {scholar_data['supervisor_name']}")
                print(f"         Research: {scholar_data['research_area']}")
                print("-" * 80)

        # M.Sc. scholars
        print("\nM.SC. (RESEARCH) SCHOLARS:")
        print("-" * 80)
        for scholar_data in scholars_data:
            if 'enrollment_number' in scholar_data and scholar_data['program'] == 'M.Sc. (Research)':
                print(f"{scholar_data['enrollment_number']} | {scholar_data['name']:25} | {scholar_data['school_code']:6}")
                print(f"         Student Email: {scholar_data['student_email']}")
                print(f"         Password: {scholar_data['password']}")
                print(f"         Personal Email: {scholar_data['personal_email']}")
                print(f"         Supervisor: {scholar_data['supervisor_name']}")
                print(f"         Research: {scholar_data['research_area']}")
                print("-" * 80)

        print(f"\n{'=' * 80}")
        print("Registration completed! Now run assign_committees.py to assign DC and APC")
        print(f"{'=' * 80}\n")

if __name__ == '__main__':
    bulk_register_scholars()
