#!/usr/bin/env python3
"""
Script to delete test students created during CSV upload testing
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Scholar

def delete_test_students():
    """Delete test students by their email addresses"""

    app = create_app('development')

    with app.app_context():
        print("Deleting Test Students")
        print("=" * 80)

        test_emails = [
            'paridhimittal3106@gmail.com',
            'mparidhi110@gmail.com'
        ]

        deleted_count = 0

        for email in test_emails:
            user = User.query.filter_by(email=email).first()

            if user:
                print(f"\nFound user: {user.name} ({user.email})")

                # Find and delete associated scholar record
                scholar = Scholar.query.filter_by(user_id=user.id).first()
                if scholar:
                    print(f"  Enrollment: {scholar.enrollment_number}")
                    print(f"  Deleting scholar record...")
                    db.session.delete(scholar)

                print(f"  Deleting user account...")
                db.session.delete(user)
                deleted_count += 1
                print(f"  [SUCCESS] Deleted!")
            else:
                print(f"\n[INFO] User not found: {email}")

        if deleted_count > 0:
            db.session.commit()
            print("\n" + "=" * 80)
            print(f"[SUCCESS] Deleted {deleted_count} test student(s)")
            print("=" * 80)
        else:
            print("\n" + "=" * 80)
            print("[INFO] No test students found to delete")
            print("=" * 80)

if __name__ == '__main__':
    try:
        delete_test_students()
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
