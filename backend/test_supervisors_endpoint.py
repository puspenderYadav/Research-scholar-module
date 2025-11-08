#!/usr/bin/env python3
"""
Test script to check supervisors endpoint
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Supervisor

def test_supervisors_endpoint():
    """Test fetching all supervisors"""

    app = create_app('development')

    with app.app_context():
        print("Testing Supervisors Endpoint")
        print("=" * 80)

        supervisors = Supervisor.query.all()

        if not supervisors:
            print("\n[WARNING] No supervisors found in database!")
            return

        print(f"\nTotal Supervisors: {len(supervisors)}\n")

        for sup in supervisors:
            print(f"Supervisor ID: {sup.id}")
            print(f"  Employee ID: {sup.employee_id}")
            print(f"  User ID: {sup.user_id}")

            # Test to_dict() method
            try:
                sup_dict = sup.to_dict()
                print(f"  Name: {sup_dict['user']['name'] if sup_dict.get('user') else 'N/A'}")
                print(f"  Designation: {sup_dict.get('designation', 'N/A')}")
                print(f"  Specialization: {sup_dict.get('specialization', 'N/A')}")
                print(f"  [SUCCESS] to_dict() works!")
            except Exception as e:
                print(f"  [ERROR] to_dict() failed: {e}")
                import traceback
                traceback.print_exc()

            print("-" * 80)

if __name__ == '__main__':
    try:
        test_supervisors_endpoint()
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
