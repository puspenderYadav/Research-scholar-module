"""
Script to reset scholar passwords and display credentials
"""
from app import create_app, db
from app.models import User, Scholar

def reset_scholar_passwords():
    """Reset all scholar passwords to a known password"""
    app = create_app('development')

    with app.app_context():
        # Get all scholars
        scholars = Scholar.query.all()

        if not scholars:
            print("No scholars found in the database.")
            return

        print(f"Found {len(scholars)} scholars")
        print("\n" + "=" * 120)
        print("SCHOLAR CREDENTIALS")
        print("=" * 120)

        # Reset password for each scholar
        reset_count = 0
        for scholar in scholars:
            user = scholar.user
            if user:
                # Reset password to enrollment_number@123
                new_password = f"{scholar.enrollment_number}@123"
                user.set_password(new_password)
                reset_count += 1

        db.session.commit()

        print(f"\nReset passwords for {reset_count} scholars")
        print("\n" + "-" * 120)

        # Display credentials grouped by program
        phd_scholars = [s for s in scholars if s.program == 'PhD']
        msc_scholars = [s for s in scholars if s.program == 'M.Sc. (Research)']

        if phd_scholars:
            print("\nPHD SCHOLARS:")
            print("-" * 120)
            for scholar in phd_scholars:
                user = scholar.user
                supervisor_name = scholar.supervisor.user.name if scholar.supervisor else 'Not assigned'
                school_code = scholar.school.code if scholar.school else 'N/A'
                
                print(f"{scholar.enrollment_number} | {user.name:25} | {school_code:8} | {supervisor_name:25}")
                print(f"         Email: {user.email}")
                print(f"         Password: {scholar.enrollment_number}@123")
                print(f"         Research: {scholar.research_area or 'Not specified'}")
                print(f"         Status: {scholar.status}")
                print("-" * 120)

        if msc_scholars:
            print("\nM.SC. (RESEARCH) SCHOLARS:")
            print("-" * 120)
            for scholar in msc_scholars:
                user = scholar.user
                supervisor_name = scholar.supervisor.user.name if scholar.supervisor else 'Not assigned'
                school_code = scholar.school.code if scholar.school else 'N/A'
                
                print(f"{scholar.enrollment_number} | {user.name:25} | {school_code:8} | {supervisor_name:25}")
                print(f"         Email: {user.email}")
                print(f"         Password: {scholar.enrollment_number}@123")
                print(f"         Research: {scholar.research_area or 'Not specified'}")
                print(f"         Status: {scholar.status}")
                print("-" * 120)

        print("\n" + "=" * 120)
        print("All scholar passwords have been reset to: [ENROLLMENT_NUMBER]@123")
        print("Example: D2024PHD001@123")
        print("=" * 120)

if __name__ == '__main__':
    reset_scholar_passwords()
