"""
GET LOST DZ — Auth Routes Blueprint
/api/auth/* and /api/admin/create-agency
"""
import bcrypt, secrets, random, json
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, g

from app.db import db_query, db_run
from app.auth import make_token, token_required, admin_required
from app.utils import send_email, validate, validate_email_strict
from app.config import APP_URL
from app.routes.notification_helpers import notify_admins_new_user

bp = Blueprint("auth", __name__, url_prefix="/api")


@bp.route("/auth/register", methods=["POST"])
def register():
    import re as _re
    d = request.json or {}
    name        = (d.get("name") or "").strip()
    family_name = (d.get("familyName") or "").strip()
    birth_date  = (d.get("birthDate") or "").strip()
    gender      = (d.get("gender") or "").strip()
    city        = (d.get("city") or "").strip()
    email       = (d.get("email") or "").strip().lower()
    password    = d.get("password") or ""
    phone       = (d.get("phone") or "").strip()

    ok, err = validate(d, {
        "name":     {"required": True, "type": str, "min": 2, "max": 80},
        "email":    {"required": True, "type": str, "max": 200},
        "password": {"required": True, "type": str},
    })
    if not ok:
        return jsonify({"error": err}), 400
    if not family_name:
        return jsonify({"error": "Nom de famille requis"}), 400
    if len(password) < 6:
        return jsonify({"error": "Mot de passe: minimum 6 caractères"}), 400
    if not phone:
        return jsonify({"error": "Numéro de téléphone requis"}), 400

    # Strict email validation (format + disposable domain check)
    email_ok, email_err = validate_email_strict(email)
    if not email_ok:
        return jsonify({"error": email_err}), 400

    # Normalize phone
    phone_clean = ''.join(c for c in phone if c.isdigit() or c == '+')
    if len(''.join(c for c in phone_clean if c.isdigit())) < 8:
        return jsonify({"error": "Numéro invalide (min. 8 chiffres)"}), 400

    phone_patterns = {
        '+213': r'^\+213[567]\d{8}$',
        '+33':  r'^\+33[1-9]\d{8}$',
        '+212': r'^\+212[5-7]\d{8}$',
        '+216': r'^\+216[2-9]\d{7}$',
        '+44':  r'^\+44[1-9]\d{9,10}$',
        '+1':   r'^\+1[2-9]\d{9}$',
        '+90':  r'^\+90[5]\d{9}$',
        '+966': r'^\+966[5]\d{8}$',
        '+971': r'^\+971[2-9]\d{7,8}$',
    }
    for prefix, pattern in phone_patterns.items():
        if phone_clean.startswith(prefix):
            if not _re.match(pattern, phone_clean):
                return jsonify({"error": f"Format invalide pour {prefix}"}), 400
            break

    # Uniqueness checks against existing users
    existing_phone = db_query("SELECT id FROM users WHERE phone=?", (phone,), one=True)
    if not existing_phone:
        existing_phone = db_query("SELECT id FROM users WHERE phone=?", (phone_clean,), one=True)
    if existing_phone:
        return jsonify({"error": "Ce numéro de téléphone est déjà utilisé"}), 409
    if db_query("SELECT id FROM users WHERE email=?", (email,), one=True):
        return jsonify({"error": "Email déjà utilisé"}), 409

    # Hash password and serialize all form data — do NOT create user yet
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    pending_data = json.dumps({
        "name": name, "family_name": family_name, "birth_date": birth_date,
        "gender": gender, "city": city, "email": email,
        "password": hashed, "phone": phone,
    })

    # Invalidate any previous pending registrations for this email
    try:
        db_run("UPDATE pending_registrations SET used=TRUE WHERE email=? AND used=FALSE", (email,))
    except Exception as e:
        print(f"[register] pending invalidate error: {e}")

    # Store pending registration with verification code
    code = f"{random.randint(0, 999999):06d}"
    expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")
    try:
        db_run(
            "INSERT INTO pending_registrations(email, code, pending_data, expires_at) VALUES(?,?,?,?)",
            (email, code, pending_data, expires)
        )
    except Exception as e:
        print(f"[register] pending insert error: {e}")
        return jsonify({"error": "Erreur lors de l'inscription. Réessayez."}), 500

    # Send verification email — if it fails, clean up and report error
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:32px;">🌍</div>
        <strong style="font-size:22px;color:#0B2340;">Get Lost DZ</strong>
      </div>
      <div style="background:#E6F9F7;border-radius:16px;padding:28px 24px;text-align:center;">
        <h2 style="color:#0B2340;margin:0 0 12px;">Vérifiez votre email</h2>
        <p style="color:#6B8591;margin:0 0 20px;line-height:1.7;">
          Bonjour <strong>{name}</strong>,<br>
          Entrez ce code pour activer votre compte :
        </p>
        <div style="background:#fff;border:2px solid #0DB9A8;border-radius:12px;padding:20px;display:inline-block;margin:0 auto;">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0B2340;">{code}</span>
        </div>
        <p style="color:#A8BEC6;font-size:12px;margin-top:16px;">
          Ce code expire dans <strong>15 minutes</strong>.
        </p>
      </div>
      <p style="text-align:center;color:#999;font-size:12px;margin-top:16px;">
        Get Lost DZ — La référence du tourisme expérientiel en Algérie
      </p>
    </div>"""
    sent = send_email(email, "🔐 Vérifiez votre email — Get Lost DZ", html)
    if not sent:
        # Email rejected — clean up pending row and tell user
        try:
            db_run("UPDATE pending_registrations SET used=TRUE WHERE email=? AND code=?", (email, code))
        except Exception:
            pass
        return jsonify({"error": "Impossible d'envoyer l'email. Vérifiez votre adresse email."}), 400

    return jsonify({"needsVerification": True, "email": email}), 201


@bp.route("/auth/verify-email", methods=["POST"])
def verify_email():
    d     = request.json or {}
    email = (d.get("email") or "").strip().lower()
    code  = (d.get("code") or "").strip()

    if not email or not code:
        return jsonify({"error": "Email et code requis"}), 400

    # Look up pending registration
    row = db_query(
        "SELECT * FROM pending_registrations WHERE email=? AND code=? AND used=FALSE ORDER BY created_at DESC LIMIT 1",
        (email, code), one=True
    )
    if not row:
        return jsonify({"error": "Code invalide"}), 400

    try:
        expires = datetime.strptime(str(row["expires_at"])[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            return jsonify({"error": "Code expiré. Cliquez sur « Renvoyer le code »."}), 400
    except Exception:
        return jsonify({"error": "Code invalide"}), 400

    # Parse stored form data
    try:
        pd = json.loads(row["pending_data"])
    except Exception:
        return jsonify({"error": "Données d'inscription invalides. Réessayez."}), 400

    # Race condition guard: re-check uniqueness before creating user
    if db_query("SELECT id FROM users WHERE email=?", (email,), one=True):
        return jsonify({"error": "Email déjà utilisé"}), 409

    # Create user with email_verified=1 — account only created NOW
    try:
        uid = db_run(
            "INSERT INTO users(name,family_name,birth_date,gender,city,email,password,role,phone,email_verified) "
            "VALUES(?,?,?,?,?,?,?,?,?,?)",
            (pd["name"], pd["family_name"], pd["birth_date"], pd["gender"], pd["city"],
             pd["email"], pd["password"], "traveler", pd["phone"], True)
        )
    except Exception as e:
        print(f"[verify_email] user insert error: {e}")
        return jsonify({"error": "Erreur lors de la création du compte. Réessayez."}), 500

    # Mark pending row as used
    db_run("UPDATE pending_registrations SET used=TRUE WHERE id=?", (row["id"],))

    user = db_query("SELECT * FROM users WHERE id=?", (uid,), one=True)

    # Welcome email (non-blocking)
    try:
        html = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">🌍</span>
            <h2 style="color:#0B2340;margin:8px 0;">Get Lost DZ</h2>
          </div>
          <div style="background:#E6F9F7;border-radius:16px;padding:28px;text-align:center;">
            <h3 style="color:#0B2340;">Bienvenue {pd['name']} ! 🎉</h3>
            <p style="color:#6B8591;line-height:1.7;">Votre compte voyageur a été créé avec succès.<br>
            Découvrez nos voyages et réservez votre prochaine aventure !</p>
            <a href="{APP_URL}" style="display:inline-block;margin-top:20px;background:#0DB9A8;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;">
              Explorer les voyages
            </a>
          </div>
          <p style="text-align:center;color:#999;font-size:12px;margin-top:16px;">Get Lost DZ — La référence du tourisme expérientiel en Algérie</p>
        </div>"""
        send_email(email, "🌍 Bienvenue sur Get Lost DZ !", html)
    except Exception as e:
        print(f"[email] welcome error: {e}")

    try:
        notify_admins_new_user(pd["name"], email)
    except Exception as e:
        print(f"[notif] new user error: {e}")

    return jsonify({
        "token": make_token(user, None),
        "user": {
            "id": user["id"], "name": user["name"], "email": user["email"],
            "role": user["role"], "phone": user.get("phone", ""),
            "avatar": user.get("avatar", ""), "agencyId": None,
            "email_verified": True,
        }
    }), 200


