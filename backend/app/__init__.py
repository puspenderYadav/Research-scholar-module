from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from config import config
import os

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()

def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Configure CORS - MUST be before blueprints are registered
    # Flask-CORS will automatically handle OPTIONS requests

    # Get allowed origins from config
    allowed_origins = []

    # Add localhost patterns for development
    allowed_origins.extend([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://localhost:5000"
    ])

    # Add production frontend URL if set
    frontend_url = app.config.get('FRONTEND_URL')
    if frontend_url and frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)

    CORS(app,
         resources={r"/api/*": {
             "origins": allowed_origins,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
             "expose_headers": ["Content-Disposition"],
             "supports_credentials": True,
             "max_age": 3600
         }},
         supports_credentials=True)

    # Handle OPTIONS requests before JWT validation (CORS preflight)
    @app.before_request
    def handle_preflight():
        from flask import request
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            return response

    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'synopsis'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'progress_reports'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'thesis'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'travel_grants'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'leaves'), exist_ok=True)

    # Register blueprints
    from app.routes import auth, scholars, supervisors, committees, exams, seminars, \
        synopsis, progress, thesis, travel_grants, notifications, calendar, dashboard, supervisor_change, schools, research_office, dean, comprehensive_exams, leaves, meetings, school_chair, approvals

    app.register_blueprint(auth.bp)
    app.register_blueprint(scholars.bp)
    app.register_blueprint(supervisors.bp)
    app.register_blueprint(committees.bp)
    app.register_blueprint(exams.bp)
    app.register_blueprint(seminars.bp)
    app.register_blueprint(synopsis.bp)
    app.register_blueprint(progress.bp)
    app.register_blueprint(thesis.bp)
    app.register_blueprint(travel_grants.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(calendar.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(supervisor_change.bp)
    app.register_blueprint(schools.bp)
    app.register_blueprint(research_office.bp)
    app.register_blueprint(dean.bp)
    app.register_blueprint(comprehensive_exams.bp)
    app.register_blueprint(leaves.bp)
    app.register_blueprint(meetings.bp)
    app.register_blueprint(school_chair.bp)
    app.register_blueprint(approvals.bp)

    return app
