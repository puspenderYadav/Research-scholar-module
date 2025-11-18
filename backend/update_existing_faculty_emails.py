"""
Script to update existing faculty with personal emails
"""
from app import create_app, db
from app.models import Supervisor

def update_faculty_emails():
    """Update existing faculty with personal emails"""
    app = create_app('development')

    with app.app_context():
        # Get all supervisors
        supervisors = Supervisor.query.all()

        if not supervisors:
            print("No faculty members found in database.")
            return

        print(f"Updating {len(supervisors)} faculty members with personal emails...")

        for supervisor in supervisors:
            # Set personal email to paridhimittal3106@gmail.com for all existing faculty
            supervisor.personal_email = 'paridhimittal3106@gmail.com'
            print(f"Updated {supervisor.employee_id} - Personal email set")

        db.session.commit()
        print("\nAll faculty members updated successfully!")

if __name__ == '__main__':
    update_faculty_emails()
