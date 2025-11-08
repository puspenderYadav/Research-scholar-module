#!/usr/bin/env python3
"""
Script to check supervisor employee IDs
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Supervisor

def check_supervisors():
    """Check supervisor employee IDs"""

    app = create_app('development')

    with app.app_context():
        print("Supervisors in Database")
        print("=" * 80)

        supervisors = Supervisor.query.all()

        if not supervisors:
            print("\nNo supervisors found in database!")
            return

        print(f"\nTotal Supervisors: {len(supervisors)}\n")

        for sup in supervisors:
            print(f"Employee ID: {sup.employee_id}")
            print(f"  Name: {sup.user.name if sup.user else 'N/A'}")
            print(f"  Email: {sup.user.email if sup.user else 'N/A'}")
            print(f"  Designation: {sup.designation}")
            print(f"  School: {sup.school.name if sup.school else 'N/A'}")
            print("-" * 80)

if __name__ == '__main__':
    try:
        check_supervisors()
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
