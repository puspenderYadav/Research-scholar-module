"""Test script to verify database users and login"""
from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    # Check if users exist
    print("\n=== Checking Database Users ===")
    users = User.query.all()
    print(f"Total users in database: {len(users)}")
    
    for user in users:
        print(f"\nEmail: {user.email}")
        print(f"Role: {user.role}")
        print(f"Active: {user.is_active}")
        
        # Test password
        test_pwd = 'password123'
        if user.check_password(test_pwd):
            print(f"✅ Password 'password123' works!")
        else:
            print(f"❌ Password 'password123' does NOT work")
    
    # Specifically check scholar1
    print("\n=== Testing scholar1@university.edu ===")
    scholar = User.query.filter_by(email='scholar1@university.edu').first()
    if scholar:
        print(f"User found: {scholar.name}")
        print(f"Role: {scholar.role}")
        print(f"Active: {scholar.is_active}")
        print(f"Password check: {scholar.check_password('password123')}")
    else:
        print("❌ scholar1@university.edu NOT FOUND in database!")
