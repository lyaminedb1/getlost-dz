"""
GET LOST DZ — Notifications Blueprint
/api/notifications/*

Endpoints:
  GET    /notifications           — paginated list (newest first)
  GET    /notifications/count     — unread count (for badge polling)
  PATCH  /notifications/<id>/read — mark one as read
  PATCH  /notifications/read-all  — mark all as read
"""
from flask import Blueprint, request, jsonify, g
from app.db import db_query, db_run
from app.auth import token_required

bp = Blueprint("notifications", __name__, url_prefix="/api")


@bp.route("/notifications", methods=["GET"])
@token_required
def list_notifications():
    uid = g.user["id"]
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)
    offset = (page - 1) * per_page

    total_row = db_query(
        "SELECT COUNT(*) as c FROM notifications WHERE user_id=?", (uid,), one=True
    )
    total = total_row["c"] if total_row else 0

    rows = db_query(
        """SELECT id, type, title, body, link, ref_id, read_at, created_at
           FROM notifications WHERE user_id=?
           ORDER BY created_at DESC LIMIT ? OFFSET ?""",
        (uid, per_page, offset)
    )

    # Ensure datetimes are strings
    for r in rows:
        for k in ("read_at", "created_at"):
            if r.get(k) is not None:
                r[k] = str(r[k])

    return jsonify({"notifications": rows, "total": total, "page": page, "per_page": per_page})


@bp.route("/notifications/count", methods=["GET"])
@token_required
def unread_count():
    uid = g.user["id"]
    row = db_query(
        "SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND read_at IS NULL",
        (uid,), one=True
    )
    return jsonify({"unread": row["c"] if row else 0})


@bp.route("/notifications/<int:nid>/read", methods=["PATCH"])
@token_required
def mark_read(nid):
    uid = g.user["id"]
    db_run(
        "UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND read_at IS NULL",
        (nid, uid)
    )
    return jsonify({"ok": True})


@bp.route("/notifications/read-all", methods=["PATCH"])
@token_required
def mark_all_read():
    uid = g.user["id"]
    db_run(
        "UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL",
        (g.user["id"],)
    )
    return jsonify({"ok": True})
