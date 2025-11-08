#!/usr/bin/env python3
"""
Script to reset all test user passwords
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User

def reset_passwords():
    """Reset passwords for all test users"""

    app = create_app('development')

    with app.app_context():
        print("Resetting Test User Passwords")
        print("=" * 80)

        # Define all test users and their passwords
        test_users = [
            ('dean@university.edu', 'dean123'),
            ('ad.research@university.edu', 'adresearch123'),
            ('chair.cs@university.edu', 'chair123'),
            ('chair.eng@university.edu', 'chair123'),
            ('chair.ls@university.edu', 'chair123'),
            ('supervisor1@university.edu', 'supervisor123'),
            ('supervisor2@university.edu', 'supervisor123'),
            ('supervisor3@university.edu', 'supervisor123'),
            ('supervisor4@university.edu', 'supervisor123'),
            ('scholar1@university.edu', 'scholar123'),
            ('scholar2@university.edu', 'scholar123'),
            ('scholar3@university.edu', 'scholar123'),
            ('scholar4@university.edu', 'scholar123'),
            ('scholar5@university.edu', 'scholar123'),
            ('scholar6@university.edu', 'scholar123'),
        ]

        reset_count = 0
        not_found = []

        for email, password in test_users:
            user = User.query.filter_by(email=email).first()
            if user:
                user.set_password(password)
                reset_count += 1
                print(f"[SUCCESS] Reset password for {email}")
            else:
                not_found.append(email)
                print(f"[WARNING] User not found: {email}")

        if reset_count > 0:
            db.session.commit()
            print("\n" + "=" * 80)
            print(f"[SUCCESS] Reset {reset_count} user password(s)")
            print("=" * 80)

        if not_found:
            print(f"\n[INFO] {len(not_found)} user(s) not found in database")

        print("\n=== UPDATED TEST CREDENTIALS ===\n")
        print("DEAN ACADEMICS:")
        print("  Email: dean@university.edu")
        print("  Password: dean123\n")

        print("AD RESEARCH (Research Office):")
        print("  Email: ad.research@university.edu")
        print("  Password: adresearch123\n")

        print("SCHOOL CHAIRS:")
        print("  Email: chair.cs@university.edu | Password: chair123")
        print("  Email: chair.eng@university.edu | Password: chair123")
        print("  Email: chair.ls@university.edu | Password: chair123\n")

        print("FACULTY/SUPERVISORS:")
        print("  Email: supervisor1@university.edu | Password: supervisor123")
        print("  Email: supervisor2@university.edu | Password: supervisor123")
        print("  Email: supervisor3@university.edu | Password: supervisor123")
        print("  Email: supervisor4@university.edu | Password: supervisor123\n")

        print("SCHOLARS:")
        print("  Email: scholar1@university.edu | Password: scholar123")
        print("  Email: scholar2@university.edu | Password: scholar123")
        print("  Email: scholar3@university.edu | Password: scholar123")
        print("  Email: scholar4@university.edu | Password: scholar123")
        print("  Email: scholar5@university.edu | Password: scholar123")
        print("  Email: scholar6@university.edu | Password: scholar123")

        print("\n" + "=" * 80)

if __name__ == '__main__':
    try:
        reset_passwords()
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
