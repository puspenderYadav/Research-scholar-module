"""
Delete sample scholars from the database
"""
from app import create_app, db
from app.models.scholar import Scholar

def delete_sample_scholars():
    """Delete the sample scholars by enrollment number"""
    app = create_app()

    with app.app_context():
        # List of enrollment numbers to delete
        enrollment_numbers = [
            'P25001',
            'P25002',
            'P25003',
            'M25001',
            'M25002',
            'M25003'
        ]

        print("Deleting sample scholars...")
        deleted_count = 0

        for enrollment_number in enrollment_numbers:
            scholar = Scholar.query.filter_by(enrollment_number=enrollment_number).first()
            if scholar:
                print(f"Deleting scholar: {enrollment_number} - {scholar.user.name}")
                db.session.delete(scholar)
                deleted_count += 1
            else:
                print(f"Scholar not found: {enrollment_number}")

        # Commit the changes
        db.session.commit()
        print(f"\nSuccessfully deleted {deleted_count} scholars.")

if __name__ == '__main__':
    delete_sample_scholars()
