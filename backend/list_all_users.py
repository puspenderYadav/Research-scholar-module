#!/usr/bin/env python3
"""
Script to list all users in the database
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User

def list_all_users():
    """List all users in the database"""

    app = create_app('development')

    with app.app_context():
        print("All Users in Database")
        print("=" * 80)

        users = User.query.all()

        if not users:
            print("\nNo users found in database!")
            return

        print(f"\nTotal Users: {len(users)}\n")

        for user in users:
            print(f"ID: {user.id}")
            print(f"  Name: {user.name}")
            print(f"  Email: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  Active: {user.is_active}")
            print(f"  Phone: {user.phone or 'N/A'}")
            print("-" * 80)

        print("\n" + "=" * 80)
        print("Login Credentials for Testing:")
        print("=" * 80)
        print("\nDEAN ACADEMICS:")
        print("  Email: dean@university.edu")
        print("  Password: dean123")
        print("\nAD RESEARCH:")
        print("  Email: ad.research@university.edu")
        print("  Password: adresearch123")
        print("\nSCHOOL CHAIRS:")
        print("  Email: chair.cs@university.edu | Password: chair123")
        print("\nSUPERVISORS:")
        print("  Email: supervisor1@university.edu | Password: supervisor123")
        print("  Email: supervisor2@university.edu | Password: supervisor123")
        print("\nSCHOLARS:")
        print("  Email: scholar1@university.edu | Password: scholar123")
        print("  Email: scholar2@university.edu | Password: scholar123")
        print("=" * 80)

if __name__ == '__main__':
    try:
        list_all_users()
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
