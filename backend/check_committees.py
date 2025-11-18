"""
Quick script to check committee assignments
"""
from app import create_app, db
from app.models import Scholar, Committee, CommitteeMember

def check_committees():
    app = create_app('development')

    with app.app_context():
        scholars = Scholar.query.all()
        committees = Committee.query.all()
        committee_members = CommitteeMember.query.all()

        print(f"Total Scholars: {len(scholars)}")
        print(f"Total Committees: {len(committees)}")
        print(f"Total Committee Members: {len(committee_members)}")

        if committees:
            print("\nCommittees:")
            for committee in committees:
                scholar = Scholar.query.get(committee.scholar_id)
                members = CommitteeMember.query.filter_by(committee_id=committee.id).all()
                print(f"  Scholar: {scholar.enrollment_number} - Members: {len(members)}")
        else:
            print("\nNo committees found in database!")

if __name__ == '__main__':
    check_committees()
