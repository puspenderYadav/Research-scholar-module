#!/usr/bin/env python3
"""
Script to check and verify Dean account credentials
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User

def check_dean_account():
    """Check if Dean account exists and verify credentials"""

    app = create_app('development')

    with app.app_context():
        print("Checking Dean Academics account...")
        print("=" * 60)

        # Find Dean user
        dean = User.query.filter_by(email='dean@university.edu').first()

        if not dean:
            print("\n[ERROR] Dean account NOT found!")
            print("\nCreating Dean account now...")

            # Create Dean account
            dean = User(
                email='dean@university.edu',
                name='Dr. Dean Academics',
                phone='9876543210',
                role='dean_academics',
                is_active=True
            )
            dean.set_password('dean123')
            db.session.add(dean)
            db.session.commit()

            print("\n[SUCCESS] Dean account created successfully!")
            print("\nCredentials:")
            print(f"  Email: dean@university.edu")
            print(f"  Password: dean123")
            print(f"  Role: {dean.role}")
        else:
            print("\n[SUCCESS] Dean account found!")
            print("\nAccount Details:")
            print(f"  ID: {dean.id}")
            print(f"  Email: {dean.email}")
            print(f"  Name: {dean.name}")
            print(f"  Role: {dean.role}")
            print(f"  Is Active: {dean.is_active}")

            # Test password
            print("\n" + "-" * 60)
            print("Testing password: 'dean123'")

            if dean.check_password('dean123'):
                print("[SUCCESS] Password is CORRECT!")
            else:
                print("[ERROR] Password is INCORRECT!")
                print("\nResetting password to 'dean123'...")
                dean.set_password('dean123')
                db.session.commit()
                print("[SUCCESS] Password has been reset!")

        print("\n" + "=" * 60)
        print("Login Credentials:")
        print("  Email: dean@university.edu")
        print("  Password: dean123")
        print("=" * 60)

if __name__ == '__main__':
    try:
        check_dean_account()
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
