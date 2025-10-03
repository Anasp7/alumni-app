from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import get_config


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(get_config())
    
    # Configure JWT - identity will be user ID (integer)
    app.config['JWT_IDENTITY_CLAIM'] = 'sub'

    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    jwt = JWTManager(app)
    
    # Handle OPTIONS requests before JWT validation
    @app.before_request
    def handle_preflight():
        from flask import request
        if request.method == "OPTIONS":
            return "", 200

    from .routes.health import bp as health_bp
    from .routes.auth import bp as auth_bp
    from .routes.users import bp as users_bp
    from .routes.mentorship import bp as mentorship_bp
    from .routes.opportunities import bp as opportunities_bp
    from .routes.scholarships import bp as scholarships_bp
    from .routes.applications import bp as applications_bp
    from .routes.messages import bp as messages_bp
    from .routes.stories import bp as stories_bp
    from .routes.admin import bp as admin_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(mentorship_bp, url_prefix="/api/mentorship")
    app.register_blueprint(opportunities_bp, url_prefix="/api/opportunities")
    app.register_blueprint(scholarships_bp, url_prefix="/api/scholarships")
    app.register_blueprint(applications_bp, url_prefix="/api/applications")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(stories_bp, url_prefix="/api/stories")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    return app


