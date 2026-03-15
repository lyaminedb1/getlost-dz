"""
GET LOST DZ — Agencies & Bookings Blueprint
/api/agencies/* and /api/bookings/*
"""
from flask import Blueprint, request, jsonify, g
from app.db import db_query, db_run
from app.auth import token_required, admin_required
from app.utils import parse_offer, send_email
from app.config import APP_URL

bp = Blueprint("agencies", __name__, url_prefix="/api")

BOOKING_STATUSES = ["pending", "contacted", "didnt_answer", "pre_reserved", "confirmed", "completed", "cancelled"]


# ── Agencies ──────────────────────────────────────────────────────────────────

@bp.route("/agencies", methods=["GET"])
def get_agencies():
    rows = db_query("""SELECT a.*, u.email,
        COUNT(DISTINCT o.id) offer_count,
        COUNT(DISTINCT b.id) booking_count
        FROM agencies a JOIN users u ON a.user_id=u.id
        LEFT JOIN offers o ON o.agency_id=a.id AND o.status='approved'
        LEFT JOIN bookings b ON b.offer_id IN (SELECT id FROM offers WHERE agency_id=a.id)
        GROUP BY a.id, u.email ORDER BY a.id""")
    return jsonify(rows)


@bp.route("/agencies/<int:aid>", methods=["PUT"])
@token_required
def update_agency(aid):
    u = g.user
    if u["role"] == "agency":
        ag = db_query("SELECT id FROM agencies WHERE user_id=?", (u["id"],), one=True)
        if not ag or ag["id"] != aid:
            return jsonify({"error": "Forbidden"}), 403
    d = request.json or {}
    db_run("UPDATE agencies SET name=?,description=?,logo=? WHERE id=?",
           (d.get("name"), d.get("description", ""), d.get("logo", "🏢"), aid))
    return jsonify({"message": "Updated"})


@bp.route("/agencies/<int:aid>/status", methods=["PATCH"])
@admin_required
def set_agency_status(aid):
    d = request.json or {}
    if d.get("status"): db_run("UPDATE agencies SET status=? WHERE id=?", (d["status"], aid))
    if d.get("plan"):   db_run("UPDATE agencies SET plan=? WHERE id=?",   (d["plan"],   aid))
    return jsonify({"message": "Updated"})


@bp.route("/agencies/<int:aid>/offers", methods=["GET"])
@token_required
def agency_offers(aid):
    u = g.user
    if u["role"] != "admin" and u.get("agencyId") != aid:
        return jsonify({"error": "Forbidden"}), 403
    rows = db_query("""SELECT o.*,
        ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
        COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
        FROM offers o LEFT JOIN reviews r ON r.offer_id=o.id
        WHERE o.agency_id=? GROUP BY o.id ORDER BY o.id DESC""", (aid,))
    return jsonify([parse_offer(o) for o in rows])


# ── Bookings ──────────────────────────────────────────────────────────────────

@bp.route("/bookings", methods=["POST"])
@token_required
def book():
    u = g.user
    d = request.json or {}
    oid   = d.get("offerId")
    phone = (d.get("phone") or "").strip()

    if not oid:
        return jsonify({"error": "offerId required"}), 400
    if not phone:
        return jsonify({"error": "Numéro de téléphone requis"}), 400
    if len(''.join(c for c in phone if c.isdigit())) < 8:
        return jsonify({"error": "Numéro invalide (min. 8 chiffres)"}), 400
    if not db_query("SELECT id FROM offers WHERE id=? AND status='approved'", (oid,), one=True):
        return jsonify({"error": "Offer not found"}), 404

    bid = db_run(
        "INSERT INTO bookings(offer_id,user_id,phone,message) VALUES(?,?,?,?)",
        (oid, u["id"], phone, d.get("message", ""))
    )
    return jsonify({"id": bid, "message": "Réservation reçue ! L'agence vous contactera sous 24h."}), 201


@bp.route("/bookings/my", methods=["GET"])
@token_required
def my_bookings():
    rows = db_query("""SELECT b.*, o.title offer_title, o.price, o.image_url, o.category
        FROM bookings b JOIN offers o ON b.offer_id=o.id
        WHERE b.user_id=? ORDER BY b.created_at DESC""", (g.user["id"],))
    return jsonify(rows)


@bp.route("/agencies/<int:aid>/bookings", methods=["GET"])
@token_required
def agency_bookings(aid):
    u = g.user
    if u["role"] != "admin" and u.get("agencyId") != aid:
        return jsonify({"error": "Forbidden"}), 403
    rows = db_query("""SELECT b.*, o.title offer_title, o.price, o.category, o.image_url,
        u.name traveler_name, u.email traveler_email
        FROM bookings b
        JOIN offers o ON b.offer_id=o.id
        JOIN users u ON b.user_id=u.id
        WHERE o.agency_id=? ORDER BY b.created_at DESC""", (aid,))
    return jsonify(rows)


@bp.route("/bookings/<int:bid>/status", methods=["PATCH"])
@token_required
def update_booking_status(bid):
    u = g.user
    status = (request.json or {}).get("status")
    if status not in BOOKING_STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    booking = db_query("""SELECT b.*, o.agency_id, o.title offer_title,
        u2.email traveler_email, u2.name traveler_name
        FROM bookings b
        JOIN offers o ON b.offer_id=o.id
        JOIN users u2 ON b.user_id=u2.id
        WHERE b.id=?""", (bid,), one=True)
    if not booking:
        return jsonify({"error": "Not found"}), 404
    if u["role"] == "agency" and booking["agency_id"] != u.get("agencyId"):
        return jsonify({"error": "Forbidden"}), 403

    db_run("UPDATE bookings SET status=? WHERE id=?", (status, bid))

    if status == "completed":
        review_url = f"{APP_URL}/?review_booking={bid}"
        html = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">🌍</span>
            <h2 style="color:#0B2340;margin:8px 0;">Get Lost DZ</h2>
          </div>
          <div style="background:#f0fdf4;border-radius:16px;padding:24px;text-align:center;">
            <h3 style="color:#0B2340;">Votre voyage est terminé ! 🎉</h3>
            <p>Bonjour <strong>{booking['traveler_name']}</strong>,</p>
            <p>Votre réservation pour <strong>{booking['offer_title']}</strong> est confirmée comme terminée.</p>
            <p>Partagez votre expérience en laissant un avis !</p>
            <a href="{review_url}" style="display:inline-block;margin-top:16px;padding:14px 32px;
               background:#0DB9A8;color:white;border-radius:50px;text-decoration:none;font-weight:700;">
              ⭐ Laisser un avis
            </a>
          </div>
          <p style="text-align:center;color:#999;font-size:12px;margin-top:24px;">Get Lost DZ</p>
        </div>"""
        send_email(booking["traveler_email"], "🎉 Votre voyage est terminé — Laissez un avis !", html)

    return jsonify({"message": f"Booking {status}"})


@bp.route("/bookings/<int:bid>/review-check", methods=["GET"])
@token_required
def review_check(bid):
    bk = db_query("SELECT * FROM bookings WHERE id=? AND user_id=?", (bid, g.user["id"]), one=True)
    if not bk:
        return jsonify({"error": "Not found"}), 404
    existing = db_query("SELECT id FROM reviews WHERE booking_id=?", (bid,), one=True)
    return jsonify({"booking": bk, "already_reviewed": bool(existing)})
