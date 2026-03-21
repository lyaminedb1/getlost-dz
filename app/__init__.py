"""
GET LOST DZ — Application Factory
Creates and configures the Flask app.
Rate limiting, logging, and all blueprints registered here.
"""
import time
import logging
from flask import Flask, request, g
from flask_cors import CORS

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("getlostdz")


def create_app():
    app = Flask(__name__, static_folder="../static", static_url_path="")
    CORS(app)

    # ── Rate limiting ─────────────────────────────────────────────────────────
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address
        from app.config import (
            LIMIT_LOGIN, LIMIT_REGISTER, LIMIT_FORGOT,
            LIMIT_EVENTS, LIMIT_DEFAULT_WRITE,
        )
        limiter = Limiter(
            get_remote_address,
            app=app,
            default_limits=[LIMIT_DEFAULT_WRITE],
            storage_uri="memory://",
        )
        logger.info("✅  Rate limiting enabled")
    except ImportError:
        limiter = None
        logger.warning("⚠️  flask-limiter not installed — rate limiting disabled")

    # ── Request logger ────────────────────────────────────────────────────────
    @app.before_request
    def _start_timer():
        g._start = time.time()

    @app.after_request
    def _log_request(response):
        if request.path.startswith("/api"):
            ms = round((time.time() - g.get("_start", time.time())) * 1000)
            logger.info(
                "%s %s %s %dms",
                request.method, request.path, response.status_code, ms,
            )
        return response

    # ── DB teardown ───────────────────────────────────────────────────────────
    from app.db import close_db
    app.teardown_appcontext(close_db)

    # ── Register blueprints ───────────────────────────────────────────────────
    from app.routes.auth      import bp as auth_bp
    from app.routes.offers    import bp as offers_bp
    from app.routes.agencies  import bp as agencies_bp
    from app.routes.admin     import bp as admin_bp
    from app.routes.analytics import bp as analytics_bp
    from app.routes.notifications import bp as notif_bp
    from app.routes.upload    import bp as upload_bp
    from app.routes.favorites import bp as fav_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(offers_bp)
    app.register_blueprint(agencies_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(notif_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(fav_bp)

    # ── Apply specific rate limits if limiter available ───────────────────────
    if limiter:
        from app.config import LIMIT_LOGIN, LIMIT_REGISTER, LIMIT_FORGOT, LIMIT_EVENTS
        # Use app view functions (blueprints are registered, so names are prefixed)
        for fname, limit in [
            ("auth.login",            LIMIT_LOGIN),
            ("auth.register",         LIMIT_REGISTER),
            ("auth.forgot_password",  LIMIT_FORGOT),
            ("analytics.track_event", LIMIT_EVENTS),
        ]:
            if fname in app.view_functions:
                limiter.limit(limit)(app.view_functions[fname])

    # ── Static catch-all (SPA) ────────────────────────────────────────────────
    import os
    from flask import send_from_directory

    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        if path and os.path.exists(os.path.join(static_dir, path)):
            return send_from_directory(static_dir, path)
        return send_from_directory(static_dir, "index.html")

    from app.routes.messages import messages_bp
    app.register_blueprint(messages_bp, url_prefix='/api')
    logger.info("🚀  Get Lost DZ app factory complete")
    return app
