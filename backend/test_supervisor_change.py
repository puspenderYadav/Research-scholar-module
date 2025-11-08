#!/usr/bin/env python
"""Test script for supervisor change workflow"""

import requests
import json

BASE_URL = 'http://localhost:5000/api'

def print_response(response, title):
    """Pretty print response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*60}\n")

def test_workflow():
    """Test the complete supervisor change workflow"""

    # Step 1: Login as scholar
    print("\n🔐 Step 1: Login as Scholar")
    scholar_login = requests.post(f'{BASE_URL}/auth/login', json={
        'email': 'scholar1@test.com',
        'password': 'password123'
    })
    print_response(scholar_login, "Scholar Login")

    if scholar_login.status_code != 200:
        print("❌ Scholar login failed!")
        return

    scholar_token = scholar_login.json()['access_token']
    scholar_headers = {'Authorization': f'Bearer {scholar_token}'}

    # Step 2: Get scholar profile to find current supervisor
    print("\n👤 Step 2: Get Scholar Profile")
    profile = requests.get(f'{BASE_URL}/scholars/my-profile', headers=scholar_headers)
    print_response(profile, "Scholar Profile")

    if profile.status_code != 200:
        print("❌ Failed to get profile!")
        return

    current_supervisor_id = profile.json().get('supervisor_id')
    print(f"✅ Current supervisor ID: {current_supervisor_id}")

    # Step 3: Get list of supervisors
    print("\n📋 Step 3: Get Available Supervisors")
    supervisors = requests.get(f'{BASE_URL}/supervisors', headers=scholar_headers)
    print_response(supervisors, "Available Supervisors")

    if supervisors.status_code != 200:
        print("❌ Failed to get supervisors!")
        return

    # Find a different supervisor
    new_supervisor_id = None
    for sup in supervisors.json():
        if sup['id'] != current_supervisor_id and sup.get('is_accepting_students', False):
            new_supervisor_id = sup['id']
            break

    if not new_supervisor_id:
        print("❌ No available supervisor found for change!")
        return

    print(f"✅ Selected new supervisor ID: {new_supervisor_id}")

    # Step 4: Submit supervisor change request
    print("\n📝 Step 4: Submit Supervisor Change Request")
    request_data = {
        'new_supervisor_id': new_supervisor_id,
        'reason': 'I would like to change my research direction to focus more on the new supervisor\'s area of expertise.',
        'additional_comments': 'This change aligns better with my research interests and career goals.'
    }

    change_request = requests.post(
        f'{BASE_URL}/supervisor-change/request',
        headers=scholar_headers,
        json=request_data
    )
    print_response(change_request, "Supervisor Change Request")

    if change_request.status_code != 201:
        print("❌ Failed to submit request!")
        return

    request_id = change_request.json()['request']['id']
    print(f"✅ Request created with ID: {request_id}")

    # Step 5: Get scholar's requests
    print("\n📊 Step 5: Get Scholar's Request History")
    my_requests = requests.get(f'{BASE_URL}/supervisor-change/my-requests', headers=scholar_headers)
    print_response(my_requests, "My Requests")

    # Step 6: Login as current supervisor
    print("\n🔐 Step 6: Login as Current Supervisor")
    supervisor_login = requests.post(f'{BASE_URL}/auth/login', json={
        'email': 'supervisor1@test.com',
        'password': 'password123'
    })
    print_response(supervisor_login, "Current Supervisor Login")

    if supervisor_login.status_code != 200:
        print("❌ Supervisor login failed!")
        return

    supervisor_token = supervisor_login.json()['access_token']
    supervisor_headers = {'Authorization': f'Bearer {supervisor_token}'}

    # Step 7: Get pending approvals for current supervisor
    print("\n📋 Step 7: Get Pending Approvals for Current Supervisor")
    pending = requests.get(f'{BASE_URL}/supervisor-change/pending-approvals', headers=supervisor_headers)
    print_response(pending, "Pending Approvals")

    # Step 8: Current supervisor approves
    print("\n✅ Step 8: Current Supervisor Approves Request")
    approval_data = {
        'action': 'approve',
        'comment': 'I support this change. The new supervisor is better suited for this research direction.'
    }

    current_approval = requests.post(
        f'{BASE_URL}/supervisor-change/{request_id}/approve-current-supervisor',
        headers=supervisor_headers,
        json=approval_data
    )
    print_response(current_approval, "Current Supervisor Approval")

    # Step 9: Login as new supervisor
    print("\n🔐 Step 9: Login as New Supervisor")
    new_supervisor_login = requests.post(f'{BASE_URL}/auth/login', json={
        'email': 'supervisor2@test.com',
        'password': 'password123'
    })
    print_response(new_supervisor_login, "New Supervisor Login")

    if new_supervisor_login.status_code != 200:
        print("❌ New supervisor login failed!")
        return

    new_supervisor_token = new_supervisor_login.json()['access_token']
    new_supervisor_headers = {'Authorization': f'Bearer {new_supervisor_token}'}

    # Step 10: Get pending approvals for new supervisor
    print("\n📋 Step 10: Get Pending Approvals for New Supervisor")
    new_pending = requests.get(f'{BASE_URL}/supervisor-change/pending-approvals', headers=new_supervisor_headers)
    print_response(new_pending, "New Supervisor Pending Approvals")

    # Step 11: New supervisor approves
    print("\n✅ Step 11: New Supervisor Approves Request")
    new_approval = requests.post(
        f'{BASE_URL}/supervisor-change/{request_id}/approve-new-supervisor',
        headers=new_supervisor_headers,
        json=approval_data
    )
    print_response(new_approval, "New Supervisor Approval")

    # Step 12: Login as dean
    print("\n🔐 Step 12: Login as Dean Academics")
    dean_login = requests.post(f'{BASE_URL}/auth/login', json={
        'email': 'dean@test.com',
        'password': 'password123'
    })
    print_response(dean_login, "Dean Login")

    if dean_login.status_code != 200:
        print("❌ Dean login failed!")
        return

    dean_token = dean_login.json()['access_token']
    dean_headers = {'Authorization': f'Bearer {dean_token}'}

    # Step 13: Get pending approvals for dean
    print("\n📋 Step 13: Get Pending Approvals for Dean")
    dean_pending = requests.get(f'{BASE_URL}/supervisor-change/pending-approvals', headers=dean_headers)
    print_response(dean_pending, "Dean Pending Approvals")

    # Step 14: Dean gives final approval
    print("\n✅ Step 14: Dean Gives Final Approval")
    dean_approval_data = {
        'action': 'approve',
        'comment': 'Final approval granted. Supervisor change is now complete.'
    }

    dean_approval = requests.post(
        f'{BASE_URL}/supervisor-change/{request_id}/approve-dean',
        headers=dean_headers,
        json=dean_approval_data
    )
    print_response(dean_approval, "Dean Final Approval")

    # Step 15: Verify scholar's supervisor has changed
    print("\n🔍 Step 15: Verify Supervisor Change in Scholar Profile")
    updated_profile = requests.get(f'{BASE_URL}/scholars/my-profile', headers=scholar_headers)
    print_response(updated_profile, "Updated Scholar Profile")

    if updated_profile.status_code == 200:
        new_sup_id = updated_profile.json().get('supervisor_id')
        if new_sup_id == new_supervisor_id:
            print(f"✅ SUCCESS! Supervisor changed from {current_supervisor_id} to {new_supervisor_id}")
        else:
            print(f"❌ FAILED! Supervisor is still {new_sup_id}, expected {new_supervisor_id}")

    print("\n" + "="*60)
    print("🎉 TEST WORKFLOW COMPLETED!")
    print("="*60)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🧪 SUPERVISOR CHANGE WORKFLOW TEST")
    print("="*60)
    print("\nThis script tests the complete supervisor change workflow:")
    print("1. Scholar submits request")
    print("2. Current supervisor approves")
    print("3. New supervisor approves")
    print("4. Dean gives final approval")
    print("5. Supervisor is changed in database")

    try:
        test_workflow()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
