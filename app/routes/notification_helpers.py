"""
GET LOST DZ — Notification helpers
Called from booking / message / offer / auth routes to create notifications.
Uses db_run (? placeholders, auto-converted for PG).
"""
from app.db import db_run, db_query


def notify(user_id, notif_type, title, body=None, link=None, ref_id=None):
    """Insert a notification row. Returns the new id."""
    return db_run(
        "INSERT INTO notifications(user_id, type, title, body, link, ref_id) VALUES(?,?,?,?,?,?)",
        (user_id, notif_type, title, body, link, ref_id)
    )


def _admin_ids():
    """Return list of admin user IDs."""
    rows = db_query("SELECT id FROM users WHERE role='admin'")
    return [r['id'] for r in rows]


def notify_agency_new_booking(agency_user_id, traveler_name, offer_title, booking_id):
    """Notify agency owner when a traveler books one of their offers."""
    notify(
        user_id=agency_user_id,
        notif_type='new_booking',
        title='Nouvelle réservation',
        body=f'{traveler_name} a réservé "{offer_title}"',
        link='/dash?tab=bookings',
        ref_id=booking_id
    )


def notify_traveler_status_change(traveler_id, offer_title, new_status, booking_id):
    """Notify traveler when booking status changes."""
    status_labels = {
        'confirmed': 'confirmée',
        'cancelled': 'annulée',
        'completed': 'terminée',
        'contacted': 'contactée',
        'pre_reserved': 'pré-réservée',
    }
    label = status_labels.get(new_status, new_status)
    notify(
        user_id=traveler_id,
        notif_type='booking_status',
        title=f'Réservation {label}',
        body=f'Votre réservation pour "{offer_title}" a été {label}',
        link='/dash?tab=bookings',
        ref_id=booking_id
    )


def notify_new_message(recipient_id, sender_name, booking_id):
    """Notify user of a new message in a booking conversation."""
    notify(
        user_id=recipient_id,
        notif_type='new_message',
        title='Nouveau message',
        body=f'{sender_name} vous a envoyé un message',
        link=f'/dash?tab=bookings&chat={booking_id}',
        ref_id=booking_id
    )


# ── Admin notifications ──────────────────────────────────────────────────────

def notify_admins_new_offer(agency_name, offer_title, offer_id):
    """Notify all admins when an agency submits a new offer."""
    for aid in _admin_ids():
        notify(
            user_id=aid,
            notif_type='new_offer',
            title='Nouvelle offre soumise',
            body=f'{agency_name} a soumis "{offer_title}"',
            link='/admin?tab=offers',
            ref_id=offer_id
        )


def notify_admins_new_user(user_name, user_email):
    """Notify all admins when a new user registers."""
    for aid in _admin_ids():
        notify(
            user_id=aid,
            notif_type='new_user',
            title='Nouvel utilisateur',
            body=f'{user_name} ({user_email}) s\'est inscrit',
            link='/admin?tab=users',
        )


def notify_admins_new_review(user_name, offer_title, review_id):
    """Notify all admins when a new review is posted."""
    for aid in _admin_ids():
        notify(
            user_id=aid,
            notif_type='new_review',
            title='Nouvel avis',
            body=f'{user_name} a laissé un avis sur "{offer_title}"',
            link='/admin?tab=reviews',
            ref_id=review_id
        )


def notify_admins_new_booking(traveler_name, offer_title, booking_id):
    """Notify all admins when a new booking is made."""
    for aid in _admin_ids():
        notify(
            user_id=aid,
            notif_type='new_booking',
            title='Nouvelle réservation',
            body=f'{traveler_name} a réservé "{offer_title}"',
            link='/admin?tab=bookings',
            ref_id=booking_id
        )
