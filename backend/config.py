import os
from datetime import timedelta
from dotenv import load_dotenv
import os as _os

# Load the project's .env file explicitly from the backend folder. This avoids
# accidental loading of placeholder files like .env.example from other
# directories when the app is executed from a different working directory.
_dotenv_path = _os.path.join(_os.path.dirname(__file__), '.env')
# Force load/override to ensure the project's `.env` values are used instead of any
# pre-existing environment variables or placeholder files that may be present in
# the user's shell or parent directories.
load_dotenv(_dotenv_path, override=True)

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://postgres:postgres@localhost:5432/research_portal'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # JWT should not process OPTIONS requests (CORS preflight)
    # This is handled by setting proper CORS configuration

    # Mail Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'noreply@researchportal.edu'

    # Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'app/static/uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH') or 16 * 1024 * 1024)  # 16MB
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

    # Application Configuration
    APP_NAME = os.environ.get('APP_NAME') or 'Research Scholars Management Portal'
    FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:5000'
    STUDENT_EMAIL_DOMAIN = os.environ.get('STUDENT_EMAIL_DOMAIN') or 'students.uni.edu'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:postgres@localhost:5432/research_portal_test'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
