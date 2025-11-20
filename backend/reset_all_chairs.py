"""
Reset all school chair passwords to a standard password
"""
from app import create_app, db
from app.models.user import User
from werkzeug.security import generate_password_hash

def reset_all_chair_passwords():
    """Reset all school chair passwords"""
    app = create_app('development')
    
    with app.app_context():
        # Get all school chairs
        chairs = User.query.filter_by(role='school_chair').all()
        
        if not chairs:
            print("No school chairs found in the database.")
            return
        
        # Standard password for all chairs
        standard_password = "Chair@123"
        
        print("\n" + "="*80)
        print("RESETTING SCHOOL CHAIR PASSWORDS")
        print("="*80)
        
        reset_count = 0
        for chair in chairs:
            chair.password_hash = generate_password_hash(standard_password)
            reset_count += 1
            print(f"✓ {chair.email} - {chair.name}")
        
        db.session.commit()
        
        print("\n" + "="*80)
        print(f"Successfully reset passwords for {reset_count} school chairs!")
        print("="*80)
        
        print("\nSchool Chair Credentials:")
        print("-"*80)
        for chair in chairs:
            print(f"Email: {chair.email}")
            print(f"Name: {chair.name}")
            print(f"Password: {standard_password}")
            print("-"*80)
        
        print("\n" + "="*80)
        print("All school chairs can now login with password: Chair@123")
        print("="*80)

if __name__ == '__main__':
    reset_all_chair_passwords()
