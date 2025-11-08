#!/usr/bin/env python3
"""Reset all users and create fresh ones"""
from app import create_app, db
from app.models.user import User
from app.models.scholar import Scholar
from app.models.supervisor import Supervisor
from app.models.school import School
from datetime import date, timedelta

app = create_app('development')

with app.app_context():
    print("Deleting all existing users, scholars, and supervisors...")

    # Delete in correct order to avoid foreign key constraints
    # Import all models that might have foreign keys
    from app.models.committee import Committee, CommitteeMember
    from app.models.exam import Exam
    from app.models.seminar import Seminar
    from app.models.synopsis import Synopsis
    from app.models.progress_report import ProgressReport
    from app.models.thesis import Thesis
    from app.models.travel_grant import TravelGrant, TravelGrantApproval
    from app.models.notification import Notification
    from app.models.supervisor_change_request import SupervisorChangeRequest

    # Delete all dependent data first
    CommitteeMember.query.delete()
    Committee.query.delete()
    Exam.query.delete()
    Seminar.query.delete()
    Synopsis.query.delete()
    ProgressReport.query.delete()
    Thesis.query.delete()
    TravelGrantApproval.query.delete()
    TravelGrant.query.delete()
    Notification.query.delete()
    SupervisorChangeRequest.query.delete()

    # Now delete scholars, supervisors, and users
    Scholar.query.delete()
    Supervisor.query.delete()

    # Clear school chair references before deleting users
    for school in School.query.all():
        school.chair_id = None
    db.session.flush()

    User.query.delete()

    db.session.commit()
    print("All users and related data deleted!")

    print("\nCreating fresh users...")

    # Get existing schools
    schools = School.query.all()
    if not schools:
        print("Error: No schools found. Please seed schools first.")
        exit(1)

    # Create Dean Academics
    dean = User(
        email='dean@university.edu',
        name='Dr. Dean Academics',
        role='dean_academics',
        is_active=True
    )
    dean.set_password('dean123')
    db.session.add(dean)

    # Create AD Research
    ad_research = User(
        email='ad.research@university.edu',
        name='Dr. AD Research',
        role='ad_research',
        is_active=True
    )
    ad_research.set_password('adresearch123')
    db.session.add(ad_research)

    # Create School Chair
    school_chair = User(
        email='chair.cs@university.edu',
        name='Dr. School Chair',
        role='school_chair',
        is_active=True
    )
    school_chair.set_password('chair123')
    db.session.add(school_chair)
    db.session.flush()

    # Update school with chair
    schools[0].chair_id = school_chair.id

    # Create Supervisors
    supervisor1_user = User(
        email='supervisor1@university.edu',
        name='Dr. John Supervisor',
        phone='1234567890',
        role='supervisor',
        is_active=True
    )
    supervisor1_user.set_password('supervisor123')
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

    supervisor2_user = User(
        email='supervisor2@university.edu',
        name='Dr. Jane Smith',
        phone='0987654321',
        role='supervisor',
        is_active=True
    )
    supervisor2_user.set_password('supervisor123')
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

    # Create Scholars
    scholar1_user = User(
        email='scholar1@university.edu',
        name='Alice Johnson',
        phone='1112223333',
        role='scholar',
        is_active=True
    )
    scholar1_user.set_password('scholar123')
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

    scholar2_user = User(
        email='scholar2@university.edu',
        name='Bob Smith',
        phone='4445556666',
        role='scholar',
        is_active=True
    )
    scholar2_user.set_password('scholar123')
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

    db.session.commit()

    print("\n=== Users Created Successfully! ===")
    print("\nLogin Credentials:")
    print("-" * 50)
    print("Dean Academics:")
    print("  Email: dean@university.edu")
    print("  Password: dean123")
    print()
    print("AD Research:")
    print("  Email: ad.research@university.edu")
    print("  Password: adresearch123")
    print()
    print("School Chair:")
    print("  Email: chair.cs@university.edu")
    print("  Password: chair123")
    print()
    print("Supervisor 1:")
    print("  Email: supervisor1@university.edu")
    print("  Password: supervisor123")
    print()
    print("Supervisor 2:")
    print("  Email: supervisor2@university.edu")
    print("  Password: supervisor123")
    print()
    print("Scholar 1 (PhD):")
    print("  Email: scholar1@university.edu")
    print("  Password: scholar123")
    print()
    print("Scholar 2 (MSc):")
    print("  Email: scholar2@university.edu")
    print("  Password: scholar123")
    print("-" * 50)
