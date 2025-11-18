"""
Script to add 20 scholars (10 PhD + 10 M.Sc.) across schools and supervisors
"""
from app import create_app, db
from app.models import User, Scholar, Supervisor, School
from app.utils.enrollment_generator import EnrollmentGenerator
from datetime import datetime, date
import random

def add_scholars():
    """Add 20 scholars uniformly distributed across schools and supervisors"""
    app = create_app('development')

    with app.app_context():
        # Get all schools and supervisors
        schools = School.query.filter_by(is_deleted=False).all()
        supervisors = Supervisor.query.all()

        if not schools or not supervisors:
            print("Error: No schools or supervisors found. Please add them first.")
            return

        print(f"Found {len(schools)} schools and {len(supervisors)} supervisors")

        # Scholar data: 10 PhD + 10 M.Sc.
        scholars_data = [
            # PhD Scholars (10)
            {
                'name': 'Aarav Sharma',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Machine Learning and Deep Learning',
                'phone': '+91-9876540001'
            },
            {
                'name': 'Ananya Reddy',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Molecular Biology and Genetics',
                'phone': '+91-9876540002'
            },
            {
                'name': 'Arjun Patel',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Structural Engineering and Earthquake Analysis',
                'phone': '+91-9876540003'
            },
            {
                'name': 'Diya Kumar',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'VLSI Design and Embedded Systems',
                'phone': '+91-9876540004'
            },
            {
                'name': 'Ishaan Mehta',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Thermal Engineering and Renewable Energy',
                'phone': '+91-9876540005'
            },
            {
                'name': 'Kavya Singh',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Biomedical Engineering and Tissue Engineering',
                'phone': '+91-9876540006'
            },
            {
                'name': 'Rohan Verma',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Environmental Engineering and Water Treatment',
                'phone': '+91-9876540007'
            },
            {
                'name': 'Siya Gupta',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Computer Vision and Image Processing',
                'phone': '+91-9876540008'
            },
            {
                'name': 'Vihaan Joshi',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Materials Science and Nanomaterials',
                'phone': '+91-9876540009'
            },
            {
                'name': 'Anika Iyer',
                'program': 'PhD',
                'admission_year': 2024,
                'research_area': 'Bioinformatics and Computational Biology',
                'phone': '+91-9876540010'
            },
            # M.Sc. Scholars (10)
            {
                'name': 'Advait Nair',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Artificial Intelligence and Natural Language Processing',
                'phone': '+91-9876540011'
            },
            {
                'name': 'Myra Menon',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Genetic Engineering and Molecular Medicine',
                'phone': '+91-9876540012'
            },
            {
                'name': 'Reyansh Desai',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Concrete Technology and Sustainable Construction',
                'phone': '+91-9876540013'
            },
            {
                'name': 'Saanvi Pillai',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'IoT and Wireless Sensor Networks',
                'phone': '+91-9876540014'
            },
            {
                'name': 'Aditya Rao',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Heat Transfer and Energy Systems',
                'phone': '+91-9876540015'
            },
            {
                'name': 'Isha Chopra',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Biomaterials and Drug Delivery',
                'phone': '+91-9876540016'
            },
            {
                'name': 'Krish Bhat',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Water Resources and Hydrology',
                'phone': '+91-9876540017'
            },
            {
                'name': 'Navya Srinivasan',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Data Science and Big Data Analytics',
                'phone': '+91-9876540018'
            },
            {
                'name': 'Ayaan Khan',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Composite Materials and Manufacturing',
                'phone': '+91-9876540019'
            },
            {
                'name': 'Tara Krishnan',
                'program': 'M.Sc. (Research)',
                'admission_year': 2024,
                'research_area': 'Systems Biology and Proteomics',
                'phone': '+91-9876540020'
            }
        ]

        # Distribute scholars across supervisors
        supervisor_list = list(supervisors)

        created_count = 0
        for idx, scholar_data in enumerate(scholars_data):
            # Assign supervisor in round-robin fashion
            supervisor = supervisor_list[idx % len(supervisor_list)]

            # Generate enrollment number
            enrollment_number = EnrollmentGenerator.generate_enrollment_number(
                scholar_data['program'],
                scholar_data['admission_year']
            )

            # Create email and password
            email = f"{enrollment_number.lower()}@students.iitmandi.ac.in"
            password = f"{enrollment_number}@123"

            # Check if user already exists
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                print(f"Scholar {enrollment_number} already exists. Skipping...")
                continue

            print(f"Creating scholar: {scholar_data['name']} ({enrollment_number})...")

            # Create user
            user = User(
                email=email,
                name=scholar_data['name'],
                phone=scholar_data['phone'],
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
                program=scholar_data['program'],
                school_id=supervisor.school_id,
                supervisor_id=supervisor.id,
                admission_date=date(scholar_data['admission_year'], 7, 1),  # July 1st
                research_area=scholar_data['research_area'],
                status='active'
            )

            db.session.add(scholar)

            # Store for output
            scholar_data['enrollment_number'] = enrollment_number
            scholar_data['email'] = email
            scholar_data['password'] = password
            scholar_data['supervisor_name'] = supervisor.user.name
            scholar_data['school_code'] = School.query.get(supervisor.school_id).code

            created_count += 1

        db.session.commit()

        print(f"\n{created_count} scholars created successfully!")
        print("\n" + "=" * 100)
        print("SCHOLAR CREDENTIALS")
        print("=" * 100)

        # Print PhD scholars
        print("\nPHD SCHOLARS:")
        print("-" * 100)
        for scholar_data in scholars_data[:10]:
            if 'enrollment_number' in scholar_data:
                print(f"{scholar_data['enrollment_number']} | {scholar_data['name']:20} | {scholar_data['school_code']:6} | {scholar_data['supervisor_name']:20}")
                print(f"         Email: {scholar_data['email']}")
                print(f"         Password: {scholar_data['password']}")
                print(f"         Research: {scholar_data['research_area']}")
                print("-" * 100)

        # Print M.Sc. scholars
        print("\nM.SC. (RESEARCH) SCHOLARS:")
        print("-" * 100)
        for scholar_data in scholars_data[10:]:
            if 'enrollment_number' in scholar_data:
                print(f"{scholar_data['enrollment_number']} | {scholar_data['name']:20} | {scholar_data['school_code']:6} | {scholar_data['supervisor_name']:20}")
                print(f"         Email: {scholar_data['email']}")
                print(f"         Password: {scholar_data['password']}")
                print(f"         Research: {scholar_data['research_area']}")
                print("-" * 100)

if __name__ == '__main__':
    add_scholars()
