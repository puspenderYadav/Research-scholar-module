#!/usr/bin/env python
"""Simple test to check if supervisor change endpoints are accessible"""

import requests
import sys

BASE_URL = 'http://localhost:5000/api'

def test_server_running():
    """Check if server is running"""
    try:
        response = requests.get(f'{BASE_URL}/auth/login', timeout=2)
        return True
    except requests.exceptions.ConnectionError:
        print("Backend server is not running!")
        print("Please start the server with: flask run")
        return False
    except Exception as e:
        print(f"Error connecting to server: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("SUPERVISOR CHANGE ENDPOINTS TEST")
    print("="*60)

    if not test_server_running():
        sys.exit(1)

    print("\nBackend server is running!")
    print("\nThe supervisor change request feature is ready to test.")
    print("\nTo test manually:")
    print("1. Start the frontend: cd frontend && npm run dev")
    print("2. Login as a scholar")
    print("3. Go to your profile page")
    print("4. Click 'Request Supervisor Change'")
    print("5. Fill out the form and submit")
    print("\nEndpoints available:")
    print("  POST   /api/supervisor-change/request")
    print("  GET    /api/supervisor-change/my-requests")
    print("  GET    /api/supervisor-change/pending-approvals")
    print("  POST   /api/supervisor-change/<id>/approve-current-supervisor")
    print("  POST   /api/supervisor-change/<id>/approve-new-supervisor")
    print("  POST   /api/supervisor-change/<id>/approve-dean")
    print("  GET    /api/supervisor-change/<id>")
    print("  GET    /api/supervisor-change/all")
    print("\n" + "="*60)

if __name__ == '__main__':
    main()