@bp.route("/auth/resend-code", methods=["POST"])
def resend_code():
    email = ((request.json or {}).get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email requis"}), 400

    # Look up the most recent unused pending registration
    pending = db_query(
        "SELECT * FROM pending_registrations WHERE email=? AND used=FALSE ORDER BY created_at DESC LIMIT 1",
        (email,), one=True
    )
    if not pending:
        return jsonify({"message": "Code envoyé si l'inscription est en attente."}), 200

    # Parse name for the email greeting
    name = email
    try:
        pd = json.loads(pending["pending_data"])
        name = pd.get("name", email)
    except Exception:
        pass

    # Invalidate old pending rows for this email
    db_run("UPDATE pending_registrations SET used=TRUE WHERE email=? AND used=FALSE", (email,))

    # Create new pending row with fresh code
    code = f"{random.randint(0, 999999):06d}"
    expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")
    db_run(
        "INSERT INTO pending_registrations(email, code, pending_data, expires_at) VALUES(?,?,?,?)",
        (email, code, pending["pending_data"], expires)
    )

    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:32px;">🌍</div>
        <strong style="font-size:22px;color:#0B2340;">Get Lost DZ</strong>
      </div>
      <div style="background:#E6F9F7;border-radius:16px;padding:28px 24px;text-align:center;">
        <h2 style="color:#0B2340;margin:0 0 12px;">Nouveau code de vérification</h2>
        <p style="color:#6B8591;margin:0 0 20px;line-height:1.7;">
          Bonjour <strong>{name}</strong>,<br>
          Voici votre nouveau code :
        </p>
        <div style="background:#fff;border:2px solid #0DB9A8;border-radius:12px;padding:20px;display:inline-block;margin:0 auto;">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0B2340;">{code}</span>
        </div>
        <p style="color:#A8BEC6;font-size:12px;margin-top:16px;">
          Ce code expire dans <strong>15 minutes</strong>.
        </p>
      </div>
    </div>"""
    sent = send_email(email, "🔐 Nouveau code de vérification — Get Lost DZ", html)
    if not sent:
        return jsonify({"error": "Impossible d'envoyer l'email. Vérifiez votre adresse."}), 400

    return jsonify({"message": "Code envoyé"}), 200


@bp.route("/admin/create-agency", methods=["POST"])
@admin_required
def admin_create_agency():
    d = request.json or {}
    name    = (d.get("name") or "").strip()
    email   = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""
    phone   = (d.get("phone") or "").strip()
    ag_name = (d.get("agencyName") or name).strip()
    desc    = (d.get("description") or "").strip()
    logo    = (d.get("logo") or "🏢").strip()
    plan    = d.get("plan", "standard")

    if not name or not email or not password:
        return jsonify({"error": "Nom, email et mot de passe requis"}), 400
    if len(password) < 6:
        return jsonify({"error": "Mot de passe: minimum 6 caractères"}), 400
    if db_query("SELECT id FROM users WHERE email=?", (email,), one=True):
        return jsonify({"error": "Email déjà utilisé"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    uid = db_run(
        "INSERT INTO users(name,email,password,role,phone,email_verified) VALUES(?,?,?,?,?,?)",
        (name, email, hashed, "agency", phone, True)
    )
    agency_id = db_run(
        "INSERT INTO agencies(user_id,name,description,logo,plan,status) VALUES(?,?,?,?,?,?)",
        (uid, ag_name, desc, logo, plan, "approved")
    )
    return jsonify({"message": "Agence créée avec succès", "userId": uid, "agencyId": agency_id}), 201


@bp.route("/auth/login", methods=["POST"])
def login():
    d = request.json or {}
    email    = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email et mot de passe requis"}), 400

    user = db_query("SELECT * FROM users WHERE email=?", (email,), one=True)
    if not user or not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401

    agency_id = None
    if user["role"] == "agency":
        ag = db_query("SELECT id FROM agencies WHERE user_id=?", (user["id"],), one=True)
        if ag: agency_id = ag["id"]

    return jsonify({
        "token": make_token(user, agency_id),
        "user": {
            "id": user["id"], "name": user["name"], "email": user["email"],
            "role": user["role"], "phone": user.get("phone", ""),
            "avatar": user.get("avatar", ""), "agencyId": agency_id,
            "email_verified": bool(user.get("email_verified", False)),
        }
    })


@bp.route("/auth/me", methods=["GET"])
@token_required
def me():
    u = db_query(
        "SELECT id,name,family_name,birth_date,gender,city,email,role,phone,avatar,email_verified,created_at FROM users WHERE id=?",
        (g.user["id"],), one=True
    )
    result = dict(u)
    result["email_verified"] = bool(result.get("email_verified", False))
    if result.get("role") == "agency":
        ag = db_query("SELECT id FROM agencies WHERE user_id=?", (result["id"],), one=True)
        result["agencyId"] = ag["id"] if ag else None
    else:
        result["agencyId"] = None
    return jsonify(result)


@bp.route("/auth/profile", methods=["PUT"])
@token_required
def update_profile():
    d = request.json or {}
    uid         = g.user["id"]
    name        = (d.get("name") or "").strip()
    family_name = (d.get("familyName") or "").strip()
    birth_date  = (d.get("birthDate") or "").strip()
    gender      = (d.get("gender") or "").strip()
    city        = (d.get("city") or "").strip()
    email       = (d.get("email") or "").strip().lower()
    phone       = (d.get("phone") or "").strip()

    if not name or not email:
        return jsonify({"error": "Nom et email requis"}), 400
    if phone and len(''.join(c for c in phone if c.isdigit())) < 8:
        return jsonify({"error": "Numéro invalide (min. 8 chiffres)"}), 400
    if db_query("SELECT id FROM users WHERE email=? AND id!=?", (email, uid), one=True):
        return jsonify({"error": "Email déjà utilisé"}), 409

    new_pass = d.get("password", "").strip()
    if new_pass:
        if len(new_pass) < 6:
            return jsonify({"error": "Mot de passe: minimum 6 caractères"}), 400
        hashed = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt()).decode()
        db_run("UPDATE users SET name=?,family_name=?,birth_date=?,gender=?,city=?,email=?,phone=?,password=? WHERE id=?",
               (name, family_name, birth_date, gender, city, email, phone, hashed, uid))
    else:
        db_run("UPDATE users SET name=?,family_name=?,birth_date=?,gender=?,city=?,email=?,phone=? WHERE id=?",
               (name, family_name, birth_date, gender, city, email, phone, uid))

    if g.user.get("role") == "agency":
        ag_name = (d.get("agencyName") or "").strip()
        ag_desc = (d.get("agencyDesc") or "").strip()
        ag_logo = (d.get("agencyLogo") or "🏢").strip()
        if ag_name:
            db_run("UPDATE agencies SET name=?,description=?,logo=? WHERE user_id=?",
                   (ag_name, ag_desc, ag_logo, uid))

    user = db_query(
        "SELECT id,name,family_name,birth_date,gender,city,email,role,phone,avatar FROM users WHERE id=?",
        (uid,), one=True
    )
    return jsonify({"message": "Profil mis à jour", "user": user})


@bp.route("/auth/avatar", methods=["POST"])
@token_required
def upload_avatar():
    avatar = (request.json or {}).get("avatar", "")
    if not avatar:
        return jsonify({"error": "Avatar requis"}), 400
    if len(avatar) > 2_800_000:
        return jsonify({"error": "Image trop grande (max 2MB)"}), 400
    db_run("UPDATE users SET avatar=? WHERE id=?", (avatar, g.user["id"]))
    return jsonify({"message": "Avatar mis à jour", "avatar": avatar})


@bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    email = ((request.json or {}).get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email requis"}), 400

    user = db_query("SELECT id,name,email FROM users WHERE email=?", (email,), one=True)
    # Always return 200 — prevents email enumeration attacks
    if not user:
        return jsonify({"message": "Si cet email existe, un lien a été envoyé."}), 200

    db_run("UPDATE password_resets SET used=TRUE WHERE user_id=? AND used=FALSE", (user["id"],))
    token    = secrets.token_urlsafe(32)
    expires  = (datetime.now(timezone.utc) + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    db_run("INSERT INTO password_resets(user_id,token,expires_at) VALUES(?,?,?)", (user["id"], token, expires))

    reset_url = f"{APP_URL}?reset_token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:32px;">🌍</div>
        <strong style="font-size:22px;color:#0B2340;">Get Lost DZ</strong>
      </div>
      <div style="background:#E6F9F7;border-radius:16px;padding:28px 24px;">
        <h2 style="color:#0B2340;margin:0 0 12px;">Réinitialisation de mot de passe</h2>
        <p style="color:#6B8591;margin:0 0 20px;line-height:1.7;">
          Bonjour <strong>{user['name']}</strong>,<br>
          Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.
        </p>
        <div style="text-align:center;">
          <a href="{reset_url}" style="display:inline-block;background:#0DB9A8;color:#fff;
             text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;">
            🔑 Réinitialiser mon mot de passe
          </a>
        </div>
      </div>
      <p style="color:#A8BEC6;font-size:12px;text-align:center;margin-top:16px;">
        Ce lien expire dans <strong>1 heure</strong>.
      </p>
    </div>
    """
    send_email(user["email"], "🔑 Réinitialisation de mot de passe — Get Lost DZ", html)
    return jsonify({"message": "Si cet email existe, un lien a été envoyé."}), 200


@bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    d        = request.json or {}
    token    = (d.get("token") or "").strip()
    password = (d.get("password") or "").strip()

    if not token or not password:
        return jsonify({"error": "Token et mot de passe requis"}), 400
    if len(password) < 6:
        return jsonify({"error": "Mot de passe: minimum 6 caractères"}), 400

    row = db_query("SELECT * FROM password_resets WHERE token=? AND used=FALSE", (token,), one=True)
    if not row:
        return jsonify({"error": "Lien invalide ou déjà utilisé"}), 400
    try:
        expires = datetime.strptime(str(row["expires_at"])[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            return jsonify({"error": "Lien expiré. Faites une nouvelle demande."}), 400
    except Exception:
        return jsonify({"error": "Lien invalide"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    db_run("UPDATE users SET password=? WHERE id=?", (hashed, row["user_id"]))
    db_run("UPDATE password_resets SET used=TRUE WHERE token=?", (token,))
    return jsonify({"message": "Mot de passe réinitialisé avec succès !"}), 200


@bp.route("/auth/verify-reset-token", methods=["POST"])
def verify_reset_token():
    token = ((request.json or {}).get("token") or "").strip()
    if not token:
        return jsonify({"valid": False}), 200
    row = db_query("SELECT * FROM password_resets WHERE token=? AND used=FALSE", (token,), one=True)
    if not row:
        return jsonify({"valid": False}), 200
    try:
        expires = datetime.strptime(str(row["expires_at"])[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            return jsonify({"valid": False}), 200
    except Exception:
        return jsonify({"valid": False}), 200
    return jsonify({"valid": True}), 200
