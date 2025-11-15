"""
Script to connect to production database and view data
Usage: python view_production_db.py "postgresql://..."
"""
import os
import sys

print("\n" + "="*70)
print("PRODUCTION DATABASE CONNECTION")
print("="*70)

# Get database URL from command line or environment variable
if len(sys.argv) > 1:
    PRODUCTION_DB_URL = sys.argv[1]
else:
    PRODUCTION_DB_URL = os.environ.get('PRODUCTION_DATABASE_URL')

if not PRODUCTION_DB_URL:
    print("\nERROR: No database URL provided")
    print("\nUsage:")
    print('  python view_production_db.py "postgresql://user:pass@host:port/db"')
    print("\nOr set environment variable:")
    print('  set PRODUCTION_DATABASE_URL=postgresql://user:pass@host:port/db')
    print('  python view_production_db.py')
    print("\nTo get your database URL:")
    print("1. Go to https://dashboard.render.com")
    print("2. Click on 'research-portal-db'")
    print("3. Look for 'External Database URL' (for external access)")
    print("   Format: postgresql://research_user:PASSWORD@HOST/research_portal")
    print("\nThe connection string should look like:")
    print("postgresql://research_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/research_portal")
    sys.exit(1)

# Connect to database
try:
    import psycopg2
    from psycopg2 import sql

    # Hide password in display
    display_url = PRODUCTION_DB_URL
    if '@' in display_url:
        parts = display_url.split('@')
        if ':' in parts[0]:
            user_pass = parts[0].split(':')
            display_url = f"{user_pass[0]}:****@{parts[1]}"

    print(f"\nConnecting to: {display_url}")
    conn = psycopg2.connect(PRODUCTION_DB_URL)
    cursor = conn.cursor()

    print("Connected successfully!\n")

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

    # Check for recent school chairs
    print("\n" + "="*70)
    print("SCHOOL CHAIRS (users with school_chair role)")
    print("="*70)
    cursor.execute("""
        SELECT u.id, u.email, u.name, u.is_active, s.name as school_name
        FROM users u
        LEFT JOIN schools s ON s.chair_id = u.id
        WHERE u.role = 'school_chair'
        ORDER BY u.id;
    """)
    chairs = cursor.fetchall()
    if chairs:
        print(f"\n{'ID':<5} {'Email':<35} {'Name':<25} {'Active':<8} {'School'}")
        print("-"*110)
        for chair in chairs:
            print(f"{chair[0]:<5} {chair[1]:<35} {chair[2]:<25} {chair[3]:<8} {chair[4] or 'N/A'}")
        print(f"\nTotal school chairs: {len(chairs)}")
    else:
        print("\nNo school chairs found")

    print("\n" + "="*70)
    print("CONNECTION INFO")
    print("="*70)
    print("\nYou can also connect using:")
    print(f'  psql "{PRODUCTION_DB_URL}"')
    print("\nOr use a GUI tool like pgAdmin, DBeaver, or TablePlus")
    print("="*70 + "\n")

    cursor.close()
    conn.close()

except ImportError:
    print("\nERROR: psycopg2 not installed")
    print("Install it with: pip install psycopg2-binary")
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    print("\nMake sure:")
    print("1. The database URL is correct")
    print("2. Your IP is allowed to connect (Render may have IP restrictions)")
    print("3. The database is running")
