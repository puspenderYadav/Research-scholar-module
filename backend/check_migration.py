"""
Check if migration has been applied to production database
"""
import sys
import psycopg2

if len(sys.argv) > 1:
    DB_URL = sys.argv[1]
else:
    print("Usage: python check_migration.py 'DATABASE_URL'")
    sys.exit(1)

try:
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    print("\n" + "="*70)
    print("MIGRATION STATUS CHECK")
    print("="*70)

    # Check schools table columns
    print("\nSchools table columns:")
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'schools'
        ORDER BY ordinal_position;
    """)

    columns = cursor.fetchall()
    has_soft_delete = False

    for col_name, data_type, nullable, default in columns:
        print(f"  - {col_name}: {data_type} (nullable: {nullable}, default: {default})")
        if col_name in ['is_deleted', 'deleted_at', 'deleted_by']:
            has_soft_delete = True

    # Check migration version
    print("\n" + "="*70)
    print("MIGRATION VERSION")
    print("="*70)
    cursor.execute("SELECT version_num FROM alembic_version;")
    version = cursor.fetchone()
    print(f"Current migration version: {version[0] if version else 'None'}")

    print("\n" + "="*70)
    print("RESULT")
    print("="*70)
    if has_soft_delete:
        print("✓ Soft delete migration HAS BEEN APPLIED")
        print("  - is_deleted, deleted_at, deleted_by columns are present")
    else:
        print("✗ Soft delete migration NOT YET APPLIED")
        print("  - Missing: is_deleted, deleted_at, deleted_by columns")
        print("\nAction needed: Run 'flask db upgrade' on production")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
