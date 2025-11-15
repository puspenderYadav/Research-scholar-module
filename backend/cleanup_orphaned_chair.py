"""
Script to clean up orphaned school chair from production database
This script deletes the user with ID 14 (paridhimittal3106@gmail.com) who was created
as a school chair but has no associated school.
"""
import os
import sys

# Database URL - you'll pass this as a command line argument
if len(sys.argv) > 1:
    PRODUCTION_DB_URL = sys.argv[1]
else:
    print("\nUsage: python cleanup_orphaned_chair.py 'DATABASE_URL'")
    print("\nExample:")
    print('  python cleanup_orphaned_chair.py "postgresql://user:pass@host:port/db"')
    sys.exit(1)

try:
    import psycopg2

    print("\n" + "="*70)
    print("ORPHANED SCHOOL CHAIR CLEANUP")
    print("="*70)

    # Connect to database
    print(f"\nConnecting to production database...")
    conn = psycopg2.connect(PRODUCTION_DB_URL)
    cursor = conn.cursor()
    print("Connected successfully!")

    # Find orphaned school chairs (chairs with no school)
    print("\nSearching for orphaned school chairs...")
    cursor.execute("""
        SELECT u.id, u.email, u.name
        FROM users u
        WHERE u.role = 'school_chair'
        AND NOT EXISTS (
            SELECT 1 FROM schools s
            WHERE s.chair_id = u.id AND s.is_deleted = FALSE
        )
    """)

    orphaned_chairs = cursor.fetchall()

    if not orphaned_chairs:
        print("\nNo orphaned school chairs found.")
        cursor.close()
        conn.close()
        sys.exit(0)

    print(f"\nFound {len(orphaned_chairs)} orphaned school chair(s):")
    print("-"*70)
    for chair_id, email, name in orphaned_chairs:
        print(f"ID: {chair_id}, Email: {email}, Name: {name}")

    # Confirm deletion
    print("\n" + "="*70)
    print("WARNING: This will permanently delete these user accounts!")
    print("="*70)
    confirmation = input("\nType 'DELETE' to confirm deletion: ")

    if confirmation != 'DELETE':
        print("\nCancelled. No changes made.")
        cursor.close()
        conn.close()
        sys.exit(0)

    # Delete orphaned chairs
    deleted_count = 0
    for chair_id, email, name in orphaned_chairs:
        print(f"\nDeleting user ID {chair_id} ({email})...")
        cursor.execute("DELETE FROM users WHERE id = %s", (chair_id,))
        deleted_count += 1
        print(f"Deleted successfully.")

    # Commit changes
    conn.commit()

    print("\n" + "="*70)
    print(f"CLEANUP COMPLETE: {deleted_count} orphaned chair(s) deleted")
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
    if 'conn' in locals():
        conn.rollback()
