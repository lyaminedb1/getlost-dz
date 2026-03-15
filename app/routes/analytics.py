"""
GET LOST DZ — Analytics Blueprint
POST /api/events                     — fire-and-forget tracking
GET  /api/admin/analytics            — full BI dashboard data
GET  /api/agencies/:id/analytics     — per-agency analytics
"""
import json
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, g
from app.db import db_query, db_run
from app.auth import token_required, admin_required
from app.config import USE_POSTGRES

bp = Blueprint("analytics", __name__, url_prefix="/api")


def _parse_ua(ua):
    """Detect device type and browser from User-Agent string."""
    device  = "mobile"  if any(x in ua for x in ["iPhone", "Android", "Mobile"]) \
              else "tablet" if "iPad" in ua \
              else "desktop"
    browser = "Chrome"  if "Chrome"  in ua \
              else "Safari"  if "Safari"  in ua \
              else "Firefox" if "Firefox" in ua \
              else "Other"
    return device, browser


def _parse_referrer(ref):
    r = ref.lower()
    if "instagram" in r: return "instagram"
    if "facebook"  in r: return "facebook"
    if "google"    in r: return "google"
    if not ref:          return "direct"
    return "other"


# ── Event tracking ────────────────────────────────────────────────────────────

@bp.route("/events", methods=["POST"])
def track_event():
    d = request.json or {}
    ev_type = d.get("type", "")
    if not ev_type:
        return jsonify({"ok": False}), 400

    ua = request.headers.get("User-Agent", "")
    device, browser = _parse_ua(ua)
    source = _parse_referrer(request.headers.get("Referer", ""))

    db_run("""INSERT INTO events(type,offer_id,user_id,session_id,device,browser,
              referrer,lang,search_query,filter_cat,metadata) VALUES(?,?,?,?,?,?,?,?,?,?,?)""", (
        ev_type,
        d.get("offer_id"),
        d.get("user_id"),
        d.get("session_id", ""),
        device,
        browser,
        source,
        d.get("lang", "fr"),
        d.get("search_query", ""),
        d.get("filter_cat", ""),
        json.dumps(d.get("metadata", {})),
    ))
    return jsonify({"ok": True})


# ── Admin analytics ───────────────────────────────────────────────────────────

