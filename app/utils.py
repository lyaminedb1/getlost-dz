"""
GET LOST DZ — Shared utilities
Small helpers used by multiple route modules.
"""
import json
import urllib.request
import urllib.error
from app.config import MAIL_FROM, MAIL_PASS, APP_URL


def parse_offer(o):
    """Parse JSON fields in an offer row into Python lists."""
    if not o:
        return o
    for field in ("itinerary", "includes", "available_dates"):
        try:
            o[field] = json.loads(o.get(field) or "[]")
        except Exception:
            o[field] = []
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
