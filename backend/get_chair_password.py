"""
Get school chair password from database (for when email fails)
This is a temporary solution until email sending is fixed
"""
import sys
import psycopg2

if len(sys.argv) > 2:
    DB_URL = sys.argv[1]
    CHAIR_EMAIL = sys.argv[2]
else:
    print("Usage: python get_chair_password.py 'DATABASE_URL' 'chair_email'")
    print("Example: python get_chair_password.py 'postgresql://...' 'chair@email.com'")
    sys.exit(1)

try:
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    print("\n" + "="*70)
    print("SCHOOL CHAIR PASSWORD RETRIEVAL")
    print("="*70)

    # Find the user
    cursor.execute("""
        SELECT u.id, u.email, u.name, u.role, u.password_hash
        FROM users u
        WHERE u.email = %s
    """, (CHAIR_EMAIL,))

    user = cursor.fetchone()

    if not user:
        print(f"\nERROR: No user found with email: {CHAIR_EMAIL}")
        cursor.close()
        conn.close()
        sys.exit(1)

    user_id, email, name, role, password_hash = user

    print(f"\nUser Found:")
    print(f"  ID: {user_id}")
    print(f"  Email: {email}")
    print(f"  Name: {name}")
    print(f"  Role: {role}")

    # Find associated school
    cursor.execute("""
        SELECT s.id, s.name, s.code
        FROM schools s
        WHERE s.chair_id = %s AND s.is_deleted = FALSE
    """, (user_id,))

    school = cursor.fetchone()

    if school:
        school_id, school_name, school_code = school
        print(f"\nAssociated School:")
        print(f"  Name: {school_name}")
        print(f"  Code: {school_code}")

    print("\n" + "="*70)
    print("PASSWORD HASH (stored in database)")
    print("="*70)
    print(f"\n{password_hash}")

    print("\n" + "="*70)
    print("IMPORTANT")
    print("="*70)
    print("\nUnfortunately, the password is hashed and cannot be retrieved.")
    print("The plain-text password was only available at creation time.")
    print("\nOptions:")
    print("1. Reset the password using password reset functionality")
    print("2. Delete this user and create a new school with chair")
    print("3. Manually update the password in the database")
    print("\nRecommendation: Set up MAIL_PASSWORD in Render environment,")
    print("then create a new school (delete this one first if needed).")
    print("="*70)

    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
