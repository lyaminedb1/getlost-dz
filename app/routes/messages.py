from flask import Blueprint, request, jsonify, g
from app.db import db_query, db_run
from app.auth import token_required
from app.utils import send_email
from app.config import APP_URL

messages_bp = Blueprint('messages', __name__)

def can_access_booking(user, booking):
    if user['role'] == 'admin':
        return True
    if user['role'] == 'traveler' and booking['user_id'] == user['id']:
        return True
    if user['role'] == 'agency':
        agency = db_query("SELECT id FROM agencies WHERE user_id=?", (user['id'],), one=True)
        if agency and booking['agency_id'] == agency['id']:
            return True
    return False

@messages_bp.route('/bookings/<int:bid>/messages', methods=['GET'])
@token_required
def get_messages(bid):
    u = g.user
    booking = db_query(
        """SELECT b.*, o.agency_id, o.title offer_title,
           us.name traveler_name, us.email traveler_email
           FROM bookings b
           JOIN offers o ON b.offer_id=o.id
           JOIN users us ON b.user_id=us.id
           WHERE b.id=?""",
        (bid,), one=True
    )
    if not booking:
        return jsonify({'error': 'Reservation introuvable'}), 404
    if not can_access_booking(u, booking):
        return jsonify({'error': 'Acces refuse'}), 403
    db_run(
        "UPDATE messages SET read_at=CURRENT_TIMESTAMP WHERE booking_id=? AND sender_id!=? AND read_at IS NULL",
        (bid, u['id'])
    )
    messages = db_query(
        """SELECT m.*, u.name sender_name, u.role sender_role
           FROM messages m JOIN users u ON m.sender_id=u.id
           WHERE m.booking_id=? ORDER BY m.created_at ASC""",
        (bid,)
    )
    return jsonify({'messages': messages, 'booking': booking})

@messages_bp.route('/bookings/<int:bid>/messages', methods=['POST'])
@token_required
def send_message(bid):
    u = g.user
    booking = db_query(
        """SELECT b.*, o.agency_id, o.title offer_title,
           us.name traveler_name, us.email traveler_email,
           ag_u.email agency_email, ag_u.name agency_name
           FROM bookings b
           JOIN offers o ON b.offer_id=o.id
           JOIN users us ON b.user_id=us.id
           JOIN agencies ag ON o.agency_id=ag.id
           JOIN users ag_u ON ag.user_id=ag_u.id
           WHERE b.id=?""",
        (bid,), one=True
    )
    if not booking:
        return jsonify({'error': 'Reservation introuvable'}), 404
    if not can_access_booking(u, booking):
        return jsonify({'error': 'Acces refuse'}), 403
    content = (request.json or {}).get('content', '').strip()
    if not content:
        return jsonify({'error': 'Message vide'}), 400
    if len(content) > 2000:
        return jsonify({'error': 'Message trop long'}), 400
    db_run(
        "INSERT INTO messages(booking_id, sender_id, content) VALUES(?,?,?)",
        (bid, u['id'], content)
    )
    try:
        if u['role'] == 'traveler':
            recipient_email = booking['agency_email']
            recipient_name = booking['agency_name']
        else:
            recipient_email = booking['traveler_email']
            recipient_name = booking['traveler_name']
        html = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0B2340;">💬 Nouveau message</h2>
          <p>Bonjour {recipient_name}, vous avez un nouveau message pour <b>{booking['offer_title']}</b>.</p>
          <div style="background:#E6F9F7;border-radius:12px;padding:16px;border-left:4px solid #0DB9A8;">
            <p style="margin:0;font-style:italic;">"{content[:200]}{'...' if len(content)>200 else ''}"</p>
          </div>
          <a href="{APP_URL}" style="display:inline-block;margin-top:16px;background:#0DB9A8;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:700;">Repondre</a>
        </div>"""
        send_email(recipient_email, f"Nouveau message — {booking['offer_title']}", html)
    except Exception as e:
        print(f"[email] message notify error: {e}")
    return jsonify({'ok': True}), 201

@messages_bp.route('/bookings/<int:bid>/messages/unread', methods=['GET'])
@token_required
def unread_count(bid):
    u = g.user
    booking = db_query("SELECT b.*, o.agency_id FROM bookings b JOIN offers o ON b.offer_id=o.id WHERE b.id=?", (bid,), one=True)
    if not booking or not can_access_booking(u, booking):
        return jsonify({'count': 0})
    count = db_query(
        "SELECT COUNT(*) as c FROM messages WHERE booking_id=? AND sender_id!=? AND read_at IS NULL",
        (bid, u['id']), one=True
    )
    return jsonify({'count': count['c'] if count else 0})
