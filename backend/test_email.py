"""
Test email sending configuration
"""
import os
from flask import Flask
from flask_mail import Mail, Message

# Create a minimal Flask app for testing
app = Flask(__name__)

# Configure email settings - use environment variables
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'researchmodule32@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'elii gwyb mapa ngig')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@researchportal.edu')

mail = Mail(app)

def test_email(recipient):
    """Send a test email"""
    print("\n" + "="*70)
    print("EMAIL CONFIGURATION TEST")
    print("="*70)
    print(f"\nConfiguration:")
    print(f"  MAIL_SERVER: {app.config['MAIL_SERVER']}")
    print(f"  MAIL_PORT: {app.config['MAIL_PORT']}")
    print(f"  MAIL_USE_TLS: {app.config['MAIL_USE_TLS']}")
    print(f"  MAIL_USERNAME: {app.config['MAIL_USERNAME']}")
    print(f"  MAIL_PASSWORD: {'*' * len(app.config['MAIL_PASSWORD'])}")
    print(f"  MAIL_DEFAULT_SENDER: {app.config['MAIL_DEFAULT_SENDER']}")

    print(f"\nSending test email to: {recipient}")

    try:
        with app.app_context():
            msg = Message(
                subject="Test Email from Research Portal",
                recipients=[recipient],
                body="This is a test email to verify email configuration is working correctly.",
                sender=app.config['MAIL_DEFAULT_SENDER']
            )
            mail.send(msg)
            print("\n" + "="*70)
            print("SUCCESS! Email sent successfully")
            print("="*70)
            print(f"\nCheck {recipient} inbox (or spam folder)")
            return True
    except Exception as e:
        print("\n" + "="*70)
        print("ERROR! Failed to send email")
        print("="*70)
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        recipient = sys.argv[1]
    else:
        recipient = "paridhimittal3106@gmail.com"

    test_email(recipient)