@bp.route("/admin/analytics", methods=["GET"])
@admin_required
def admin_analytics():
    days  = int(request.args.get("days", 30))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    prev  = (datetime.now(timezone.utc) - timedelta(days=days * 2)).strftime("%Y-%m-%d")

    def q(sql, args=()):  return db_query(sql, args)
    def cnt(sql, args=()):
        r = db_query(sql, args, one=True)
        return r["c"] if r else 0

    # ── Traffic ──────────────────────────────────────────────────────────────
    daily = q("""SELECT DATE(created_at) as day, COUNT(*) as events,
        COUNT(DISTINCT session_id) as sessions
        FROM events WHERE created_at >= ?
        GROUP BY DATE(created_at) ORDER BY day""", (since,))

    hourly = q("""SELECT EXTRACT(HOUR FROM created_at)::int as hour,
        COUNT(*) as c FROM events WHERE created_at >= ?
        GROUP BY hour ORDER BY hour""", (since,)) \
        if USE_POSTGRES else \
        q("""SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as c FROM events WHERE created_at >= ?
        GROUP BY hour ORDER BY hour""", (since,))

    devices  = q("SELECT device,  COUNT(*) as c FROM events WHERE created_at >= ? GROUP BY device",  (since,))
    browsers = q("SELECT browser, COUNT(*) as c FROM events WHERE created_at >= ? GROUP BY browser", (since,))
    sources  = q("SELECT referrer as source, COUNT(*) as c FROM events WHERE created_at >= ? GROUP BY referrer ORDER BY c DESC", (since,))
    langs    = q("SELECT lang, COUNT(*) as c FROM events WHERE created_at >= ? GROUP BY lang", (since,))
    searches = q("""SELECT search_query, COUNT(*) as c FROM events
        WHERE type='search' AND search_query!='' AND created_at >= ?
        GROUP BY search_query ORDER BY c DESC LIMIT 10""", (since,))
    filters  = q("""SELECT filter_cat, COUNT(*) as c FROM events
        WHERE type='filter_used' AND filter_cat!='' AND created_at >= ?
        GROUP BY filter_cat ORDER BY c DESC""", (since,))

    # ── Funnel ───────────────────────────────────────────────────────────────
    funnel = {
        "offer_views":     cnt("SELECT COUNT(*) as c FROM events WHERE type='offer_view'      AND created_at >= ?", (since,)),
        "booking_started": cnt("SELECT COUNT(*) as c FROM events WHERE type='booking_started' AND created_at >= ?", (since,)),
        "booking_done":    cnt("SELECT COUNT(*) as c FROM events WHERE type='booking_done'    AND created_at >= ?", (since,)),
    }
    total_events   = cnt("SELECT COUNT(*)                   as c FROM events WHERE created_at >= ?",          (since,))
    total_sessions = cnt("SELECT COUNT(DISTINCT session_id) as c FROM events WHERE created_at >= ?",          (since,))

    # ── Top offers (traffic-based) ────────────────────────────────────────────
    top_offers = q("""SELECT o.title, o.id, a.name agency_name,
        COUNT(e.id) as views,
        COUNT(CASE WHEN e.type='booking_started' THEN 1 END) as bookings_started,
        COUNT(CASE WHEN e.type='booking_done'    THEN 1 END) as bookings_done
        FROM events e
        JOIN offers o ON e.offer_id=o.id
        LEFT JOIN agencies ag ON o.agency_id=ag.id
        LEFT JOIN users a ON ag.user_id=a.id
        WHERE e.created_at >= ? AND e.type IN ('offer_view','booking_started','booking_done')
        GROUP BY o.id, o.title, a.name ORDER BY views DESC LIMIT 10""", (since,))

    # ── Agency leaderboard ────────────────────────────────────────────────────
    agency_leaderboard = q("""
        SELECT ag.id, ag.name, ag.logo, ag.plan,
            COUNT(DISTINCT o.id)  as offer_count,
            COUNT(DISTINCT b.id)  as booking_count,
            COUNT(DISTINCT CASE WHEN b.status='completed'  THEN b.id END) as completed_count,
            COUNT(DISTINCT CASE WHEN b.status='cancelled'  THEN b.id END) as cancelled_count,
            COUNT(DISTINCT CASE WHEN b.status='pending'    THEN b.id END) as pending_bookings,
            COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN o.price END), 0) as revenue,
            ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END), 1) as avg_rating,
            COUNT(DISTINCT r.id) as review_count
        FROM agencies ag
        LEFT JOIN offers   o  ON o.agency_id  = ag.id
        LEFT JOIN bookings b  ON b.offer_id   = o.id
        LEFT JOIN reviews  r  ON r.offer_id   = o.id
        GROUP BY ag.id, ag.name, ag.logo, ag.plan
        ORDER BY revenue DESC, booking_count DESC""")

    # ── Revenue timeline ──────────────────────────────────────────────────────
    revenue_daily = q("""
        SELECT DATE(b.created_at) as day,
            COUNT(b.id) as bookings,
            COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN o.price ELSE 0 END), 0) as revenue
        FROM bookings b JOIN offers o ON b.offer_id=o.id
        WHERE b.created_at >= ?
        GROUP BY DATE(b.created_at) ORDER BY day""", (since,))

    # ── Platform health ───────────────────────────────────────────────────────
    booking_statuses = q("SELECT status, COUNT(*) as c FROM bookings WHERE created_at >= ? GROUP BY status ORDER BY c DESC", (since,))
    offer_categories = q("""SELECT category, COUNT(*) as c, COALESCE(SUM(views), 0) as views
        FROM offers WHERE status='approved' GROUP BY category ORDER BY c DESC""")

    # ── Growth (current vs previous period) ──────────────────────────────────
    new_users_curr    = cnt("SELECT COUNT(*) as c FROM users    WHERE role='traveler' AND created_at >= ?",                  (since,))
    new_users_prev    = cnt("SELECT COUNT(*) as c FROM users    WHERE role='traveler' AND created_at >= ? AND created_at < ?", (prev, since))
    new_bookings_curr = cnt("SELECT COUNT(*) as c FROM bookings WHERE created_at >= ?",                                       (since,))
    new_bookings_prev = cnt("SELECT COUNT(*) as c FROM bookings WHERE created_at >= ? AND created_at < ?",                    (prev, since))
    total_revenue     = cnt("SELECT COALESCE(SUM(o.price),0) as c FROM bookings b JOIN offers o ON b.offer_id=o.id WHERE b.status IN ('confirmed','completed')")
    period_revenue    = cnt("SELECT COALESCE(SUM(o.price),0) as c FROM bookings b JOIN offers o ON b.offer_id=o.id WHERE b.status IN ('confirmed','completed') AND b.created_at >= ?", (since,))
    user_growth       = q("SELECT DATE(created_at) as day, COUNT(*) as c FROM users WHERE role='traveler' AND created_at >= ? GROUP BY DATE(created_at) ORDER BY day", (since,))

    # ── Demographics ─────────────────────────────────────────────────────────
    top_cities   = q("SELECT city,   COUNT(*) as c FROM users WHERE role='traveler' AND city   != '' AND city   IS NOT NULL GROUP BY city   ORDER BY c DESC LIMIT 10")
    gender_stats = q("SELECT gender, COUNT(*) as c FROM users WHERE role='traveler' AND gender != '' AND gender IS NOT NULL GROUP BY gender")

    return jsonify({
        "daily": daily, "hourly": hourly, "devices": devices, "browsers": browsers,
        "sources": sources, "langs": langs, "searches": searches, "filters": filters,
        "funnel": funnel, "total_events": total_events, "total_sessions": total_sessions,
        "top_offers": top_offers,
        "agency_leaderboard": agency_leaderboard,
        "revenue_daily": revenue_daily, "booking_statuses": booking_statuses,
        "offer_categories": offer_categories,
        "total_revenue": total_revenue, "period_revenue": period_revenue,
        "new_users_curr": new_users_curr, "new_users_prev": new_users_prev,
        "new_bookings_curr": new_bookings_curr, "new_bookings_prev": new_bookings_prev,
        "user_growth": user_growth, "top_cities": top_cities, "gender_stats": gender_stats,
    })


