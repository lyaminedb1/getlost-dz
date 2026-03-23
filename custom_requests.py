"""
GET LOST DZ — Custom Requests & Booking Checklist Blueprint
/api/custom-requests/* and /api/bookings/*/checklist
"""
import json
from flask import Blueprint, request, jsonify, g
from app.db import db_query, db_run
from app.auth import token_required
from app.routes.notification_helpers import notify_new_message

bp = Blueprint("custom_requests", __name__, url_prefix="/api")


# ── Custom Travel Requests ────────────────────────────────────────────────────

@bp.route("/agencies/<int:aid>/custom-requests", methods=["POST"])
def create_custom_request(aid):
    """Public — anyone can submit a custom travel request to an agency."""
    agency = db_query("SELECT id FROM agencies WHERE id=? AND status='approved'", (aid,), one=True)
    if not agency:
        return jsonify({"error": "Agence non trouvee"}), 404

    d = request.json or {}
    name = (d.get("name") or "").strip()
    email = (d.get("email") or "").strip()
    month = (d.get("month") or "").strip()

    if not name or not email or not month:
        return jsonify({"error": "Nom, email et mois requis"}), 400

    travelers = d.get("travelers", [])
    if not isinstance(travelers, list):
        travelers = []

    uid = None
    token = request.headers.get("Authorization", "")
    if token:
        try:
            import jwt
            from app.config import JWT_SECRET
            payload = jwt.decode(token.replace("Bearer ", ""), JWT_SECRET, algorithms=["HS256"])
            uid = payload.get("id")
        except Exception:
            pass

    rid = db_run(
        """INSERT INTO custom_requests(agency_id,user_id,name,email,phone,month,travelers,budget,duration,style,safari,message)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
        (aid, uid, name, email, d.get("phone", ""), month,
         json.dumps(travelers), d.get("budget", ""), d.get("duration", ""),
         d.get("style", ""), d.get("safari", ""), d.get("message", ""))
    )

    # Notify agency
    try:
        ag_user = db_query("SELECT user_id FROM agencies WHERE id=?", (aid,), one=True)
        if ag_user:
            notify_new_message(ag_user["user_id"], name, None)
    except Exception:
        pass

    return jsonify({"id": rid, "message": "Demande envoyee ! L'agence vous contactera."}), 201


@bp.route("/agencies/<int:aid>/custom-requests", methods=["GET"])
@token_required
def get_custom_requests(aid):
    """Agency sees their custom requests."""
    u = g.user
    if u["role"] != "admin" and u.get("agencyId") != aid:
        return jsonify({"error": "Forbidden"}), 403
    rows = db_query(
        "SELECT * FROM custom_requests WHERE agency_id=? ORDER BY created_at DESC", (aid,))
    for r in rows:
        try:
            r["travelers"] = json.loads(r.get("travelers") or "[]")
        except Exception:
            r["travelers"] = []
    return jsonify(rows)


@bp.route("/custom-requests/<int:rid>/status", methods=["PATCH"])
@token_required
def update_custom_request_status(rid):
    """Agency updates status + notes on a custom request."""
    u = g.user
    req = db_query("SELECT * FROM custom_requests WHERE id=?", (rid,), one=True)
    if not req:
        return jsonify({"error": "Not found"}), 404
    if u["role"] != "admin" and u.get("agencyId") != req["agency_id"]:
        return jsonify({"error": "Forbidden"}), 403
    d = request.json or {}
    if d.get("status"):
        db_run("UPDATE custom_requests SET status=? WHERE id=?", (d["status"], rid))
    if "agency_notes" in d:
        db_run("UPDATE custom_requests SET agency_notes=? WHERE id=?", (d["agency_notes"], rid))
    return jsonify({"message": "Mis a jour"})


# ── Booking Checklist ─────────────────────────────────────────────────────────

@bp.route("/bookings/<int:bid>/checklist", methods=["GET"])
@token_required
def get_checklist(bid):
    """Get the checklist for a booking. Creates one if it doesn't exist."""
    u = g.user
    booking = db_query(
        "SELECT b.*, o.agency_id, o.price FROM bookings b JOIN offers o ON b.offer_id=o.id WHERE b.id=?",
        (bid,), one=True)
    if not booking:
        return jsonify({"error": "Not found"}), 404
    if u["role"] == "agency" and booking["agency_id"] != u.get("agencyId"):
        return jsonify({"error": "Forbidden"}), 403

    cl = db_query("SELECT * FROM booking_checklist WHERE booking_id=?", (bid,), one=True)
    if not cl:
        db_run(
            "INSERT INTO booking_checklist(booking_id,amount_total) VALUES(?,?)",
            (bid, booking.get("price", 0)))
        cl = db_query("SELECT * FROM booking_checklist WHERE booking_id=?", (bid,), one=True)
    return jsonify(cl)


@bp.route("/bookings/<int:bid>/checklist", methods=["PUT"])
@token_required
def update_checklist(bid):
    """Agency updates the checklist for a booking."""
    u = g.user
    booking = db_query(
        "SELECT b.*, o.agency_id FROM bookings b JOIN offers o ON b.offer_id=o.id WHERE b.id=?",
        (bid,), one=True)
    if not booking:
        return jsonify({"error": "Not found"}), 404
    if u["role"] == "agency" and booking["agency_id"] != u.get("agencyId"):
        return jsonify({"error": "Forbidden"}), 403

    d = request.json or {}
    fields = ["flight", "hotel", "visa", "activities", "guides", "insurance",
              "group_type", "amount_paid", "amount_total", "notes"]

    # Ensure checklist row exists
    existing = db_query("SELECT id FROM booking_checklist WHERE booking_id=?", (bid,), one=True)
    if not existing:
        db_run("INSERT INTO booking_checklist(booking_id) VALUES(?)", (bid,))

    sets = []
    args = []
    for f in fields:
        if f in d:
            sets.append(f"{f}=?")
            args.append(d[f])
    if sets:
        sets.append("updated_at=CURRENT_TIMESTAMP")
        args.append(bid)
        db_run(f"UPDATE booking_checklist SET {','.join(sets)} WHERE booking_id=?", tuple(args))

    cl = db_query("SELECT * FROM booking_checklist WHERE booking_id=?", (bid,), one=True)
    return jsonify(cl)
