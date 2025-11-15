"""
Automated script to clean up orphaned school chair from production database
This version automatically deletes without confirmation for automation purposes
"""
import sys
import psycopg2

if len(sys.argv) > 1:
    DB_URL = sys.argv[1]
else:
    print("Usage: python cleanup_chair_auto.py 'DATABASE_URL'")
    sys.exit(1)

try:
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    print("\n" + "="*70)
    print("ORPHANED SCHOOL CHAIR CLEANUP")
    print("="*70)

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
        print("Database is clean!")
        cursor.close()
        conn.close()
        sys.exit(0)

    print(f"\nFound {len(orphaned_chairs)} orphaned school chair(s):")
    print("-"*70)
    for chair_id, email, name in orphaned_chairs:
        print(f"ID: {chair_id}, Email: {email}, Name: {name}")

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

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    if 'conn' in locals():
        conn.rollback()
