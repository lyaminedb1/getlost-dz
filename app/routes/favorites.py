"""
GET LOST DZ — Favorites Blueprint
/api/favorites — Wishlist management
"""
from flask import Blueprint, request, jsonify, g
from app.auth import token_required
from app.db import db_query, db_run
from app.utils import parse_offer

bp = Blueprint("favorites", __name__, url_prefix="/api")


@bp.route("/favorites", methods=["GET"])
@token_required
def get_favorites():
    """Get user's favorite offers with full offer data."""
    uid = g.user["id"]
    rows = db_query("""
        SELECT o.*, a.name agency_name, a.logo agency_logo,
               ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
               COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
        FROM favorites f
        JOIN offers o ON f.offer_id=o.id
        LEFT JOIN agencies a ON o.agency_id=a.id
        LEFT JOIN reviews r ON r.offer_id=o.id
        WHERE f.user_id=? AND o.status='approved'
        GROUP BY o.id, a.name, a.logo, f.created_at
        ORDER BY f.created_at DESC
    """, (uid,))
    return jsonify([parse_offer(o) for o in rows])


@bp.route("/favorites/ids", methods=["GET"])
@token_required
def get_favorite_ids():
    """Get list of offer IDs user has favorited (lightweight)."""
    uid = g.user["id"]
    rows = db_query("SELECT offer_id FROM favorites WHERE user_id=?", (uid,))
    return jsonify([r["offer_id"] for r in rows])


@bp.route("/favorites/<int:offer_id>", methods=["POST"])
@token_required
def toggle_favorite(offer_id):
    """Toggle favorite on/off for an offer."""
    uid = g.user["id"]
    existing = db_query(
        "SELECT id FROM favorites WHERE user_id=? AND offer_id=?",
        (uid, offer_id), one=True
    )
    if existing:
        db_run("DELETE FROM favorites WHERE user_id=? AND offer_id=?", (uid, offer_id))
        return jsonify({"favorited": False, "message": "Retiré des favoris"})
    else:
        db_run("INSERT INTO favorites(user_id, offer_id) VALUES(?,?)", (uid, offer_id))
        return jsonify({"favorited": True, "message": "Ajouté aux favoris"})
