import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.utils.email_service import EmailService

app = create_app()

with app.app_context():
    print("\n" + "="*60)
    print("EMAIL CONFIGURATION TEST")
    print("="*60)

    print("\nEmail Configuration:")
    print(f"MAIL_SERVER: {app.config.get('MAIL_SERVER')}")
    print(f"MAIL_PORT: {app.config.get('MAIL_PORT')}")
    print(f"MAIL_USE_TLS: {app.config.get('MAIL_USE_TLS')}")
    print(f"MAIL_USERNAME: {app.config.get('MAIL_USERNAME')}")
    print(f"MAIL_PASSWORD: {'*' * 10 if app.config.get('MAIL_PASSWORD') else 'NOT SET'}")
    print(f"MAIL_DEFAULT_SENDER: {app.config.get('MAIL_DEFAULT_SENDER')}")
    print(f"FRONTEND_URL: {app.config.get('FRONTEND_URL')}")

    print("\n" + "="*60)
    print("SENDING TEST EMAIL")
    print("="*60)

    test_email = "divyamittal337@gmail.com"

    success = EmailService.send_email(
        to_email=test_email,
        subject="Test Email from Research Portal",
        body="This is a test email to verify email configuration is working.",
        html_body="""
        <html>
        <body>
            <h2>Test Email</h2>
            <p>This is a test email to verify email configuration is working.</p>
            <p>If you received this, the email service is functioning correctly.</p>
        </body>
        </html>
        """
    )

    print("\n" + "="*60)
    if success:
        print("✓ TEST PASSED: Email sent successfully!")
        print(f"Check {test_email} inbox (and spam folder)")
    else:
        print("✗ TEST FAILED: Email could not be sent")
        print("Check the error messages above for details")
    print("="*60)
