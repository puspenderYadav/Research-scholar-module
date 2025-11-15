"""
Create 4 schools with school chair accounts
This script will create the schools and their chairs with predefined credentials
"""
from app import create_app, db
from app.models.user import User
from app.models.school import School
from datetime import datetime

# School data
SCHOOLS = [
    {
        'name': 'School of Mathematical and Statistical Sciences',
        'code': 'SMSS',
        'chair_email': 'chair.smss@iitmandi.ac.in',
        'chair_name': 'SMSS Chair',
        'password': 'smss@123'
    },
    {
        'name': 'School of Mechanical and Materials Engineering',
        'code': 'SMME',
        'chair_email': 'chair.smme@iitmandi.ac.in',
        'chair_name': 'SMME Chair',
        'password': 'smme@123'
    },
    {
        'name': 'School of Computing and Electrical Engineering',
        'code': 'SCEE',
        'chair_email': 'chair.scee@iitmandi.ac.in',
        'chair_name': 'SCEE Chair',
        'password': 'scee@123'
    },
    {
        'name': 'School of Biosciences and Bioengineering',
        'code': 'SBB',
        'chair_email': 'chair.sbb@iitmandi.ac.in',
        'chair_name': 'SBB Chair',
        'password': 'sbb@123'
    }
]

def create_schools():
    """Create schools with their chairs"""
    app = create_app()

    with app.app_context():
        print("\n" + "="*70)
        print("CREATING SCHOOLS WITH CHAIR ACCOUNTS")
        print("="*70)

        created_count = 0
        skipped_count = 0

        for school_data in SCHOOLS:
            print(f"\n[{school_data['code']}] Processing {school_data['name']}...")

            # Check if school code already exists
            existing_school = School.query.filter_by(code=school_data['code']).first()
            if existing_school:
                if existing_school.is_deleted:
                    print(f"  WARNING: School {school_data['code']} exists but is deleted")
                    print(f"  Undeleting and updating school...")
                    existing_school.is_deleted = False
                    existing_school.deleted_at = None
                    existing_school.deleted_by = None
                    existing_school.name = school_data['name']

                    # Update chair if needed
                    if existing_school.chair:
                        existing_school.chair.is_active = True
                        existing_school.chair.set_password(school_data['password'])
                        print(f"  Updated existing chair: {existing_school.chair.email}")
                    else:
                        # Create new chair
                        chair = User(
                            email=school_data['chair_email'],
                            name=school_data['chair_name'],
                            role='school_chair',
                            is_active=True
                        )
                        chair.set_password(school_data['password'])
                        db.session.add(chair)
                        db.session.flush()
                        existing_school.chair_id = chair.id
                        print(f"  Created new chair: {chair.email}")

                    created_count += 1
                else:
                    print(f"  SKIPPED: School {school_data['code']} already exists")
                    print(f"  Chair: {existing_school.chair.email if existing_school.chair else 'No chair'}")
                    skipped_count += 1
                continue

            # Check if chair email already exists
            existing_chair = User.query.filter_by(email=school_data['chair_email']).first()
            if existing_chair:
                print(f"  Using existing chair account: {school_data['chair_email']}")
                # Update password and activate
                existing_chair.set_password(school_data['password'])
                existing_chair.is_active = True
                existing_chair.role = 'school_chair'
                chair = existing_chair
            else:
                # Create new chair account
                print(f"  Creating chair account: {school_data['chair_email']}")
                chair = User(
                    email=school_data['chair_email'],
                    name=school_data['chair_name'],
                    role='school_chair',
                    is_active=True
                )
                chair.set_password(school_data['password'])
                db.session.add(chair)
                db.session.flush()  # Get the chair ID

            # Create school
            print(f"  Creating school: {school_data['name']}")
            school = School(
                name=school_data['name'],
                code=school_data['code'],
                chair_id=chair.id,
                is_deleted=False
            )
            db.session.add(school)

            created_count += 1
            print(f"  SUCCESS: Created {school_data['code']}")

        # Commit all changes
        db.session.commit()

        print("\n" + "="*70)
        print("SUMMARY")
        print("="*70)
        print(f"Created/Updated: {created_count} schools")
        print(f"Skipped (already exists): {skipped_count} schools")
        print(f"Total: {len(SCHOOLS)} schools")

        print("\n" + "="*70)
        print("SCHOOL CHAIR CREDENTIALS")
        print("="*70)
        for school_data in SCHOOLS:
            print(f"\n{school_data['code']} - {school_data['name']}")
            print(f"  Email: {school_data['chair_email']}")
            print(f"  Password: {school_data['password']}")

        print("\n" + "="*70)
        print("DONE! Schools created successfully")
        print("="*70)

if __name__ == "__main__":
    create_schools()
