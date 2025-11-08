import requests
import json

# Test AD Research login
url = "http://localhost:5000/api/auth/login"
data = {
    "email": "ad.research@university.edu",
    "password": "adresearch123",
    "role": "ad_research"
}

headers = {
    "Content-Type": "application/json"
}

print("Testing AD Research login...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")
print("\nSending request...\n")

try:
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200:
        print("\n✓ Login successful!")
    else:
        print(f"\n✗ Login failed: {response.json().get('error', 'Unknown error')}")
except Exception as e:
    print(f"✗ Error: {str(e)}")
