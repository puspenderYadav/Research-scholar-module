"""
Simple script to reset school chair password
"""
from app import create_app, db
from app.models.user import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Reset password for the first school chair
    chair_email = "chair.sbb@iitmandi.ac.in"
    new_password = "chair123"  # Simple password for testing

    user = User.query.filter_by(email=chair_email).first()

    if user:
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()

        print("\n" + "="*70)
        print("PASSWORD RESET SUCCESSFUL!")
        print("="*70)
        print(f"\nEmail: {chair_email}")
        print(f"Password: {new_password}")
        print("\n" + "="*70)
        print("You can now log in with these credentials")
        print("="*70)
    else:
        print(f"\nERROR: No user found with email: {chair_email}")
