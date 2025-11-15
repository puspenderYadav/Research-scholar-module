#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Research Scholars Management Portal - Main Application Entry Point
Updated: Email configuration for production deployment
"""
import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from app import create_app, db
from app.models import (
    User, Scholar, Supervisor, School, Committee, CommitteeMember,
    Exam, Seminar, Synopsis, ProgressReport, Thesis,
    TravelGrant, TravelGrantApproval, Notification, SupervisorChangeRequest,
    Leave, LeaveApproval, LeaveBalance, Meeting
)

# Create Flask application
app = create_app(os.getenv('FLASK_ENV', 'development'))


@app.shell_context_processor
def make_shell_context():
    """Make database models available in Flask shell"""
    return {
        'db': db,
        'User': User,
        'Scholar': Scholar,
        'Supervisor': Supervisor,
        'School': School,
        'Committee': Committee,
        'CommitteeMember': CommitteeMember,
        'Exam': Exam,
        'Seminar': Seminar,
        'Synopsis': Synopsis,
        'ProgressReport': ProgressReport,
        'Thesis': Thesis,
        'TravelGrant': TravelGrant,
        'TravelGrantApproval': TravelGrantApproval,
        'Notification': Notification,
        'SupervisorChangeRequest': SupervisorChangeRequest,
        'Leave': Leave,
        'LeaveApproval': LeaveApproval,
        'LeaveBalance': LeaveBalance,
        'Meeting': Meeting
    }


@app.cli.command()
def init_db():
    """Initialize the database"""
    db.create_all()
    print("Database initialized successfully!")


@app.cli.command()
def init_admin_accounts():
    """Initialize fixed admin accounts (Dean Academics and AD Research)"""
    print("Initializing admin accounts...")

    # Dean Academics
    dean_email = 'dean.academics@iitmandi.ac.in'
    dean = User.query.filter_by(email=dean_email).first()

    if not dean:
        dean = User(
            email=dean_email,
            name='Dean Academics',
            role='dean_academics',
            is_active=True
        )
        dean.set_password('Dean@123')
        db.session.add(dean)
        print(f"✓ Created Dean Academics account: {dean_email}")
    else:
        print(f"✓ Dean Academics account already exists: {dean_email}")

    # AD Research
    ad_research_email = 'ad.research@iitmandi.ac.in'
    ad_research = User.query.filter_by(email=ad_research_email).first()

    if not ad_research:
        ad_research = User(
            email=ad_research_email,
            name='AD Research',
            role='ad_research',
            is_active=True
        )
        ad_research.set_password('ADResearch@123')
        db.session.add(ad_research)
        print(f"✓ Created AD Research account: {ad_research_email}")
    else:
        print(f"✓ AD Research account already exists: {ad_research_email}")

    db.session.commit()
    print("\n=== Admin Account Credentials ===")
    print(f"Dean Academics: {dean_email} / Dean@123")
    print(f"AD Research: {ad_research_email} / ADResearch@123")
    print("\nAdmin accounts initialized successfully!")


@app.cli.command()
def seed_db():
    """Seed the database with sample data"""
    from datetime import date, timedelta

    print("Seeding database...")

    # Create schools
    schools = [
        School(name='School of Computer Science', code='CS'),
        School(name='School of Engineering', code='ENG'),
        School(name='School of Life Sciences', code='LS')
    ]
    db.session.add_all(schools)
    db.session.flush()

    # Create Dean Academics
    dean = User(email='dean.academics@iitmandi.ac.in', name='Dean Academics', role='dean_academics', is_active=True)
    dean.set_password('Dean@123')
    db.session.add(dean)

    # Create AD Research
    ad_research = User(email='ad.research@iitmandi.ac.in', name='AD Research', role='ad_research', is_active=True)
    ad_research.set_password('ADResearch@123')
    db.session.add(ad_research)

    # Create School Chair
    school_chair = User(email='chair.cs@university.edu', name='Dr. School Chair', role='school_chair', is_active=True)
    school_chair.set_password('password123')
    db.session.add(school_chair)
    db.session.flush()

    schools[0].chair_id = school_chair.id

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
    print("Database seeded successfully!")
    print("\n=== Test Credentials ===")
    print("Dean Academics: dean.academics@iitmandi.ac.in / Dean@123")
    print("AD Research: ad.research@iitmandi.ac.in / ADResearch@123")
    print("School Chair: chair.cs@university.edu / password123")
    print("Supervisor 1: supervisor1@university.edu / password123")
    print("Supervisor 2: supervisor2@university.edu / password123")
    print("Scholar 1 (PhD): scholar1@university.edu / password123")
    print("Scholar 2 (MSc): scholar2@university.edu / password123")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
