"""Reset database and seed with correct data"""
from app import create_app, db
from app.models.user import User
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from app.models.school import School
from app.models.committee import Committee, CommitteeMember
from datetime import date, timedelta

app = create_app()

with app.app_context():
    print("Clearing existing data...")
    
    # Delete all data (in correct order to avoid foreign key constraints)
    CommitteeMember.query.delete()
    Committee.query.delete()
    Scholar.query.delete()
    Supervisor.query.delete()
    
    # Clear school chair references first
    for school in School.query.all():
        school.chair_id = None
    db.session.flush()
    
    User.query.delete()
    School.query.delete()
    
    db.session.commit()
    print("✅ Data cleared")
    
    print("\nSeeding database...")

    # Create schools
    schools = [
        School(name='School of Computer Science', code='CS'),
        School(name='School of Engineering', code='ENG'),
        School(name='School of Life Sciences', code='LS')
    ]
    db.session.add_all(schools)
    db.session.flush()
    print("✅ Schools created")

    # Create Dean Academics
    dean = User(email='dean@university.edu', name='Dr. Dean Academics', role='dean_academics', is_active=True)
    dean.set_password('password123')
    db.session.add(dean)

    # Create AD Research
    ad_research = User(email='ad.research@university.edu', name='Dr. AD Research', role='ad_research', is_active=True)
    ad_research.set_password('password123')
    db.session.add(ad_research)

    # Create School Chair
    school_chair = User(email='chair.cs@university.edu', name='Dr. School Chair', role='school_chair', is_active=True)
    school_chair.set_password('password123')
    db.session.add(school_chair)
    db.session.flush()

    schools[0].chair_id = school_chair.id
    print("✅ Admin users created")

    # Create Supervisors
    supervisor1_user = User(email='supervisor1@university.edu', name='Dr. John Supervisor', phone='1234567890', role='supervisor', is_active=True)
    supervisor1_user.set_password('password123')
    db.session.add(supervisor1_user)
    db.session.flush()

    supervisor1 = Supervisor(
        user_id=supervisor1_user.id,
        employee_id='EMP001',
        designation='Professor',
        school_id=schools[0].id,
        specialization='Machine Learning, Data Science',
        is_accepting_students=True
    )
    db.session.add(supervisor1)

    supervisor2_user = User(email='supervisor2@university.edu', name='Dr. Jane Smith', phone='0987654321', role='supervisor', is_active=True)
    supervisor2_user.set_password('password123')
    db.session.add(supervisor2_user)
    db.session.flush()

    supervisor2 = Supervisor(
        user_id=supervisor2_user.id,
        employee_id='EMP002',
        designation='Associate Professor',
        school_id=schools[0].id,
        specialization='Computer Networks, IoT',
        is_accepting_students=True
    )
    db.session.add(supervisor2)
    db.session.flush()
    print("✅ Supervisors created")

    # Create Scholars
    scholar1_user = User(email='scholar1@university.edu', name='Alice Johnson', phone='1112223333', role='scholar', is_active=True)
    scholar1_user.set_password('password123')
    db.session.add(scholar1_user)
    db.session.flush()

    scholar1 = Scholar(
        user_id=scholar1_user.id,
        enrollment_number='PHD2023001',
        program='PhD',
        school_id=schools[0].id,
        admission_date=date.today() - timedelta(days=365),
        supervisor_id=supervisor1.id,
        research_area='Deep Learning',
        thesis_title='Advanced Neural Network Architectures for Computer Vision',
        status='active'
    )
    db.session.add(scholar1)

    scholar2_user = User(email='scholar2@university.edu', name='Bob Smith', phone='4445556666', role='scholar', is_active=True)
    scholar2_user.set_password('password123')
    db.session.add(scholar2_user)
    db.session.flush()

    scholar2 = Scholar(
        user_id=scholar2_user.id,
        enrollment_number='MSC2024001',
        program='MSc',
        school_id=schools[0].id,
        admission_date=date.today() - timedelta(days=180),
        supervisor_id=supervisor2.id,
        research_area='Network Security',
        thesis_title='Blockchain-based Security Framework for IoT Networks',
        status='active'
    )
    db.session.add(scholar2)
    db.session.flush()
    print("✅ Scholars created")

    # Create Committee for PhD scholar
    committee1 = Committee(scholar_id=scholar1.id)
    db.session.add(committee1)
    db.session.flush()

    dc_member1 = CommitteeMember(
        committee_id=committee1.id,
        supervisor_id=supervisor2.id,
        member_type='DC'
    )
    db.session.add(dc_member1)

    db.session.commit()
    print("✅ Committees created")
    
    print("\n" + "="*50)
    print("Database seeded successfully!")
    print("="*50)
    print("\n=== Test Credentials ===")
    print("All users have password: password123")
    print("\nDean: dean@university.edu")
    print("AD Research: ad.research@university.edu")
    print("School Chair: chair.cs@university.edu")
    print("Supervisor 1: supervisor1@university.edu")
    print("Supervisor 2: supervisor2@university.edu")
    print("Scholar 1 (PhD): scholar1@university.edu")
    print("Scholar 2 (MSc): scholar2@university.edu")
    print("="*50)