# ── Agency analytics ──────────────────────────────────────────────────────────

@bp.route("/agencies/<int:aid>/analytics", methods=["GET"])
@token_required
def agency_analytics(aid):
    u = g.user
    if u["role"] != "admin" and u.get("agencyId") != aid:
        return jsonify({"error": "Forbidden"}), 403

    days  = int(request.args.get("days", 30))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    offer_ids = [o["id"] for o in db_query("SELECT id FROM offers WHERE agency_id=?", (aid,))]
    if not offer_ids:
        return jsonify({
            "daily": [], "top_offers": [],
            "funnel": {"offer_views": 0, "booking_started": 0, "booking_done": 0}
        })

    ph = ",".join(["?" for _ in offer_ids])  # e.g. "?,?,?"
    ids_since = offer_ids + [since]

    daily = db_query(f"""SELECT DATE(created_at) as day, COUNT(*) as events,
        COUNT(DISTINCT session_id) as sessions
        FROM events WHERE offer_id IN ({ph}) AND created_at >= ?
        GROUP BY DATE(created_at) ORDER BY day""", ids_since)

    top_offers = db_query(f"""SELECT o.title, o.id,
        COUNT(e.id) as views,
        COUNT(CASE WHEN e.type='booking_started' THEN 1 END) as bookings_started,
        COUNT(CASE WHEN e.type='booking_done'    THEN 1 END) as bookings_done
        FROM events e JOIN offers o ON e.offer_id=o.id
        WHERE e.offer_id IN ({ph}) AND e.created_at >= ?
        GROUP BY o.id, o.title ORDER BY views DESC""", ids_since)

    def fc(ev_type):
        r = db_query(f"SELECT COUNT(*) as c FROM events WHERE type=? AND offer_id IN ({ph}) AND created_at >= ?",
                     [ev_type] + ids_since, one=True)
        return r["c"] if r else 0

    return jsonify({
        "daily": daily,
        "top_offers": top_offers,
        "funnel": {
            "offer_views":     fc("offer_view"),
            "booking_started": fc("booking_started"),
            "booking_done":    fc("booking_done"),
        }
    })
