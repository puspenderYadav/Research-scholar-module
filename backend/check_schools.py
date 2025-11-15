"""Quick script to check schools in database"""
import sys
sys.path.insert(0, '.')

from app import create_app, db
from app.models import School, Supervisor

app = create_app('development')

with app.app_context():
    print("\n=== Schools in Database ===")
    schools = School.query.all()
    for school in schools:
        print(f"Code: {school.code}, Name: {school.name}, ID: {school.id}")

    print("\n=== Supervisors in Database ===")
    supervisors = Supervisor.query.all()
    for sup in supervisors:
        print(f"Employee ID: {sup.employee_id}, Name: {sup.user.name}, School: {sup.school.code}")
