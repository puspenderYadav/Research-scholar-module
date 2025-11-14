#!/usr/bin/env python3
"""Initialize admin accounts for production deployment"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

def init_admin_accounts():
    """Initialize fixed admin accounts (Dean Academics and AD Research)"""
    print("Initializing admin accounts...")

    app = create_app(os.getenv('FLASK_ENV', 'production'))

    with app.app_context():
        # Dean Academics
        dean_email = 'dean.academics@iitmandi.ac.in'
        dean = User.query.filter_by(email=dean_email).first()

        if not dean:
            dean = User(
                email=dean_email,
                name='Dean Academics',
                role='dean_academics',
                is_active=True
            )
            dean.set_password('Dean@123')
            db.session.add(dean)
            print(f"✓ Created Dean Academics account: {dean_email}")
        else:
            print(f"✓ Dean Academics account already exists: {dean_email}")

        # AD Research
        ad_research_email = 'ad.research@iitmandi.ac.in'
        ad_research = User.query.filter_by(email=ad_research_email).first()

        if not ad_research:
            ad_research = User(
                email=ad_research_email,
                name='AD Research',
                role='ad_research',
                is_active=True
            )
            ad_research.set_password('ADResearch@123')
            db.session.add(ad_research)
            print(f"✓ Created AD Research account: {ad_research_email}")
        else:
            print(f"✓ AD Research account already exists: {ad_research_email}")

        db.session.commit()
        print("\n=== Admin Account Credentials ===")
        print(f"Dean Academics: {dean_email} / Dean@123")
        print(f"AD Research: {ad_research_email} / ADResearch@123")
        print("\nAdmin accounts initialized successfully!")

if __name__ == '__main__':
    init_admin_accounts()
