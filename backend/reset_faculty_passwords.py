"""
Script to reset faculty passwords to a known value for testing
"""
from app import create_app, db
from app.models import User, Supervisor

def reset_faculty_passwords():
    """Reset all faculty passwords to 'Faculty@123' for testing"""
    app = create_app('development')
    
    with app.app_context():
        # Get all supervisors
        supervisors = Supervisor.query.all()
        
        if not supervisors:
            print("No faculty members found in the database.")
            return
        
        # Password to set for all faculty
        test_password = "Faculty@123"
        
        print("Resetting faculty passwords...")
        print("=" * 80)
        
        reset_count = 0
        for supervisor in supervisors:
            user = User.query.get(supervisor.user_id)
            if user and user.role == 'supervisor':
                user.set_password(test_password)
                reset_count += 1
                print(f"✓ {supervisor.employee_id} - {user.name}")
                print(f"  Email: {user.email}")
                print(f"  Password: {test_password}")
                print("-" * 80)
        
        db.session.commit()
        
        print(f"\n✓ Successfully reset passwords for {reset_count} faculty members!")
        print(f"\nAll faculty can now login with password: {test_password}")
        print("\nFaculty Login Credentials:")
        print("=" * 80)
        
        # Print summary
        for supervisor in supervisors:
            user = User.query.get(supervisor.user_id)
            if user and user.role == 'supervisor':
                print(f"Email: {user.email} | Password: {test_password}")

if __name__ == '__main__':
    reset_faculty_passwords()
