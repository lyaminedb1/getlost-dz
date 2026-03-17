"""
GET LOST DZ — Offers & Reviews Blueprint
/api/offers/* and /api/reviews/*
"""
import json
from flask import Blueprint, request, jsonify, g
from app.db import db_query, db_run
from app.auth import token_required, admin_required
from app.utils import parse_offer, validate
from app.routes.notification_helpers import notify_admins_new_offer, notify_admins_new_review

bp = Blueprint("offers", __name__, url_prefix="/api")


# ── Offers ────────────────────────────────────────────────────────────────────

@bp.route("/offers", methods=["GET"])
def get_offers():
    cat    = request.args.get("category", "")
    search = request.args.get("search", "")
    sort   = request.args.get("sort", "rating")
    status = request.args.get("status", "approved")

    sql = """SELECT o.*, a.name agency_name, a.logo agency_logo,
             ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
             COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
             FROM offers o
             LEFT JOIN agencies a ON o.agency_id=a.id
             LEFT JOIN reviews r ON r.offer_id=o.id
             WHERE o.status=?"""
    args = [status]
    if cat:
        sql += " AND o.category=?"; args.append(cat)
    if search:
        sql += " AND (o.title LIKE ? OR o.region LIKE ?)"; args += [f"%{search}%", f"%{search}%"]
    sql += " GROUP BY o.id, a.name, a.logo"
    sql += {
        "price_asc":  " ORDER BY o.price ASC",
        "price_desc": " ORDER BY o.price DESC",
    }.get(sort, " ORDER BY avg_rating DESC NULLS LAST, o.id DESC")
    return jsonify([parse_offer(o) for o in db_query(sql, args)])


@bp.route("/offers/<int:oid>", methods=["GET"])
def get_offer(oid):
    o = db_query("""SELECT o.*, a.name agency_name, a.logo agency_logo, a.description agency_desc,
             ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
             COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
             FROM offers o LEFT JOIN agencies a ON o.agency_id=a.id
             LEFT JOIN reviews r ON r.offer_id=o.id
             WHERE o.id=? GROUP BY o.id, a.name, a.logo, a.description""", (oid,), one=True)
    if not o:
        return jsonify({"error": "Not found"}), 404
    db_run("UPDATE offers SET views=views+1 WHERE id=?", (oid,))
    return jsonify(parse_offer(o))


@bp.route("/offers", methods=["POST"])
@token_required
def create_offer():
    u = g.user
    if u["role"] not in ["agency", "admin"]:
        return jsonify({"error": "Agency required"}), 403
    d = request.json or {}

    ok, err = validate(d, {
        "title":    {"required": True, "type": str, "min": 3, "max": 200},
        "category": {"required": True, "type": str},
        "price":    {"required": True},
        "region":   {"required": True, "type": str, "min": 2},
    })
    if not ok:
        return jsonify({"error": err}), 400

    ag_id = u.get("agencyId")
    if not ag_id:
        ag = db_query("SELECT id FROM agencies WHERE user_id=?", (u["id"],), one=True)
        if ag: ag_id = ag["id"]
    if not ag_id:
        return jsonify({"error": "No agency found"}), 400

    oid = db_run("""INSERT INTO offers(agency_id,title,category,price,duration,region,description,
        image_url,itinerary,includes,available_dates,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""", (
        ag_id, d["title"], d["category"], int(d["price"]), int(d.get("duration", 1)),
        d["region"], d.get("description", ""), d.get("imageUrl", ""),
        json.dumps(d.get("itinerary", [])), json.dumps(d.get("includes", [])),
        json.dumps(d.get("dates", [])), "pending"
    ))
    # Notify admins
    try:
        ag = db_query("SELECT name FROM agencies WHERE id=?", (ag_id,), one=True)
        notify_admins_new_offer(ag["name"] if ag else "Agence", d["title"], oid)
    except Exception as e:
        print(f"[notif] new offer error: {e}")
    return jsonify({"id": oid, "message": "Offer submitted for validation"}), 201


@bp.route("/offers/<int:oid>", methods=["PUT"])
@token_required
def update_offer(oid):
    u = g.user
    offer = db_query("SELECT * FROM offers WHERE id=?", (oid,), one=True)
    if not offer:
        return jsonify({"error": "Not found"}), 404
    if u["role"] == "agency" and offer["agency_id"] != u.get("agencyId"):
        return jsonify({"error": "Forbidden"}), 403
    d = request.json or {}
    db_run("""UPDATE offers SET title=?,category=?,price=?,duration=?,region=?,
              description=?,image_url=?,itinerary=?,includes=?,available_dates=? WHERE id=?""", (
        d.get("title", offer["title"]), d.get("category", offer["category"]),
        int(d.get("price", offer["price"])), int(d.get("duration", offer["duration"])),
        d.get("region", offer["region"]), d.get("description", offer["description"]),
        d.get("imageUrl", offer["image_url"]),
        json.dumps(d.get("itinerary", [])), json.dumps(d.get("includes", [])),
        json.dumps(d.get("dates", [])), oid
    ))
    return jsonify({"message": "Updated"})


