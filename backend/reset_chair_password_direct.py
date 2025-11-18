"""
Reset school chair password directly in database
Generates a new password and updates the database
"""
import sys
import psycopg2
import secrets
import string
from werkzeug.security import generate_password_hash

if len(sys.argv) > 2:
    DB_URL = sys.argv[1]
    CHAIR_EMAIL = sys.argv[2]
else:
    print("Usage: python reset_chair_password_direct.py 'DATABASE_URL' 'chair_email'")
    print("Example: python reset_chair_password_direct.py 'postgresql://...' 'chair@email.com'")
    sys.exit(1)

try:
    # Generate new random password
    alphabet = string.ascii_letters + string.digits
    new_password = ''.join(secrets.choice(alphabet) for i in range(16))

    # Hash the password
    password_hash = generate_password_hash(new_password)

    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    print("\n" + "="*70)
    print("SCHOOL CHAIR PASSWORD RESET")
    print("="*70)

    # Find the user
    cursor.execute("""
        SELECT u.id, u.email, u.name, u.role
        FROM users u
        WHERE u.email = %s
    """, (CHAIR_EMAIL,))

    user = cursor.fetchone()

    if not user:
        print(f"\nERROR: No user found with email: {CHAIR_EMAIL}")
        cursor.close()
        conn.close()
        sys.exit(1)

    user_id, email, name, role = user

    print(f"\nUser Found:")
    print(f"  ID: {user_id}")
    print(f"  Email: {email}")
    print(f"  Name: {name}")
    print(f"  Role: {role}")

    # Update password
    print(f"\nUpdating password...")
    cursor.execute("""
        UPDATE users
        SET password_hash = %s
        WHERE id = %s
    """, (password_hash, user_id))

    conn.commit()

    print("\n" + "="*70)
    print("PASSWORD RESET SUCCESSFUL!")
    print("="*70)
    print(f"\nEmail: {email}")
    print(f"New Password: {new_password}")
    print("\n" + "="*70)
    print("IMPORTANT: Save this password immediately!")
    print("It cannot be retrieved again after closing this window.")
    print("="*70)

    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    if 'conn' in locals():
        conn.rollback()
