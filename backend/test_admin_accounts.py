#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test script to verify admin accounts"""
import sys
import codecs

# Set UTF-8 encoding for Windows console
if sys.platform.startswith('win'):
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from app import create_app, db
from app.models import User
import os

app = create_app(os.getenv('FLASK_ENV', 'development'))

with app.app_context():
    # Query admin accounts
    dean = User.query.filter_by(email='dean.academics@iitmandi.ac.in').first()
    ad = User.query.filter_by(email='ad.research@iitmandi.ac.in').first()

    print("=== Admin Accounts Verification ===\n")

    if dean:
        print(f"✓ Dean Academics Found:")
        print(f"  Email: {dean.email}")
        print(f"  Name: {dean.name}")
        print(f"  Role: {dean.role}")
        print(f"  Is Active: {dean.is_active}")
        print(f"  Password Hash Exists: {bool(dean.password_hash)}")
        print(f"  Password 'Dean@123' Correct: {dean.check_password('Dean@123')}")
    else:
        print("✗ Dean Academics NOT FOUND")

    print()

    if ad:
        print(f"✓ AD Research Found:")
        print(f"  Email: {ad.email}")
        print(f"  Name: {ad.name}")
        print(f"  Role: {ad.role}")
        print(f"  Is Active: {ad.is_active}")
        print(f"  Password Hash Exists: {bool(ad.password_hash)}")
        print(f"  Password 'ADResearch@123' Correct: {ad.check_password('ADResearch@123')}")
    else:
        print("✗ AD Research NOT FOUND")

    print("\n=== Test Login Credentials ===")
    print("Dean Academics: dean.academics@iitmandi.ac.in / Dean@123")
    print("AD Research: ad.research@iitmandi.ac.in / ADResearch@123")
