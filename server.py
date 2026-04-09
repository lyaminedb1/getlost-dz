"""
GET LOST DZ — Entry Point
Bootstraps the DB then starts the Flask app.
Everything else lives in app/
"""
import os, time
from app.config import USE_POSTGRES, SQLITE_FILE
from app.models.init_db import init_db, run_migrations

# ── DB bootstrap ──────────────────────────────────────────────────────────────
if USE_POSTGRES or not os.path.exists(SQLITE_FILE):
    print("🔧  Initialising database …")
    for attempt in range(1, 6):
        try:
            init_db()
            break
        except Exception as e:
            if attempt == 5:
                raise
            wait = 2 ** attempt  # 2, 4, 8, 16 seconds
            print(f"⚠️  DB connection failed (attempt {attempt}/5): {e} — retrying in {wait}s …")
            time.sleep(wait)

for attempt in range(1, 6):
    try:
        run_migrations()
        break
    except Exception as e:
        if attempt == 5:
            raise
        wait = 2 ** attempt
        print(f"⚠️  Migrations failed (attempt {attempt}/5): {e} — retrying in {wait}s …")
        time.sleep(wait)

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
