"""
Script to assign Doctoral Committees (DC) and APC to scholars
"""
from app import create_app, db
from app.models import Scholar, Supervisor, Committee, CommitteeMember
from datetime import date

def assign_committees():
    """Assign DC and APC committees to all scholars"""
    app = create_app('development')

    with app.app_context():
        # Get all scholars
        scholars = Scholar.query.filter_by(status='active').all()

        if not scholars:
            print("No active scholars found.")
            return

        # Get all supervisors
        supervisors = Supervisor.query.all()

        if len(supervisors) < 5:
            print("Error: Need at least 5 supervisors to form committees.")
            return

        print(f"Found {len(scholars)} scholars and {len(supervisors)} supervisors")
        print("\nAssigning committees...\n")

        committees_created = 0
        committees_skipped = 0

        for scholar in scholars:
            # Check if committee already exists
            existing_committee = Committee.query.filter_by(scholar_id=scholar.id).first()
            if existing_committee:
                print(f"[SKIP] {scholar.enrollment_number} - Committee already exists. Skipping...")
                committees_skipped += 1
                continue

            # Get scholar's primary supervisor
            primary_supervisor = scholar.supervisor

            # Create committee
            committee = Committee(scholar_id=scholar.id)
            db.session.add(committee)
            db.session.flush()  # Get committee ID

            # Assign DC Members (3 total: primary supervisor + 2 others)
            dc_members = []

            # 1. Primary supervisor as DC member
            dc_member1 = CommitteeMember(
                committee_id=committee.id,
                supervisor_id=primary_supervisor.id,
                member_type='DC',
                assigned_date=date.today(),
                is_active=True
            )
            db.session.add(dc_member1)
            dc_members.append(primary_supervisor)

            # 2-3. Select 2 more DC members from same or related schools
            available_supervisors = [s for s in supervisors if s.id != primary_supervisor.id]

            # Prefer same school first
            same_school_supervisors = [s for s in available_supervisors if s.school_id == primary_supervisor.school_id]
            other_supervisors = [s for s in available_supervisors if s.school_id != primary_supervisor.school_id]

            # Select DC members
            dc_candidates = same_school_supervisors[:1] + other_supervisors[:1]

            for supervisor in dc_candidates:
                dc_member = CommitteeMember(
                    committee_id=committee.id,
                    supervisor_id=supervisor.id,
                    member_type='DC',
                    assigned_date=date.today(),
                    is_active=True
                )
                db.session.add(dc_member)
                dc_members.append(supervisor)

            # Assign APC Members (2 total, different from DC members)
            apc_members = []
            dc_member_ids = [m.id for m in dc_members]
            apc_candidates = [s for s in supervisors if s.id not in dc_member_ids][:2]

            for supervisor in apc_candidates:
                apc_member = CommitteeMember(
                    committee_id=committee.id,
                    supervisor_id=supervisor.id,
                    member_type='APC',
                    assigned_date=date.today(),
                    is_active=True
                )
                db.session.add(apc_member)
                apc_members.append(supervisor)

            committees_created += 1

            # Print committee composition
            print(f"[OK] {scholar.enrollment_number} ({scholar.user.name})")
            print(f"  School: {scholar.school.code}")
            print(f"  DC Members ({len(dc_members)}):")
            for i, member in enumerate(dc_members, 1):
                marker = "*" if member.id == primary_supervisor.id else " "
                print(f"    {marker} {i}. {member.user.name} ({member.employee_id}) - {member.school.code}")
            print(f"  APC Members ({len(apc_members)}):")
            for i, member in enumerate(apc_members, 1):
                print(f"      {i}. {member.user.name} ({member.employee_id}) - {member.school.code}")
            print()

        # Commit all changes
        db.session.commit()

        print("=" * 80)
        print(f"\nCOMMITTEE ASSIGNMENT SUMMARY:")
        print(f"  Committees Created: {committees_created}")
        print(f"  Committees Skipped (already exist): {committees_skipped}")
        print(f"  Total Scholars: {len(scholars)}")
        print(f"  DC Members Assigned: {committees_created * 3}")
        print(f"  APC Members Assigned: {committees_created * 2}")
        print("=" * 80)

        # Print supervisor load summary
        print("\nSUPERVISOR COMMITTEE LOAD:")
        print("-" * 80)
        for supervisor in supervisors:
            dc_count = CommitteeMember.query.filter_by(
                supervisor_id=supervisor.id,
                member_type='DC',
                is_active=True
            ).count()

            apc_count = CommitteeMember.query.filter_by(
                supervisor_id=supervisor.id,
                member_type='APC',
                is_active=True
            ).count()

            total = dc_count + apc_count
            print(f"{supervisor.employee_id:10} | {supervisor.user.name:25} | DC: {dc_count:2} | APC: {apc_count:2} | Total: {total:2}")
        print("-" * 80)

if __name__ == '__main__':
    assign_committees()
