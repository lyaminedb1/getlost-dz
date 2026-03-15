"""
GET LOST DZ — Auth helpers
JWT creation + token_required / admin_required decorators.
Imported by all route blueprints that need authentication.
"""
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from app.config import JWT_SECRET, JWT_DAYS


def make_token(user, agency_id=None):
    payload = {
        "id":       user["id"],
        "name":     user["name"],
        "email":    user["email"],
        "role":     user["role"],
        "agencyId": agency_id,
        "exp":      datetime.now(timezone.utc) + timedelta(days=JWT_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        raw = request.headers.get("Authorization", "")
        token = raw.replace("Bearer ", "").strip()
        if not token:
            return jsonify({"error": "Token required"}), 401
        try:
            g.user = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    @token_required
    def wrapper(*args, **kwargs):
        if g.user.get("role") != "admin":
            return jsonify({"error": "Admin only"}), 403
        return f(*args, **kwargs)
    return wrapper
