"""
GET LOST DZ — Shared utilities
Small helpers used by multiple route modules.
"""
import json
import re
import urllib.request
import urllib.error
from app.config import MAIL_FROM, MAIL_PASS, APP_URL

# Known disposable / temporary email domains
_BLOCKED_EMAIL_DOMAINS = {
    'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
    'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
    'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
    'tempmail.com', 'temp-mail.org', 'tempinbox.com', 'tempr.email',
    'tempomail.fr', 'temporaryemail.net', 'temporaryinbox.com',
    'throwam.com', 'throwaway.email', 'throwawaymail.com',
    'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
    'guerrillamail.biz', 'guerrillamail.de', 'guerrillamailblock.com',
    'grr.la', 'guerrillamail.info', 'spam4.me',
    'trashmail.com', 'trashmail.at', 'trashmail.io', 'trashmail.me',
    'trashmail.net', 'trashmail.org', 'trashmail.app', 'trashmail.xyz',
    'trash-mail.at', 'trash-mail.com', 'trash-mail.de', 'trash-mail.io',
    'trash-mail.me', 'trash-mail.net', 'trashemail.de',
    'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'discard.email',
    'getairmail.com', 'mailinator.com', 'mailnull.com',
    '10minutemail.com', '10minutemail.net', '20minutemail.com',
    'sharklasers.com', 'spam.la', 'binkmail.com', 'filzmail.com',
    'jetable.com', 'jetable.net', 'jetable.org',
    'mailexpire.com', 'mailforspam.com', 'mailscrap.com',
    'mintemail.com', 'neverbox.com', 'nomail.pw',
    'objectmail.com', 'owlpic.com', 'spamgourmet.com',
    'spamgourmet.net', 'spamgourmet.org', 'spamhole.com',
    'spaml.com', 'spaml.de', 'spammotel.com', 'spamspot.com',
    'spamstack.net', 'spamtroll.net', 'tempalias.com',
    'tempe-mail.com', 'tempemail.biz', 'tempemail.com', 'tempemail.net',
    'tempinbox.co.uk', 'tempmail.de', 'tempmail.eu', 'tempmail.it',
    'tempmailo.com', 'tempsky.com', 'tempthe.net', 'tempymail.com',
    'tilien.com', 'tmail.com', 'tmailinator.com',
}


def validate_email_strict(email):
    """
    Validate email format and block known disposable/fake email domains.
    Returns (ok: bool, error: str | None)
    """
    if not email or not isinstance(email, str):
        return False, "Email requis"
    email = email.strip().lower()
    if not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email):
        return False, "Format email invalide"
    domain = email.split('@')[1].lower()
    if domain in _BLOCKED_EMAIL_DOMAINS:
        return False, "Les adresses email temporaires ne sont pas autorisées"
    return True, None


def parse_offer(o):
    """Parse JSON fields in an offer row into Python lists."""
    if not o:
        return o
    for field in ("itinerary", "includes", "available_dates", "images"):
        try:
            o[field] = json.loads(o.get(field) or "[]")
        except Exception:
            o[field] = []
    # Backward compat: if images is empty but image_url exists, use it
    if not o.get("images") and o.get("image_url"):
        o["images"] = [o["image_url"]]
    return o


def validate(data, rules):
    """
    Lightweight input validator.
    rules = {"field": {"required": True, "min": 1, "max": 500, "type": str}}
    Returns (ok: bool, error: str | None)
    """
    for field, opts in rules.items():
        val = data.get(field)
        if opts.get("required") and not val:
            return False, f"'{field}' est requis"
        if val is not None:
            expected_type = opts.get("type")
            if expected_type and not isinstance(val, expected_type):
                return False, f"'{field}' doit être de type {expected_type.__name__}"
            if isinstance(val, str):
                if "min" in opts and len(val.strip()) < opts["min"]:
                    return False, f"'{field}' trop court (min {opts['min']} caractères)"
                if "max" in opts and len(val.strip()) > opts["max"]:
                    return False, f"'{field}' trop long (max {opts['max']} caractères)"
            if isinstance(val, (int, float)):
                if "min" in opts and val < opts["min"]:
                    return False, f"'{field}' doit être ≥ {opts['min']}"
                if "max" in opts and val > opts["max"]:
                    return False, f"'{field}' doit être ≤ {opts['max']}"
    return True, None


def send_email(to, subject, html):
    """Send transactional email via Brevo API (HTTPS, no SMTP needed)."""
    if not MAIL_PASS:
        print(f"[email] No API key — skipping email to {to}")
        return False
    payload = json.dumps({
        "sender":   {"name": "Get Lost DZ", "email": MAIL_FROM},
        "to":       [{"email": to}],
        "subject":  subject,
        "htmlContent": html,
    }).encode()
    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={"api-key": MAIL_PASS, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=8)
        return True
    except urllib.error.HTTPError as e:
        print(f"[email] Brevo error {e.code}: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"[email] Unexpected error: {e}")
        return False