@bp.route("/offers/<int:oid>", methods=["DELETE"])
@token_required
def delete_offer(oid):
    u = g.user
    offer = db_query("SELECT * FROM offers WHERE id=?", (oid,), one=True)
    if not offer:
        return jsonify({"error": "Not found"}), 404
    if u["role"] == "agency" and offer["agency_id"] != u.get("agencyId"):
        return jsonify({"error": "Forbidden"}), 403
    db_run("DELETE FROM reviews WHERE offer_id=?", (oid,))
    db_run("DELETE FROM bookings WHERE offer_id=?", (oid,))
    db_run("DELETE FROM offers WHERE id=?", (oid,))
    return jsonify({"message": "Deleted"})


@bp.route("/offers/<int:oid>/status", methods=["PATCH"])
@admin_required
def set_offer_status(oid):
    status = (request.json or {}).get("status")
    if status not in ["approved", "rejected", "pending"]:
        return jsonify({"error": "Invalid status"}), 400
    db_run("UPDATE offers SET status=? WHERE id=?", (status, oid))
    return jsonify({"message": f"Offer {status}"})


# ── Reviews ───────────────────────────────────────────────────────────────────

@bp.route("/offers/<int:oid>/reviews", methods=["GET"])
def get_reviews(oid):
    rows = db_query("""SELECT r.*, u.name user_name FROM reviews r
        JOIN users u ON r.user_id=u.id
        WHERE r.offer_id=? AND r.status='approved'
        ORDER BY r.created_at DESC""", (oid,))
    return jsonify(rows)


@bp.route("/offers/<int:oid>/reviews", methods=["POST"])
@token_required
def create_review(oid):
    u = g.user
    d = request.json or {}
    rating  = int(d.get("rating", 0))
    title   = (d.get("title") or "").strip()
    comment = (d.get("comment") or "").strip()
    photo   = (d.get("photo") or "")
    bid     = d.get("booking_id")

    if not rating or not title:
        return jsonify({"error": "Note et titre requis"}), 400
    if not (1 <= rating <= 5):
        return jsonify({"error": "Note entre 1 et 5"}), 400

    if bid:
        bk = db_query("SELECT id FROM bookings WHERE id=? AND user_id=? AND status='completed'",
                      (bid, u["id"]), one=True)
        if not bk:
            return jsonify({"error": "Réservation non trouvée ou non complétée"}), 403
        if db_query("SELECT id FROM reviews WHERE booking_id=?", (bid,), one=True):
            return jsonify({"error": "Vous avez déjà laissé un avis pour cette réservation"}), 409

    rid = db_run(
        "INSERT INTO reviews(offer_id,user_id,booking_id,rating,title,comment,photo,status) VALUES(?,?,?,?,?,?,?,?)",
        (oid, u["id"], bid, rating, title, comment, photo, "approved")
    )
    # Notify admins
    try:
        offer = db_query("SELECT title FROM offers WHERE id=?", (oid,), one=True)
        notify_admins_new_review(u["name"], offer["title"] if offer else "Offre", rid)
    except Exception as e:
        print(f"[notif] new review error: {e}")
    return jsonify({"id": rid, "message": "Avis publié !"}), 201


@bp.route("/reviews/<int:rid>/status", methods=["PATCH"])
@admin_required
def set_review_status(rid):
    status = (request.json or {}).get("status")
    if status not in ["approved", "rejected"]:
        return jsonify({"error": "Invalid status"}), 400
    db_run("UPDATE reviews SET status=? WHERE id=?", (status, rid))
    return jsonify({"message": f"Review {status}"})


@bp.route("/reviews/<int:rid>/reply", methods=["PATCH"])
@token_required
def reply_review(rid):
    if g.user["role"] != "agency":
        return jsonify({"error": "Forbidden"}), 403
    reply = (request.json or {}).get("reply", "").strip()
    review = db_query("""SELECT r.* FROM reviews r
        JOIN offers o ON r.offer_id=o.id
        JOIN agencies a ON o.agency_id=a.id
        WHERE r.id=? AND a.user_id=?""", (rid, g.user["id"]), one=True)
    if not review:
        return jsonify({"error": "Not found"}), 404
    db_run("UPDATE reviews SET agency_reply=? WHERE id=?", (reply, rid))
    return jsonify({"message": "Réponse publiée"})
