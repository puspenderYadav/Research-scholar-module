"""
Update school chair email address
"""
import sys
from app import create_app, db
from app.models.user import User
from app.models.school import School

if len(sys.argv) < 3:
    print("Usage: python update_chair_email.py <school_code> <new_email>")
    print("Example: python update_chair_email.py SMSS chair.smss@iitmandi.ac.in")
    sys.exit(1)

school_code = sys.argv[1]
new_email = sys.argv[2]

app = create_app()

with app.app_context():
    print("\n" + "="*70)
    print("UPDATE SCHOOL CHAIR EMAIL")
    print("="*70)
    
    # Find the school
    school = School.query.filter_by(code=school_code.upper()).first()
    
    if not school:
        print(f"\nERROR: School with code '{school_code}' not found")
        sys.exit(1)
    
    if school.is_deleted:
        print(f"\nERROR: School '{school_code}' is deleted")
        sys.exit(1)
    
    print(f"\nSchool: {school.name} ({school.code})")
    
    if not school.chair:
        print("ERROR: School has no chair assigned")
        sys.exit(1)
    
    chair = school.chair
    old_email = chair.email
    
    print(f"Current chair email: {old_email}")
    print(f"New chair email: {new_email}")
    
    # Check if new email already exists
    existing_user = User.query.filter_by(email=new_email).first()
    if existing_user and existing_user.id != chair.id:
        print(f"\nERROR: Email '{new_email}' is already in use by another user")
        sys.exit(1)
    
    # Update email
    chair.email = new_email
    db.session.commit()
    
    print("\n" + "="*70)
    print("SUCCESS! Chair email updated")
    print("="*70)
    print(f"\nSchool: {school.name} ({school.code})")
    print(f"Chair: {chair.name}")
    print(f"Old Email: {old_email}")
    print(f"New Email: {new_email}")
    print(f"\nThe chair can now log in using: {new_email}")
    print("="*70)

