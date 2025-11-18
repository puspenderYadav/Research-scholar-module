"""
Delete old SMSS school from production database
This will soft-delete the school with paridhimittal3106@gmail.com as chair
"""
import sys
import psycopg2
from datetime import datetime

if len(sys.argv) < 2:
    print("Usage: python delete_old_smss.py 'DATABASE_URL'")
    print("Example: python delete_old_smss.py 'postgresql://user:pass@host/db'")
    sys.exit(1)

DB_URL = sys.argv[1]

try:
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    print("\n" + "="*70)
    print("DELETE OLD SMSS SCHOOL")
    print("="*70)

    # Find all SMSS schools
    cursor.execute("""
        SELECT s.id, s.name, s.code, s.is_deleted, u.email, u.name
        FROM schools s
        LEFT JOIN users u ON s.chair_id = u.id
        WHERE s.code = 'SMSS'
        ORDER BY s.id
    """)

    schools = cursor.fetchall()

    if not schools:
        print("\nNo SMSS schools found in database")
        cursor.close()
        conn.close()
        sys.exit(0)

    print(f"\nFound {len(schools)} SMSS school(s):")
    print("-"*70)

    target_school_id = None
    for school_id, school_name, code, is_deleted, chair_email, chair_name in schools:
        status = "DELETED" if is_deleted else "ACTIVE"
        print(f"\n[{status}] ID: {school_id}")
        print(f"  Name: {school_name}")
        print(f"  Chair: {chair_name or 'None'} ({chair_email or 'None'})")
        
        # Find the one with paridhimittal3106@gmail.com
        if chair_email == 'paridhimittal3106@gmail.com' and not is_deleted:
            target_school_id = school_id
            print(f"  >>> THIS IS THE OLD SMSS - WILL BE DELETED")

    if not target_school_id:
        print("\n" + "="*70)
        print("No old SMSS school with paridhimittal3106@gmail.com found")
        print("="*70)
        cursor.close()
        conn.close()
        sys.exit(0)

    print("\n" + "="*70)
    print(f"DELETING SCHOOL ID: {target_school_id}")
    print("="*70)

    # Get all students in this school
    cursor.execute("""
        SELECT COUNT(*) FROM scholars WHERE school_id = %s
    """, (target_school_id,))
    student_count = cursor.fetchone()[0]

    # Get all faculty in this school
    cursor.execute("""
        SELECT COUNT(*) FROM supervisors WHERE school_id = %s
    """, (target_school_id,))
    faculty_count = cursor.fetchone()[0]

    print(f"\nSchool has:")
    print(f"  Students: {student_count}")
    print(f"  Faculty: {faculty_count}")

    # Get chair user ID
    cursor.execute("""
        SELECT chair_id FROM schools WHERE id = %s
    """, (target_school_id,))
    chair_id = cursor.fetchone()[0]

    # Deactivate all students
    if student_count > 0:
        cursor.execute("""
            UPDATE users SET is_active = FALSE
            WHERE id IN (
                SELECT user_id FROM scholars WHERE school_id = %s
            )
        """, (target_school_id,))
        print(f"\nDeactivated {student_count} student(s)")

    # Deactivate all faculty
    if faculty_count > 0:
        cursor.execute("""
            UPDATE users SET is_active = FALSE
            WHERE id IN (
                SELECT user_id FROM supervisors WHERE school_id = %s
            )
        """, (target_school_id,))
        print(f"Deactivated {faculty_count} faculty member(s)")

    # Deactivate chair
    if chair_id:
        cursor.execute("""
            UPDATE users SET is_active = FALSE
            WHERE id = %s
        """, (chair_id,))
        print(f"Deactivated chair")

    # Soft delete the school
    cursor.execute("""
        UPDATE schools
        SET is_deleted = TRUE,
            deleted_at = %s
        WHERE id = %s
    """, (datetime.utcnow(), target_school_id))

    # Commit changes
    conn.commit()

    print("\n" + "="*70)
    print("SUCCESS! Old SMSS school deleted")
    print("="*70)
    print(f"\nSchool ID {target_school_id} has been soft-deleted")
    print(f"All associated users have been deactivated")
    print(f"Records are preserved in database")
    print("\nYou can now run initialize-schools to create the new SMSS")
    print("="*70)

    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    if 'conn' in locals():
        conn.rollback()

