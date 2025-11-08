#!/usr/bin/env python3
"""
Script to create comprehensive test profiles for all user roles
Roles: Scholar, Faculty/Supervisor, School Chair, Research Office (AD Research), Dean Academics
"""
import os
import sys
from datetime import date, timedelta

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Scholar, Supervisor, School, Committee, CommitteeMember

def create_test_profiles(clear_existing=False):
    """Create test profiles for all user roles"""

    app = create_app('development')

    with app.app_context():
        print("Creating test profiles for all user roles...")
        print("=" * 60)

        # Check if data already exists
        existing_users = User.query.count()
        if existing_users > 0:
            print(f"\nWarning: Database already contains {existing_users} users.")
            if clear_existing:
                print("Clearing existing data...")
                db.drop_all()
                db.create_all()
                print("Database reset complete.")
            else:
                print("Keeping existing data. Adding new profiles...")
                print("Use --clear flag to reset database.")

        # 1. CREATE SCHOOLS
        print("\n1. Creating Schools/Departments...")
        schools_data = [
            {'name': 'School of Computer Science', 'code': 'CS'},
            {'name': 'School of Engineering', 'code': 'ENG'},
            {'name': 'School of Life Sciences', 'code': 'LS'},
            {'name': 'School of Mathematics', 'code': 'MATH'},
            {'name': 'School of Physics', 'code': 'PHY'}
        ]

        schools = []
        for school_data in schools_data:
            school = School.query.filter_by(code=school_data['code']).first()
            if not school:
                school = School(**school_data)
                db.session.add(school)
                schools.append(school)
                print(f"   - Created: {school_data['name']}")
            else:
                schools.append(school)
                print(f"   - Already exists: {school_data['name']}")

        db.session.flush()

        # 2. CREATE DEAN ACADEMICS
        print("\n2. Creating Dean Academics Profile...")
        dean_user = User.query.filter_by(email='dean@university.edu').first()
        if not dean_user:
            dean_user = User(
                email='dean@university.edu',
                name='Dr. Rajesh Kumar',
                phone='9876543210',
                role='dean_academics',
                is_active=True
            )
            dean_user.set_password('dean123')
            db.session.add(dean_user)
            print(f"   - Created: {dean_user.name} (Dean Academics)")
            print(f"     Email: {dean_user.email} | Password: dean123")
        else:
            print(f"   - Already exists: {dean_user.name}")

        # 3. CREATE AD RESEARCH (RESEARCH OFFICE)
        print("\n3. Creating AD Research Profile...")
        ad_research_user = User.query.filter_by(email='ad.research@university.edu').first()
        if not ad_research_user:
            ad_research_user = User(
                email='ad.research@university.edu',
                name='Dr. Priya Sharma',
                phone='9876543211',
                role='ad_research',
                is_active=True
            )
            ad_research_user.set_password('adresearch123')
            db.session.add(ad_research_user)
            print(f"   - Created: {ad_research_user.name} (AD Research)")
            print(f"     Email: {ad_research_user.email} | Password: adresearch123")
        else:
            print(f"   - Already exists: {ad_research_user.name}")

        db.session.flush()

        # 4. CREATE SCHOOL CHAIRS
        print("\n4. Creating School Chair Profiles...")
        school_chairs_data = [
            {'email': 'chair.cs@university.edu', 'name': 'Dr. Amit Verma', 'school_idx': 0},
            {'email': 'chair.eng@university.edu', 'name': 'Dr. Sunita Reddy', 'school_idx': 1},
            {'email': 'chair.ls@university.edu', 'name': 'Dr. Vikram Singh', 'school_idx': 2}
        ]

        for chair_data in school_chairs_data:
            chair_user = User.query.filter_by(email=chair_data['email']).first()
            if not chair_user:
                chair_user = User(
                    email=chair_data['email'],
                    name=chair_data['name'],
                    phone=f"987654{32 + chair_data['school_idx']}0",
                    role='school_chair',
                    is_active=True
                )
                chair_user.set_password('chair123')
                db.session.add(chair_user)
                db.session.flush()

                # Link school chair to school
                schools[chair_data['school_idx']].chair_id = chair_user.id

                print(f"   - Created: {chair_user.name} (Chair of {schools[chair_data['school_idx']].name})")
                print(f"     Email: {chair_user.email} | Password: chair123")
            else:
                print(f"   - Already exists: {chair_user.name}")

        db.session.flush()

        # 5. CREATE FACULTY/SUPERVISORS
        print("\n5. Creating Faculty/Supervisor Profiles...")
        supervisors_data = [
            {
                'email': 'supervisor1@university.edu',
                'name': 'Dr. Arun Khanna',
                'phone': '9876544001',
                'employee_id': 'FAC001',
                'designation': 'Professor',
                'school_idx': 0,
                'specialization': 'Machine Learning, Artificial Intelligence, Deep Learning'
            },
            {
                'email': 'supervisor2@university.edu',
                'name': 'Dr. Meera Patel',
                'phone': '9876544002',
                'employee_id': 'FAC002',
                'designation': 'Associate Professor',
                'school_idx': 0,
                'specialization': 'Computer Networks, IoT, Cybersecurity'
            },
            {
                'email': 'supervisor3@university.edu',
                'name': 'Dr. Rohan Gupta',
                'phone': '9876544003',
                'employee_id': 'FAC003',
                'designation': 'Professor',
                'school_idx': 1,
                'specialization': 'Robotics, Control Systems, Automation'
            },
            {
                'email': 'supervisor4@university.edu',
                'name': 'Dr. Kavita Nair',
                'phone': '9876544004',
                'employee_id': 'FAC004',
                'designation': 'Assistant Professor',
                'school_idx': 2,
                'specialization': 'Genetics, Molecular Biology, Bioinformatics'
            }
        ]

        supervisors = []
        for sup_data in supervisors_data:
            sup_user = User.query.filter_by(email=sup_data['email']).first()
            if not sup_user:
                sup_user = User(
                    email=sup_data['email'],
                    name=sup_data['name'],
                    phone=sup_data['phone'],
                    role='supervisor',
                    is_active=True
                )
                sup_user.set_password('supervisor123')
                db.session.add(sup_user)
                db.session.flush()

                supervisor = Supervisor(
                    user_id=sup_user.id,
                    employee_id=sup_data['employee_id'],
                    designation=sup_data['designation'],
                    school_id=schools[sup_data['school_idx']].id,
                    specialization=sup_data['specialization'],
                    max_phd_scholars=8,
                    max_msc_scholars=5,
                    is_accepting_students=True
                )
                db.session.add(supervisor)
                supervisors.append(supervisor)

                print(f"   - Created: {sup_user.name} ({sup_data['designation']})")
                print(f"     Email: {sup_user.email} | Password: supervisor123")
                print(f"     School: {schools[sup_data['school_idx']].name}")
            else:
                supervisor = Supervisor.query.filter_by(user_id=sup_user.id).first()
                supervisors.append(supervisor)
                print(f"   - Already exists: {sup_user.name}")

        db.session.flush()

        # 6. CREATE SCHOLARS (PhD and MSc)
        print("\n6. Creating Scholar Profiles...")
        scholars_data = [
            {
                'email': 'scholar1@university.edu',
                'name': 'Arjun Mehta',
                'phone': '9876545001',
                'enrollment_number': 'PHD2023001',
                'program': 'PhD',
                'school_idx': 0,
                'supervisor_idx': 0,
                'co_supervisor_idx': None,
                'admission_days_ago': 365,
                'research_area': 'Deep Learning and Computer Vision',
                'thesis_title': 'Advanced Neural Network Architectures for Real-time Object Detection',
                'status': 'active'
            },
            {
                'email': 'scholar2@university.edu',
                'name': 'Priyanka Sharma',
                'phone': '9876545002',
                'enrollment_number': 'PHD2023002',
                'program': 'PhD',
                'school_idx': 0,
                'supervisor_idx': 1,
                'co_supervisor_idx': 0,
                'admission_days_ago': 400,
                'research_area': 'Network Security and Cryptography',
                'thesis_title': 'Blockchain-based Security Framework for IoT Networks',
                'status': 'active'
            },
            {
                'email': 'scholar3@university.edu',
                'name': 'Rahul Yadav',
                'phone': '9876545003',
                'enrollment_number': 'MSC2024001',
                'program': 'MSc',
                'school_idx': 0,
                'supervisor_idx': 0,
                'co_supervisor_idx': None,
                'admission_days_ago': 180,
                'research_area': 'Natural Language Processing',
                'thesis_title': 'Sentiment Analysis using Transformer Models',
                'status': 'active'
            },
            {
                'email': 'scholar4@university.edu',
                'name': 'Neha Singh',
                'phone': '9876545004',
                'enrollment_number': 'PHD2022001',
                'program': 'PhD',
                'school_idx': 1,
                'supervisor_idx': 2,
                'co_supervisor_idx': None,
                'admission_days_ago': 730,
                'research_area': 'Autonomous Robotics',
                'thesis_title': 'Machine Learning Approaches for Robotic Path Planning',
                'status': 'active'
            },
            {
                'email': 'scholar5@university.edu',
                'name': 'Karan Desai',
                'phone': '9876545005',
                'enrollment_number': 'MSC2024002',
                'program': 'MSc',
                'school_idx': 2,
                'supervisor_idx': 3,
                'co_supervisor_idx': None,
                'admission_days_ago': 150,
                'research_area': 'Computational Biology',
                'thesis_title': 'Gene Expression Analysis using Machine Learning',
                'status': 'active'
            },
            {
                'email': 'scholar6@university.edu',
                'name': 'Anjali Kapoor',
                'phone': '9876545006',
                'enrollment_number': 'PHD2021001',
                'program': 'PhD',
                'school_idx': 0,
                'supervisor_idx': 0,
                'co_supervisor_idx': None,
                'admission_days_ago': 1095,
                'research_area': 'Artificial Intelligence Ethics',
                'thesis_title': 'Fairness and Bias in AI Decision Systems',
                'status': 'active'
            }
        ]

        created_scholars = []
        for sch_data in scholars_data:
            # Check if scholar already exists by email or enrollment number
            sch_user = User.query.filter_by(email=sch_data['email']).first()
            existing_scholar = Scholar.query.filter_by(enrollment_number=sch_data['enrollment_number']).first()

            if not sch_user and not existing_scholar:
                sch_user = User(
                    email=sch_data['email'],
                    name=sch_data['name'],
                    phone=sch_data['phone'],
                    role='scholar',
                    is_active=True
                )
                sch_user.set_password('scholar123')
                db.session.add(sch_user)
                db.session.flush()

                scholar = Scholar(
                    user_id=sch_user.id,
                    enrollment_number=sch_data['enrollment_number'],
                    program=sch_data['program'],
                    school_id=schools[sch_data['school_idx']].id,
                    admission_date=date.today() - timedelta(days=sch_data['admission_days_ago']),
                    expected_completion_date=date.today() + timedelta(days=365 if sch_data['program'] == 'MSc' else 730),
                    supervisor_id=supervisors[sch_data['supervisor_idx']].id if sch_data['supervisor_idx'] is not None else None,
                    co_supervisor_id=supervisors[sch_data['co_supervisor_idx']].id if sch_data.get('co_supervisor_idx') is not None else None,
                    research_area=sch_data['research_area'],
                    thesis_title=sch_data['thesis_title'],
                    status=sch_data['status']
                )
                db.session.add(scholar)
                db.session.flush()
                created_scholars.append(scholar)

                print(f"   - Created: {sch_user.name} ({sch_data['program']} Scholar)")
                print(f"     Email: {sch_user.email} | Password: scholar123")
                print(f"     Enrollment: {sch_data['enrollment_number']}")
                if sch_data['supervisor_idx'] is not None:
                    print(f"     Supervisor: {supervisors[sch_data['supervisor_idx']].user.name}")
            else:
                if sch_user:
                    scholar = Scholar.query.filter_by(user_id=sch_user.id).first()
                else:
                    scholar = existing_scholar
                created_scholars.append(scholar)
                print(f"   - Already exists: {scholar.user.name if scholar else sch_data['name']}")

        db.session.flush()

        # 7. CREATE COMMITTEES FOR PhD SCHOLARS
        print("\n7. Creating Committees for PhD Scholars...")
        phd_scholars = [s for s in created_scholars if s and s.program == 'PhD']

        for i, scholar in enumerate(phd_scholars):
            if scholar:
                existing_committee = Committee.query.filter_by(scholar_id=scholar.id).first()
                if not existing_committee:
                    committee = Committee(scholar_id=scholar.id)
                    db.session.add(committee)
                    db.session.flush()

                    # Add DC member (different from supervisor)
                    dc_supervisor_idx = (i + 1) % len(supervisors)
                    if supervisors[dc_supervisor_idx].id != scholar.supervisor_id:
                        dc_member = CommitteeMember(
                            committee_id=committee.id,
                            supervisor_id=supervisors[dc_supervisor_idx].id,
                            member_type='DC'
                        )
                        db.session.add(dc_member)

                    print(f"   - Created committee for {scholar.user.name}")
                else:
                    print(f"   - Committee already exists for {scholar.user.name}")

        # COMMIT ALL CHANGES
        db.session.commit()

        print("\n" + "=" * 60)
        print("DATABASE SEEDED SUCCESSFULLY!")
        print("=" * 60)

        print("\n=== TEST CREDENTIALS ===\n")

        print("DEAN ACADEMICS:")
        print("  Email: dean@university.edu")
        print("  Password: dean123\n")

        print("AD RESEARCH (Research Office):")
        print("  Email: ad.research@university.edu")
        print("  Password: adresearch123\n")

        print("SCHOOL CHAIRS:")
        print("  Email: chair.cs@university.edu | Password: chair123")
        print("  Email: chair.eng@university.edu | Password: chair123")
        print("  Email: chair.ls@university.edu | Password: chair123\n")

        print("FACULTY/SUPERVISORS:")
        print("  Email: supervisor1@university.edu | Password: supervisor123")
        print("  Email: supervisor2@university.edu | Password: supervisor123")
        print("  Email: supervisor3@university.edu | Password: supervisor123")
        print("  Email: supervisor4@university.edu | Password: supervisor123\n")

        print("SCHOLARS:")
        print("  Email: scholar1@university.edu | Password: scholar123 (PhD)")
        print("  Email: scholar2@university.edu | Password: scholar123 (PhD)")
        print("  Email: scholar3@university.edu | Password: scholar123 (MSc)")
        print("  Email: scholar4@university.edu | Password: scholar123 (PhD)")
        print("  Email: scholar5@university.edu | Password: scholar123 (MSc)")
        print("  Email: scholar6@university.edu | Password: scholar123 (PhD)\n")

        print("=" * 60)
        print("You can now log in with any of these credentials!")
        print("=" * 60)

if __name__ == '__main__':
    try:
        # Check for --clear flag
        clear_existing = '--clear' in sys.argv
        create_test_profiles(clear_existing=clear_existing)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
