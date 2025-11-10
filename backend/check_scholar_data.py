"""Check scholar data and relationships"""
from app import create_app, db
from app.models.user import User
from app.models.scholar import Scholar
from app.models.committee import Committee, CommitteeMember

app = create_app()

with app.app_context():
    print("\n=== Checking Scholar Data ===\n")
    
    scholar1_user = User.query.filter_by(email='scholar1@university.edu').first()
    if scholar1_user:
        print(f"User: {scholar1_user.name} ({scholar1_user.email})")
        print(f"Role: {scholar1_user.role}")
        
        scholar = scholar1_user.scholar_profile
        if scholar:
            print(f"\n✅ Scholar Profile Exists")
            print(f"Enrollment: {scholar.enrollment_number}")
            print(f"Program: {scholar.program}")
            
            # Check supervisor
            if scholar.supervisor:
                print(f"\n✅ Supervisor Assigned: {scholar.supervisor.user.name}")
            else:
                print(f"\n❌ NO SUPERVISOR ASSIGNED")
            
            # Check committee
            committee = Committee.query.filter_by(scholar_id=scholar.id).first()
            if committee:
                print(f"\n✅ Committee Exists (ID: {committee.id})")
                members = CommitteeMember.query.filter_by(committee_id=committee.id).all()
                print(f"Committee Members: {len(members)}")
                for member in members:
                    print(f"  - {member.supervisor.user.name} ({member.member_type})")
            else:
                print(f"\n❌ NO COMMITTEE ASSIGNED")
        else:
            print(f"\n❌ No scholar profile found")
    else:
        print("❌ scholar1@university.edu not found")
