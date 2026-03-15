"""
GET LOST DZ — Entry Point
Bootstraps the DB then starts the Flask app.
Everything else lives in app/
"""
import os
from app.config import USE_POSTGRES, SQLITE_FILE
from app.models.init_db import init_db, run_migrations

# ── DB bootstrap ──────────────────────────────────────────────────────────────
if USE_POSTGRES or not os.path.exists(SQLITE_FILE):
    print("🔧  Initialising database …")
    init_db()

run_migrations()

# ── Create app ────────────────────────────────────────────────────────────────
from app import create_app
app = create_app()

# ── Dev server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀  Get Lost DZ  →  http://localhost:{port}")
    print("    admin@getlostdz.com  / admin123")
    print("    agency1@getlostdz.com / agency123")
    print("    sarah@test.com       / user123")
    app.run(host="0.0.0.0", port=port, debug=True)
