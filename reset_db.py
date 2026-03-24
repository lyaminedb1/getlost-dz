"""
GET LOST DZ — Database Reset Script
Usage:
  Local:  python reset_db.py
  Prod:   DATABASE_URL=postgres://... python reset_db.py --confirm-production

Drops ALL tables, recreates schema, and reseeds with demo data.
"""
import os
import sys

# Safety check for production
if os.environ.get("DATABASE_URL", "").startswith("postgres"):
    if "--confirm-production" not in sys.argv:
        print("WARNING: You are about to reset the PRODUCTION database.")
        print("This will DELETE ALL DATA permanently.")
        print("")
        print("To proceed, run:")
        print("  DATABASE_URL=... python reset_db.py --confirm-production")
        sys.exit(1)
    confirm = input("Type 'RESET' to confirm production database reset: ")
    if confirm != "RESET":
        print("Cancelled.")
        sys.exit(0)

from app.config import USE_POSTGRES, SQLITE_FILE, DATABASE_URL

if USE_POSTGRES:
    import psycopg2
    url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    db = psycopg2.connect(url)
    db.autocommit = True
    cur = db.cursor()

    # Drop all tables in correct order (foreign keys)
    tables = [
        "booking_checklist", "custom_requests", "offer_departures",
        "messages", "notifications", "events", "password_resets",
        "favorites", "reviews", "bookings", "offers", "agencies", "users"
    ]
    for t in tables:
        try:
            cur.execute(f"DROP TABLE IF EXISTS {t} CASCADE")
            print(f"  Dropped {t}")
        except Exception as e:
            print(f"  Skip {t}: {e}")

    db.close()
    print("All tables dropped (PostgreSQL).")

else:
    import sqlite3
    if os.path.exists(SQLITE_FILE):
        os.remove(SQLITE_FILE)
        print(f"Deleted {SQLITE_FILE}")
    else:
        print(f"No {SQLITE_FILE} found, starting fresh.")

# Recreate and seed
print("")
print("Recreating schema and seeding data...")
from app.models.init_db import init_db, run_migrations
init_db()
run_migrations()
print("")
print("Database reset complete.")
print("")
print("Test accounts:")
print("  Admin:    admin@getlostdz.com / admin123")
print("  Agency:   agency1@getlostdz.com / agency123")
print("  Traveler: sarah@test.com / user123")
