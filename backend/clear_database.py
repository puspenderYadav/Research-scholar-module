"""
Script to clear the local database
"""
from app import create_app, db
# Import all models to ensure they are registered with SQLAlchemy
from app.models import (
    User, Scholar, Supervisor, Committee, CommitteeMember,
    Exam, Seminar, Synopsis, ProgressReport, ProgressReportApproval,
    Thesis, TravelGrant, TravelGrantApproval, Notification, School,
    ComprehensiveExam, ComprehensiveExamRegistration, Announcement,
    SupervisorChangeRequest, Leave, LeaveApproval, LeaveBalance, Meeting
)
import sys

def clear_database():
    """Drop all tables and recreate them"""
    app = create_app('development')

    with app.app_context():
        print("WARNING: This will delete ALL data in the database!")
        print(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")

        response = input("Are you sure you want to continue? (yes/no): ")

        if response.lower() != 'yes':
            print("Operation cancelled")
            sys.exit(0)

        print("\nDropping all tables...")
        db.drop_all()
        print("All tables dropped")

        print("\nCreating fresh tables...")
        db.create_all()
        print("Fresh tables created")

        print("\nDatabase cleared successfully!")

if __name__ == '__main__':
    clear_database()
