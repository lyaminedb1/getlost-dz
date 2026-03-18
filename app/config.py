"""
GET LOST DZ — Configuration
All environment variables and constants live here.
Never import os.environ anywhere else.
"""
import os

# ── Security ────────────────────────────────────────────────────────────────
JWT_SECRET   = os.environ.get("JWT_SECRET", "getlostdz_jwt_secret_dev_only")
JWT_DAYS     = 7

# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "")
USE_POSTGRES = DATABASE_URL.startswith("postgres")
SQLITE_FILE  = "getlost.db"

# ── Email (Brevo) ─────────────────────────────────────────────────────────────
MAIL_FROM = os.environ.get("MAIL_FROM", "noreply@getlostdz.com")
MAIL_PASS = os.environ.get("MAIL_PASS", "")   # Brevo API key v3
APP_URL   = os.environ.get("APP_URL", "https://getlost-dz.onrender.com")

# ── Rate limits (requests / period) ─────────────────────────────────────────
LIMIT_LOGIN          = "10 per minute"
LIMIT_REGISTER       = "10 per hour"
LIMIT_FORGOT         = "5 per hour"
LIMIT_EVENTS         = "300 per minute"
LIMIT_DEFAULT_WRITE  = "60 per minute"

# ── Cloudinary ──────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD   = os.environ.get("CLOUDINARY_CLOUD", "dcsrbxpox")
CLOUDINARY_KEY     = os.environ.get("CLOUDINARY_KEY", "578172511394673")
CLOUDINARY_SECRET  = os.environ.get("CLOUDINARY_SECRET", "W0u33E-UE5Arjs6Eu1MSeb-rtXQ")
