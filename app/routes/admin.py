"""
GET LOST DZ — Admin Blueprint
/api/admin/* (stats, offers, reviews, bookings, users)
"""
from flask import Blueprint, request, jsonify
from app.db import db_query, db_run
from app.auth import admin_required
from app.utils import parse_offer

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.route("/stats", methods=["GET"])
@admin_required
def admin_stats():
    def cnt(sql, args=()):
        r = db_query(sql, args, one=True)
        return r["c"] if r else 0
    return jsonify({
        "total_offers":    cnt("SELECT COUNT(*) c FROM offers"),
        "pending_offers":  cnt("SELECT COUNT(*) c FROM offers WHERE status='pending'"),
        "approved_offers": cnt("SELECT COUNT(*) c FROM offers WHERE status='approved'"),
        "total_agencies":  cnt("SELECT COUNT(*) c FROM agencies"),
        "total_travelers": cnt("SELECT COUNT(*) c FROM users WHERE role='traveler'"),
        "total_reviews":   cnt("SELECT COUNT(*) c FROM reviews"),
        "pending_reviews": cnt("SELECT COUNT(*) c FROM reviews WHERE status='pending'"),
        "total_bookings":  cnt("SELECT COUNT(*) c FROM bookings"),
    })


@bp.route("/offers", methods=["GET"])
@admin_required
def admin_offers():
    rows = db_query("""SELECT o.*, a.name agency_name,
        ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
        COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
        FROM offers o LEFT JOIN agencies a ON o.agency_id=a.id
        LEFT JOIN reviews r ON r.offer_id=o.id
        GROUP BY o.id, a.name ORDER BY o.id DESC""")
    return jsonify([parse_offer(o) for o in rows])


@bp.route("/reviews", methods=["GET"])
@admin_required
def admin_reviews():
    rows = db_query("""SELECT r.*, u.name user_name, o.title offer_title
        FROM reviews r
        JOIN users u ON r.user_id=u.id
        JOIN offers o ON r.offer_id=o.id
        ORDER BY (r.status='pending') DESC, r.created_at DESC""")
    return jsonify(rows)


@bp.route("/bookings", methods=["GET"])
@admin_required
def admin_bookings():
    rows = db_query("""SELECT b.*, o.title offer_title, o.price, o.category,
        u.name traveler_name, u.email traveler_email,
        a.name agency_name
        FROM bookings b
        JOIN offers o ON b.offer_id=o.id
        JOIN users u ON b.user_id=u.id
        JOIN agencies a ON o.agency_id=a.id
        ORDER BY b.created_at DESC""")
    return jsonify(rows)


@bp.route("/users", methods=["GET"])
@admin_required
def admin_users():
    rows = db_query("SELECT id,name,email,role,created_at FROM users ORDER BY id")
    return jsonify(rows)


@bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def admin_delete_user(user_id):
    user = db_query("SELECT id, role FROM users WHERE id=?", (user_id,), one=True)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    if user["role"] == "admin":
        return jsonify({"error": "Impossible de supprimer un administrateur"}), 403
    db_run("DELETE FROM users WHERE id=?", (user_id,))
    return jsonify({"message": "Utilisateur supprimé"}), 200
