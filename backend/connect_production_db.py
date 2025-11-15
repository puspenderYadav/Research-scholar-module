"""
Script to connect to production database and view data
"""
import os
import sys

# You need to set the production DATABASE_URL
# Get it from Render dashboard -> research-portal-db -> Connection String

PRODUCTION_DB_URL = os.environ.get('PRODUCTION_DATABASE_URL') or input("Enter production DATABASE_URL from Render: ")

print("\n" + "="*70)
print("PRODUCTION DATABASE CONNECTION")
print("="*70)

if not PRODUCTION_DB_URL:
    print("\nERROR: No database URL provided")
    print("\nTo get your database URL:")
    print("1. Go to https://dashboard.render.com")
    print("2. Click on 'research-portal-db'")
    print("3. Copy the 'External Database URL' or 'Internal Database URL'")
    print("4. Run this script with: PRODUCTION_DATABASE_URL='your-url' python connect_production_db.py")
    sys.exit(1)

# Connect to database
try:
    import psycopg2
    from psycopg2 import sql

    print(f"\nConnecting to production database...")
    conn = psycopg2.connect(PRODUCTION_DB_URL)
    cursor = conn.cursor()

    print("✓ Connected successfully!\n")

    # Show available tables
    print("="*70)
    print("AVAILABLE TABLES")
    print("="*70)
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    for i, (table,) in enumerate(tables, 1):
        print(f"{i}. {table}")

    # Show users
    print("\n" + "="*70)
    print("USERS")
    print("="*70)
    cursor.execute("SELECT id, email, name, role, is_active FROM users ORDER BY id;")
    users = cursor.fetchall()
    print(f"\n{'ID':<5} {'Email':<35} {'Name':<25} {'Role':<20} {'Active'}")
    print("-"*110)
    for user in users:
        print(f"{user[0]:<5} {user[1]:<35} {user[2]:<25} {user[3]:<20} {user[4]}")
    print(f"\nTotal users: {len(users)}")

    # Show schools
    print("\n" + "="*70)
    print("SCHOOLS")
    print("="*70)
    cursor.execute("SELECT id, name, code, chair_id FROM schools ORDER BY id;")
    schools = cursor.fetchall()
    print(f"\n{'ID':<5} {'Name':<40} {'Code':<10} {'Chair ID'}")
    print("-"*70)
    for school in schools:
        print(f"{school[0]:<5} {school[1]:<40} {school[2]:<10} {school[3]}")
    print(f"\nTotal schools: {len(schools)}")

    # Show supervisors (faculty)
    print("\n" + "="*70)
    print("FACULTY/SUPERVISORS")
    print("="*70)
    cursor.execute("""
        SELECT s.id, u.name, u.email, s.employee_id, sch.name as school_name
        FROM supervisors s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN schools sch ON s.school_id = sch.id
        ORDER BY s.id;
    """)
    faculty = cursor.fetchall()
    print(f"\n{'ID':<5} {'Name':<25} {'Email':<35} {'Emp ID':<10} {'School'}")
    print("-"*110)
    for fac in faculty:
        print(f"{fac[0]:<5} {fac[1]:<25} {fac[2]:<35} {fac[3]:<10} {fac[4] or 'N/A'}")
    print(f"\nTotal faculty: {len(faculty)}")

    # Show scholars
    print("\n" + "="*70)
    print("SCHOLARS")
    print("="*70)
    cursor.execute("""
        SELECT sch.id, u.name, u.email, sch.enrollment_number, s.name as school_name
        FROM scholars sch
        JOIN users u ON sch.user_id = u.id
        LEFT JOIN schools s ON sch.school_id = s.id
        ORDER BY sch.id
        LIMIT 20;
    """)
    scholars = cursor.fetchall()
    print(f"\n{'ID':<5} {'Name':<25} {'Email':<35} {'Enrollment':<15} {'School'}")
    print("-"*110)
    for scholar in scholars:
        print(f"{scholar[0]:<5} {scholar[1]:<25} {scholar[2]:<35} {scholar[3]:<15} {scholar[4] or 'N/A'}")

    cursor.execute("SELECT COUNT(*) FROM scholars;")
    total_scholars = cursor.fetchone()[0]
    print(f"\nTotal scholars: {total_scholars} (showing first 20)")

    print("\n" + "="*70)
    print("CONNECTION DETAILS")
    print("="*70)
    print(f"Database URL: {PRODUCTION_DB_URL.split('@')[1] if '@' in PRODUCTION_DB_URL else 'Hidden'}")
    print("\nYou can also connect using psql:")
    print(f'psql "{PRODUCTION_DB_URL}"')
    print("\nOr use a GUI tool like pgAdmin, DBeaver, or TablePlus")
    print("="*70)

    cursor.close()
    conn.close()

except ImportError:
    print("\nERROR: psycopg2 not installed")
    print("Install it with: pip install psycopg2-binary")
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
