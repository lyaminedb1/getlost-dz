"""
GET LOST DZ — Full Backend API
Flask + PostgreSQL (prod) / SQLite (dev) + JWT + bcrypt
Auto-detects DATABASE_URL env var
"""
import bcrypt, jwt, json, os, secrets, smtplib, threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

JWT_SECRET = os.environ.get("JWT_SECRET", "getlostdz_jwt_secret_2025")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
USE_POSTGRES = DATABASE_URL.startswith("postgres")

MAIL_HOST = os.environ.get("MAIL_HOST", "smtp-relay.brevo.com")
MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
MAIL_USER = os.environ.get("MAIL_USER", "")
MAIL_PASS = os.environ.get("MAIL_PASS", "")
MAIL_FROM = os.environ.get("MAIL_FROM", "noreply@getlostdz.com")
APP_URL   = os.environ.get("APP_URL", "https://getlost-dz.onrender.com")

# ─── DB LAYER ─────────────────────────────────────────────────────────────────

if USE_POSTGRES:
    import psycopg2, psycopg2.extras
    def _pg_conn():
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)

    def get_db():
        if 'db' not in g:
            g.db = _pg_conn()
        return g.db

    @app.teardown_appcontext
    def close_db(e=None):
        db = g.pop('db', None)
        if db:
            try: db.close()
            except: pass

    def _fix(sql): return sql.replace("?", "%s")

    def db_query(sql, args=(), one=False):
        cur = get_db().cursor()
        cur.execute(_fix(sql), args)
        rows = [dict(r) for r in cur.fetchall()]
        return (rows[0] if rows else None) if one else rows

    def db_run(sql, args=()):
        sql2 = _fix(sql)
        if sql2.strip().upper().startswith("INSERT"):
            sql2 = sql2.rstrip("; ") + " RETURNING id"
        db = get_db(); cur = db.cursor()
        cur.execute(sql2, args); db.commit()
        if "RETURNING" in sql2:
            row = cur.fetchone()
            return row["id"] if row else None
        return None

else:
    import sqlite3
    DB = "getlost.db"

    def get_db():
        if 'db' not in g:
            g.db = sqlite3.connect(DB)
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA journal_mode=WAL")
            g.db.execute("PRAGMA foreign_keys=ON")
        return g.db

    @app.teardown_appcontext
    def close_db(e=None):
        db = g.pop('db', None)
        if db: db.close()

    def db_query(sql, args=(), one=False):
        rows = get_db().execute(sql, args).fetchall()
        return (dict(rows[0]) if rows else None) if one else [dict(r) for r in rows]

    def db_run(sql, args=()):
        db = get_db(); cur = db.execute(sql, args); db.commit()
        return cur.lastrowid

# ─── INIT DB ──────────────────────────────────────────────────────────────────

def init_db():
    if USE_POSTGRES:
        db = _pg_conn()
        cur = db.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'traveler',
                phone TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS agencies (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                logo TEXT DEFAULT '🏢',
                plan TEXT DEFAULT 'standard',
                status TEXT DEFAULT 'approved',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS offers (
                id SERIAL PRIMARY KEY,
                agency_id INTEGER NOT NULL REFERENCES agencies(id),
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                price INTEGER NOT NULL,
                duration INTEGER NOT NULL DEFAULT 1,
                region TEXT NOT NULL,
                description TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                itinerary TEXT DEFAULT '[]',
                includes TEXT DEFAULT '[]',
                available_dates TEXT DEFAULT '[]',
                status TEXT DEFAULT 'pending',
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                offer_id INTEGER NOT NULL REFERENCES offers(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                booking_id INTEGER REFERENCES bookings(id),
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                title TEXT NOT NULL,
                comment TEXT DEFAULT '',
                photo TEXT DEFAULT '',
                agency_reply TEXT DEFAULT '',
                status TEXT DEFAULT 'approved',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                offer_id INTEGER NOT NULL REFERENCES offers(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                phone TEXT DEFAULT '',
                message TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                offer_id INTEGER,
                user_id INTEGER,
                session_id TEXT,
                device TEXT DEFAULT '',
                browser TEXT DEFAULT '',
                country TEXT DEFAULT '',
                referrer TEXT DEFAULT '',
                lang TEXT DEFAULT 'fr',
                search_query TEXT DEFAULT '',
                filter_cat TEXT DEFAULT '',
                metadata TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db.commit()
        # ── Migrations ──
        cur.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';")
        cur.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INTEGER;")
        cur.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';")
        cur.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS agency_reply TEXT DEFAULT '';")
        cur.execute("ALTER TABLE reviews ALTER COLUMN status SET DEFAULT 'approved';")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                offer_id INTEGER,
                user_id INTEGER,
                session_id TEXT,
                device TEXT DEFAULT '',
                browser TEXT DEFAULT '',
                country TEXT DEFAULT '',
                referrer TEXT DEFAULT '',
                lang TEXT DEFAULT 'fr',
                search_query TEXT DEFAULT '',
                filter_cat TEXT DEFAULT '',
                metadata TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db.commit()
        # Check if already seeded
        cur.execute("SELECT COUNT(*) as c FROM users")
        count = cur.fetchone()["c"]
        if count > 0:
            db.close(); print("✅  DB already seeded"); return
    else:
        import sqlite3 as _sq
        db = _sq.connect(DB)
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'traveler', phone TEXT DEFAULT '', avatar TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS agencies (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '', logo TEXT DEFAULT '🏢', plan TEXT DEFAULT 'standard', status TEXT DEFAULT 'approved', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
            CREATE TABLE IF NOT EXISTS offers (id INTEGER PRIMARY KEY AUTOINCREMENT, agency_id INTEGER NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL, duration INTEGER NOT NULL DEFAULT 1, region TEXT NOT NULL, description TEXT DEFAULT '', image_url TEXT DEFAULT '', itinerary TEXT DEFAULT '[]', includes TEXT DEFAULT '[]', available_dates TEXT DEFAULT '[]', status TEXT DEFAULT 'pending', views INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(agency_id) REFERENCES agencies(id));
            CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, offer_id INTEGER NOT NULL, user_id INTEGER NOT NULL, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), title TEXT NOT NULL, comment TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(offer_id) REFERENCES offers(id), FOREIGN KEY(user_id) REFERENCES users(id));
            CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, offer_id INTEGER NOT NULL, user_id INTEGER NOT NULL, phone TEXT DEFAULT '', message TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(offer_id) REFERENCES offers(id), FOREIGN KEY(user_id) REFERENCES users(id));
            CREATE TABLE IF NOT EXISTS password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, expires_at DATETIME NOT NULL, used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
        """)
        # ── Migrations (SQLite) ──
        cols = [r[1] for r in db.execute("PRAGMA table_info(bookings)").fetchall()]
        if 'phone' not in cols:
            db.execute("ALTER TABLE bookings ADD COLUMN phone TEXT DEFAULT ''")
            db.commit()
        ucols = [r[1] for r in db.execute("PRAGMA table_info(users)").fetchall()]
        if 'phone' not in ucols:
            db.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
            db.commit()
        if 'avatar' not in ucols:
            db.execute("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''")
            db.commit()
        db.execute("""CREATE TABLE IF NOT EXISTS password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, expires_at DATETIME NOT NULL, used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))""")
        db.commit()
        count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if count > 0:
            db.close(); print("✅  DB already seeded"); return

    # Seed
    seeds=[("Admin GetLost","admin@getlostdz.com","admin123","admin"),("DZ Horizons Travel","agency1@getlostdz.com","agency123","agency"),("Sahara Wings","agency2@getlostdz.com","agency123","agency"),("Atlas Adventures","agency3@getlostdz.com","agency123","agency"),("Sarah Meziane","sarah@test.com","user123","traveler"),("Karim Bensalem","karim@test.com","user123","traveler")]
    for name,email,pw,role in seeds:
        h=bcrypt.hashpw(pw.encode(),bcrypt.gensalt()).decode()
        if USE_POSTGRES:
            cur.execute("INSERT INTO users(name,email,password,role) VALUES(%s,%s,%s,%s) ON CONFLICT(email) DO NOTHING",(name,email,h,role))
        else:
            try: db.execute("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",(name,email,h,role))
            except: pass
    if USE_POSTGRES: db.commit()
    else: db.commit()

    ags=[(2,"DZ Horizons Travel","Spécialiste voyages internationaux","✈️","premium","approved"),(3,"Sahara Wings","Expert destinations africaines","🦅","standard","approved"),(4,"Atlas Adventures","Aventures et treks en Algérie","⛰️","standard","approved")]
    for uid,name,desc,logo,plan,status in ags:
        if USE_POSTGRES:
            cur.execute("INSERT INTO agencies(user_id,name,description,logo,plan,status) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT(user_id) DO NOTHING",(uid,name,desc,logo,plan,status))
        else:
            try: db.execute("INSERT INTO agencies(user_id,name,description,logo,plan,status) VALUES(?,?,?,?,?,?)",(uid,name,desc,logo,plan,status))
            except: pass
    if USE_POSTGRES: db.commit()
    else: db.commit()

    offers_data=[
        (1,"Zanzibar Paradise","intl",185000,8,"Afrique Est","Plages paradisiaques de Zanzibar.","https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=700&q=80",'["Jour 1: Stone Town","Jour 2: Nungwi","Jour 3: Snorkeling","Jour 8: Retour"]','["Vol A/R","Hébergement 4 étoiles","Guide"]','["15 Avril 2025","10 Mai 2025"]',"approved"),
        (1,"Kenya Safari","intl",220000,10,"Afrique Est","Safari inoubliable Masai Mara.","https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=80",'["Jour 1: Nairobi","Jour 2: Masai Mara","Jour 10: Retour"]','["Vol A/R","Lodge 4 étoiles","Safaris"]','["5 Mai 2025","1 Juin 2025"]',"approved"),
        (2,"Tamanrasset & Hoggar","national",55000,5,"Tamanrasset","Sahara algérien.","https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&q=80",'["Jour 1: Vol Alger-Tam","Jour 2: Assekrem","Jour 5: Retour"]','["Vol interne","Camping","Guide"]','["20 Mars 2025","15 Avril 2025"]',"approved"),
        (2,"Kabylie Villages","national",18000,3,"Kabylie","Week-end en Kabylie.","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&q=80",'["Jour 1: Cascade Kefrida","Jour 2: Villages","Jour 3: Retour"]','["Transport","Hébergement"]','["Chaque week-end"]',"approved"),
        (3,"Trek Djurdjura","hike",12000,2,"Bouira","Randonnée Djurdjura.","https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&q=80",'["Jour 1: Tala Guilef","Jour 2: Sommet"]','["Guide","Bivouac"]','["Tous les samedis"]',"approved"),
        (3,"Sahara Bivouac","hike",25000,3,"El Oued","Nuit dans les dunes.","https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=700&q=80",'["Jour 1: Dunes 4x4","Jour 2: Dromadaires","Jour 3: Retour"]','["4x4","Tente","Guide"]','["Week-ends Nov-Mars"]',"approved"),
        (1,"Visa Turquie Express","visa",8500,1,"Service en ligne","Visa electronique 48h.","https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=700&q=80",'["Préparation","Soumission","Livraison"]','["Accompagnement","Support 24/7"]','["Toute lannee"]',"approved"),
        (2,"Malaisie et Bali","intl",310000,14,"Asie Sud-Est","Combiné Kuala Lumpur et Bali.","https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=700&q=80",'["J1-4: KL","J5-7: Langkawi","J8-14: Bali"]','["Vols","Hotels 4 étoiles","Transferts"]','["20 Juillet 2025"]',"approved"),
    ]
    for ag_id,title,cat,price,dur,region,desc,img,itin,incl,dates,status in offers_data:
        if USE_POSTGRES:
            cur.execute("INSERT INTO offers(agency_id,title,category,price,duration,region,description,image_url,itinerary,includes,available_dates,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",(ag_id,title,cat,price,dur,region,desc,img,itin,incl,dates,status))
        else:
            try: db.execute("INSERT INTO offers(agency_id,title,category,price,duration,region,description,image_url,itinerary,includes,available_dates,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(ag_id,title,cat,price,dur,region,desc,img,itin,incl,dates,status))
            except: pass

    revs=[(1,5,5,"Voyage de rêve !","Zanzibar magnifique.","approved"),(1,6,4,"Très bonne expérience","Belles plages.","approved"),(3,5,5,"Sahara magique","Inoubliable.","approved"),(5,5,5,"Trek parfait","Djurdjura splendide.","approved"),(2,6,5,"Kenya exceptionnel","Masai Mara !","approved")]
    for oid,uid,rating,title,comment,status in revs:
        if USE_POSTGRES:
            cur.execute("INSERT INTO reviews(offer_id,user_id,rating,title,comment,status) VALUES(%s,%s,%s,%s,%s,%s)",(oid,uid,rating,title,comment,status))
        else:
            try: db.execute("INSERT INTO reviews(offer_id,user_id,rating,title,comment,status) VALUES(?,?,?,?,?,?)",(oid,uid,rating,title,comment,status))
            except: pass

    if USE_POSTGRES: db.commit(); db.close()
    else: db.commit()
    print("✅  Database seeded")

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def parse_offer(o):
    if not o: return o
    for f in ["itinerary","includes","available_dates"]:
        try: o[f] = json.loads(o.get(f) or "[]")
        except: o[f] = []
    return o

# ─── AUTH ─────────────────────────────────────────────────────────────────────

def make_token(user, agency_id=None):
    payload = {
        "id": user["id"], "name": user["name"], "email": user["email"],
        "role": user["role"], "agencyId": agency_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def wrapper(*a, **kw):
        token = request.headers.get("Authorization","").replace("Bearer ","")
        if not token: return jsonify({"error":"Token required"}), 401
        try: g.user = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError: return jsonify({"error":"Token expired"}), 401
        except: return jsonify({"error":"Invalid token"}), 401
        return f(*a, **kw)
    return wrapper

def admin_required(f):
    @wraps(f)
    @token_required
    def wrapper(*a, **kw):
        if g.user.get("role") != "admin": return jsonify({"error":"Admin only"}), 403
        return f(*a, **kw)
    return wrapper

# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.json or {}
    name = (d.get("name") or "").strip()
    email = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""
    role = d.get("role","traveler")
    phone = (d.get("phone") or "").strip()
    if not name or not email or not password:
        return jsonify({"error":"Tous les champs sont requis"}), 400
    if len(password) < 6:
        return jsonify({"error":"Mot de passe: minimum 6 caractères"}), 400
    if not phone:
        return jsonify({"error":"Numéro de téléphone requis"}), 400
    digits = ''.join(c for c in phone if c.isdigit())
    if len(digits) < 8:
        return jsonify({"error":"Numéro invalide (min. 8 chiffres)"}), 400
    if db_query("SELECT id FROM users WHERE email=?", (email,), one=True):
        return jsonify({"error":"Email déjà utilisé"}), 409
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    uid = db_run("INSERT INTO users(name,email,password,role,phone) VALUES(?,?,?,?,?)",(name,email,hashed,role,phone))
    agency_id = None
    if role == "agency":
        agency_name = (d.get("agencyName") or name).strip()
        desc = (d.get("description") or "").strip()
        agency_id = db_run("INSERT INTO agencies(user_id,name,description,status) VALUES(?,?,?,?)",(uid,agency_name,desc,"approved"))
    user = {"id":uid,"name":name,"email":email,"role":role,"phone":phone}
    return jsonify({"token": make_token(user, agency_id), "user": {**user, "agencyId": agency_id}}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.json or {}
    email = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""
    user = db_query("SELECT * FROM users WHERE email=?", (email,), one=True)
    if not user or not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"error":"Email ou mot de passe incorrect"}), 401
    agency_id = None
    if user["role"] == "agency":
        ag = db_query("SELECT id FROM agencies WHERE user_id=?", (user["id"],), one=True)
        if ag: agency_id = ag["id"]
    return jsonify({"token": make_token(user, agency_id), "user": {
        "id":user["id"],"name":user["name"],"email":user["email"],"role":user["role"],
        "phone":user.get("phone",""),"avatar":user.get("avatar",""),"agencyId":agency_id
    }})

@app.route("/api/auth/me", methods=["GET"])
@token_required
def me():
    u = db_query("SELECT id,name,email,role,phone,avatar,created_at FROM users WHERE id=?", (g.user["id"],), one=True)
    return jsonify(u)

@app.route("/api/auth/profile", methods=["PUT"])
@token_required
def update_profile():
    d = request.json or {}
    uid = g.user["id"]
    name = (d.get("name") or "").strip()
    email = (d.get("email") or "").strip().lower()
    phone = (d.get("phone") or "").strip()
    if not name or not email:
        return jsonify({"error":"Nom et email requis"}), 400
    if phone:
        digits = ''.join(c for c in phone if c.isdigit())
        if len(digits) < 8:
            return jsonify({"error":"Numéro invalide (min. 8 chiffres)"}), 400
    # Check email not taken by another user
    existing = db_query("SELECT id FROM users WHERE email=? AND id!=?", (email, uid), one=True)
    if existing:
        return jsonify({"error":"Email déjà utilisé"}), 409
    # Update password if provided
    new_pass = d.get("password","").strip()
    if new_pass:
        if len(new_pass) < 6:
            return jsonify({"error":"Mot de passe: minimum 6 caractères"}), 400
        hashed = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt()).decode()
        db_run("UPDATE users SET name=?,email=?,phone=?,password=? WHERE id=?", (name,email,phone,hashed,uid))
    else:
        db_run("UPDATE users SET name=?,email=?,phone=? WHERE id=?", (name,email,phone,uid))
    # Update agency info if agency
    if g.user.get("role") == "agency":
        ag_name = (d.get("agencyName") or "").strip()
        ag_desc = (d.get("agencyDesc") or "").strip()
        ag_logo = (d.get("agencyLogo") or "🏢").strip()
        if ag_name:
            db_run("UPDATE agencies SET name=?,description=?,logo=? WHERE user_id=?", (ag_name,ag_desc,ag_logo,uid))
    user = db_query("SELECT id,name,email,role,phone,avatar FROM users WHERE id=?", (uid,), one=True)
    return jsonify({"message":"Profil mis à jour", "user": user})

@app.route("/api/auth/avatar", methods=["POST"])
@token_required
def upload_avatar():
    d = request.json or {}
    avatar = d.get("avatar","")
    if not avatar:
        return jsonify({"error":"Avatar requis"}), 400
    # Limit size ~2MB base64
    if len(avatar) > 2_800_000:
        return jsonify({"error":"Image trop grande (max 2MB)"}), 400
    db_run("UPDATE users SET avatar=? WHERE id=?", (avatar, g.user["id"]))
    return jsonify({"message":"Avatar mis à jour", "avatar": avatar})

# ─── EMAIL HELPER ─────────────────────────────────────────────────────────────

def send_email(to, subject, html):
    if not MAIL_PASS:
        print(f"[EMAIL] No API key — skipping email to {to}: {subject}")
        return False
    try:
        import urllib.request, urllib.error
        payload = json.dumps({
            "sender": {"name": "Get Lost DZ", "email": MAIL_FROM or "getlost.dz@gmail.com"},
            "to": [{"email": to}],
            "subject": subject,
            "htmlContent": html
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "api-key": MAIL_PASS
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[EMAIL] Sent to {to}: {resp.status}")
            return True
    except Exception as e:
        print(f"[EMAIL] Error sending to {to}: {e}")
        return False

# ─── PASSWORD RESET ───────────────────────────────────────────────────────────

@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    d = request.json or {}
    email = (d.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error":"Email requis"}), 400
    user = db_query("SELECT id,name,email FROM users WHERE email=?", (email,), one=True)
    # Always return success to avoid email enumeration
    if not user:
        return jsonify({"message":"Si cet email existe, un lien de réinitialisation a été envoyé."}), 200
    # Invalidate old tokens
    db_run("UPDATE password_resets SET used=TRUE WHERE user_id=? AND used=FALSE", (user["id"],))
    # Generate token valid 1h
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    expires_str = expires.strftime("%Y-%m-%d %H:%M:%S")
    db_run("INSERT INTO password_resets(user_id,token,expires_at) VALUES(?,?,?)", (user["id"], token, expires_str))
    reset_url = f"{APP_URL}?reset_token={token}"
    html = f"""
    <div style="font-family:Poppins,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:32px;margin-bottom:8px;">🌍</div>
        <div style="font-family:Nunito,sans-serif;font-weight:900;font-size:22px;color:#0B2340;">Get Lost DZ</div>
      </div>
      <div style="background:#E6F9F7;border-radius:16px;padding:28px 24px;margin-bottom:24px;">
        <h2 style="color:#0B2340;margin:0 0 12px;font-size:18px;">Réinitialisation de mot de passe</h2>
        <p style="color:#6B8591;margin:0 0 20px;line-height:1.7;">Bonjour <strong>{user['name']}</strong>,<br>
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
        <div style="text-align:center;">
          <a href="{reset_url}" style="display:inline-block;background:linear-gradient(135deg,#0DB9A8,#09907F);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">
            🔑 Réinitialiser mon mot de passe
          </a>
        </div>
      </div>
      <p style="color:#A8BEC6;font-size:12px;text-align:center;margin:0;">
        Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
      </p>
    </div>
    """
    send_email(user["email"], "🔑 Réinitialisation de mot de passe — Get Lost DZ", html)
    return jsonify({"message":"Si cet email existe, un lien de réinitialisation a été envoyé."}), 200

@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    d = request.json or {}
    token    = (d.get("token") or "").strip()
    password = (d.get("password") or "").strip()
    if not token or not password:
        return jsonify({"error":"Token et mot de passe requis"}), 400
    if len(password) < 6:
        return jsonify({"error":"Mot de passe: minimum 6 caractères"}), 400
    row = db_query("SELECT * FROM password_resets WHERE token=? AND used=FALSE", (token,), one=True)
    if not row:
        return jsonify({"error":"Lien invalide ou déjà utilisé"}), 400
    # Check expiry
    try:
        expires = datetime.strptime(str(row["expires_at"])[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            return jsonify({"error":"Lien expiré. Faites une nouvelle demande."}), 400
    except:
        return jsonify({"error":"Lien invalide"}), 400
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    db_run("UPDATE users SET password=? WHERE id=?", (hashed, row["user_id"]))
    db_run("UPDATE password_resets SET used=TRUE WHERE token=?", (token,))
    return jsonify({"message":"Mot de passe réinitialisé avec succès !"}), 200

@app.route("/api/auth/verify-reset-token", methods=["POST"])
def verify_reset_token():
    token = (request.json or {}).get("token","").strip()
    if not token:
        return jsonify({"valid":False}), 200
    row = db_query("SELECT * FROM password_resets WHERE token=? AND used=FALSE", (token,), one=True)
    if not row:
        return jsonify({"valid":False}), 200
    try:
        expires = datetime.strptime(str(row["expires_at"])[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            return jsonify({"valid":False}), 200
    except:
        return jsonify({"valid":False}), 200
    return jsonify({"valid":True}), 200

# ─── OFFERS ───────────────────────────────────────────────────────────────────

@app.route("/api/offers", methods=["GET"])
def get_offers():
    cat    = request.args.get("category","")
    search = request.args.get("search","")
    sort   = request.args.get("sort","rating")
    status = request.args.get("status","approved")
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
        sql += " AND (o.title LIKE ? OR o.region LIKE ?)"; args += [f"%{search}%",f"%{search}%"]
    sql += " GROUP BY o.id, a.name, a.logo"
    sql += {
        "price_asc":  " ORDER BY o.price ASC",
        "price_desc": " ORDER BY o.price DESC",
    }.get(sort, " ORDER BY avg_rating DESC NULLS LAST, o.id DESC")
    return jsonify([parse_offer(o) for o in db_query(sql, args)])

@app.route("/api/offers/<int:oid>", methods=["GET"])
def get_offer(oid):
    o = db_query("""SELECT o.*, a.name agency_name, a.logo agency_logo, a.description agency_desc,
             ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
             COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
             FROM offers o LEFT JOIN agencies a ON o.agency_id=a.id
             LEFT JOIN reviews r ON r.offer_id=o.id
             WHERE o.id=? GROUP BY o.id, a.name, a.logo, a.description""", (oid,), one=True)
    if not o: return jsonify({"error":"Not found"}), 404
    db_run("UPDATE offers SET views=views+1 WHERE id=?", (oid,))
    return jsonify(parse_offer(o))

@app.route("/api/offers", methods=["POST"])
@token_required
def create_offer():
    u = g.user
    if u["role"] not in ["agency","admin"]: return jsonify({"error":"Agency required"}), 403
    d = request.json or {}
    ag_id = u.get("agencyId")
    if not ag_id:
        ag = db_query("SELECT id FROM agencies WHERE user_id=?", (u["id"],), one=True)
        if ag: ag_id = ag["id"]
    if not ag_id: return jsonify({"error":"No agency found"}), 400
    for f in ["title","category","price","region"]:
        if not d.get(f): return jsonify({"error":f"{f} required"}), 400
    oid = db_run("""INSERT INTO offers(agency_id,title,category,price,duration,region,description,
        image_url,itinerary,includes,available_dates,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""", (
        ag_id, d["title"], d["category"], int(d["price"]), int(d.get("duration",1)),
        d["region"], d.get("description",""), d.get("imageUrl",""),
        json.dumps(d.get("itinerary",[])), json.dumps(d.get("includes",[])),
        json.dumps(d.get("dates",[])), "pending"
    ))
    return jsonify({"id":oid,"message":"Offer submitted for validation"}), 201

@app.route("/api/offers/<int:oid>", methods=["PUT"])
@token_required
def update_offer(oid):
    u = g.user
    offer = db_query("SELECT * FROM offers WHERE id=?", (oid,), one=True)
    if not offer: return jsonify({"error":"Not found"}), 404
    if u["role"] == "agency" and offer["agency_id"] != u.get("agencyId"):
        return jsonify({"error":"Forbidden"}), 403
    d = request.json or {}
    db_run("""UPDATE offers SET title=?,category=?,price=?,duration=?,region=?,
              description=?,image_url=?,itinerary=?,includes=?,available_dates=? WHERE id=?""", (
        d.get("title",offer["title"]), d.get("category",offer["category"]),
        int(d.get("price",offer["price"])), int(d.get("duration",offer["duration"])),
        d.get("region",offer["region"]), d.get("description",offer["description"]),
        d.get("imageUrl",offer["image_url"]),
        json.dumps(d.get("itinerary",[])), json.dumps(d.get("includes",[])),
        json.dumps(d.get("dates",[])), oid
    ))
    return jsonify({"message":"Updated"})

@app.route("/api/offers/<int:oid>", methods=["DELETE"])
@token_required
def delete_offer(oid):
    u = g.user
    offer = db_query("SELECT * FROM offers WHERE id=?", (oid,), one=True)
    if not offer: return jsonify({"error":"Not found"}), 404
    if u["role"] == "agency" and offer["agency_id"] != u.get("agencyId"):
        return jsonify({"error":"Forbidden"}), 403
    db_run("DELETE FROM reviews WHERE offer_id=?", (oid,))
    db_run("DELETE FROM bookings WHERE offer_id=?", (oid,))
    db_run("DELETE FROM offers WHERE id=?", (oid,))
    return jsonify({"message":"Deleted"})

@app.route("/api/offers/<int:oid>/status", methods=["PATCH"])
@admin_required
def set_offer_status(oid):
    status = (request.json or {}).get("status")
    if status not in ["approved","rejected","pending"]: return jsonify({"error":"Invalid status"}), 400
    db_run("UPDATE offers SET status=? WHERE id=?", (status,oid))
    return jsonify({"message":f"Offer {status}"})

# ─── REVIEWS ─────────────────────────────────────────────────────────────────

@app.route("/api/offers/<int:oid>/reviews", methods=["GET"])
def get_reviews(oid):
    rows = db_query("""SELECT r.*, u.name user_name FROM reviews r
        JOIN users u ON r.user_id=u.id
        WHERE r.offer_id=? AND r.status='approved'
        ORDER BY r.created_at DESC""", (oid,))
    return jsonify(rows)

@app.route("/api/offers/<int:oid>/reviews", methods=["POST"])
@token_required
def create_review(oid):
    u = g.user
    d = request.json or {}
    rating  = int(d.get("rating",0))
    title   = (d.get("title") or "").strip()
    comment = (d.get("comment") or "").strip()
    photo   = (d.get("photo") or "")
    bid     = d.get("booking_id")
    if not rating or not title: return jsonify({"error":"Note et titre requis"}), 400
    if not (1 <= rating <= 5):  return jsonify({"error":"Note entre 1 et 5"}), 400
    # Check booking belongs to user and is confirmed
    if bid:
        bk = db_query("SELECT id FROM bookings WHERE id=? AND user_id=? AND status='completed'", (bid, u["id"]), one=True)
        if not bk: return jsonify({"error":"R\u00e9servation non trouv\u00e9e ou non confirm\u00e9e"}), 403
    # Check not already reviewed this booking
    if bid and db_query("SELECT id FROM reviews WHERE booking_id=?", (bid,), one=True):
        return jsonify({"error":"Vous avez d\u00e9j\u00e0 laiss\u00e9 un avis pour cette r\u00e9servation"}), 409
    rid = db_run("INSERT INTO reviews(offer_id,user_id,booking_id,rating,title,comment,photo,status) VALUES(?,?,?,?,?,?,?,?)",
        (oid, u["id"], bid, rating, title, comment, photo, "approved"))
    # Update offer avg_rating
    db_run("""UPDATE offers SET views=views WHERE id=?""", (oid,))
    return jsonify({"id":rid,"message":"Avis publi\u00e9 !"}), 201

@app.route("/api/reviews/<int:rid>/status", methods=["PATCH"])
@admin_required
def set_review_status(rid):
    status = (request.json or {}).get("status")
    if status not in ["approved","rejected"]: return jsonify({"error":"Invalid"}), 400
    db_run("UPDATE reviews SET status=? WHERE id=?", (status,rid))
    return jsonify({"message":f"Review {status}"})

@app.route("/api/reviews/<int:rid>/reply", methods=["PATCH"])
@token_required
def reply_review(rid):
    u = g.user
    if u["role"] != "agency": return jsonify({"error":"Forbidden"}), 403
    reply = (request.json or {}).get("reply","").strip()
    # Check review belongs to agency's offer
    review = db_query("""SELECT r.* FROM reviews r
        JOIN offers o ON r.offer_id=o.id
        JOIN agencies a ON o.agency_id=a.id
        WHERE r.id=? AND a.user_id=?""", (rid, u["id"]), one=True)
    if not review: return jsonify({"error":"Not found"}), 404
    db_run("UPDATE reviews SET agency_reply=? WHERE id=?", (reply, rid))
    return jsonify({"message":"R\u00e9ponse publi\u00e9e"})

@app.route("/api/bookings/<int:bid>/review-check", methods=["GET"])
@token_required
def review_check(bid):
    u = g.user
    bk = db_query("SELECT * FROM bookings WHERE id=? AND user_id=?", (bid, u["id"]), one=True)
    if not bk: return jsonify({"error":"Not found"}), 404
    existing = db_query("SELECT id FROM reviews WHERE booking_id=?", (bid,), one=True)
    return jsonify({"booking": bk, "already_reviewed": bool(existing)})

# ─── AGENCIES ────────────────────────────────────────────────────────────────

@app.route("/api/agencies", methods=["GET"])
def get_agencies():
    rows = db_query("""SELECT a.*, u.email,
        COUNT(DISTINCT o.id) offer_count,
        COUNT(DISTINCT b.id) booking_count
        FROM agencies a JOIN users u ON a.user_id=u.id
        LEFT JOIN offers o ON o.agency_id=a.id AND o.status='approved'
        LEFT JOIN bookings b ON b.offer_id IN (SELECT id FROM offers WHERE agency_id=a.id)
        GROUP BY a.id, u.email ORDER BY a.id""")
    return jsonify(rows)

@app.route("/api/agencies/<int:aid>", methods=["PUT"])
@token_required
def update_agency(aid):
    u = g.user
    if u["role"] == "agency":
        ag = db_query("SELECT id FROM agencies WHERE user_id=?", (u["id"],), one=True)
        if not ag or ag["id"] != aid: return jsonify({"error":"Forbidden"}), 403
    d = request.json or {}
    db_run("UPDATE agencies SET name=?,description=?,logo=? WHERE id=?",
        (d.get("name"), d.get("description",""), d.get("logo","🏢"), aid))
    return jsonify({"message":"Updated"})

@app.route("/api/agencies/<int:aid>/status", methods=["PATCH"])
@admin_required
def set_agency_status(aid):
    d = request.json or {}
    if d.get("status"): db_run("UPDATE agencies SET status=? WHERE id=?", (d["status"],aid))
    if d.get("plan"):   db_run("UPDATE agencies SET plan=? WHERE id=?",   (d["plan"],aid))
    return jsonify({"message":"Updated"})

@app.route("/api/agencies/<int:aid>/offers", methods=["GET"])
@token_required
def agency_offers(aid):
    u = g.user
    if u["role"] not in ["admin"] and u.get("agencyId") != aid:
        return jsonify({"error":"Forbidden"}), 403
    rows = db_query("""SELECT o.*,
        ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
        COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
        FROM offers o LEFT JOIN reviews r ON r.offer_id=o.id
        WHERE o.agency_id=? GROUP BY o.id ORDER BY o.id DESC""", (aid,))
    return jsonify([parse_offer(o) for o in rows])

# ─── BOOKINGS ────────────────────────────────────────────────────────────────

@app.route("/api/bookings", methods=["POST"])
@token_required
def book():
    u = g.user
    d = request.json or {}
    oid   = d.get("offerId")
    phone = (d.get("phone") or "").strip()
    if not oid:   return jsonify({"error":"offerId required"}), 400
    if not phone: return jsonify({"error":"Numéro de téléphone requis"}), 400
    # Basic phone validation: must contain at least 8 digits
    digits = ''.join(c for c in phone if c.isdigit())
    if len(digits) < 8:
        return jsonify({"error":"Numéro de téléphone invalide (min. 8 chiffres)"}), 400
    if not db_query("SELECT id FROM offers WHERE id=? AND status='approved'", (oid,), one=True):
        return jsonify({"error":"Offer not found"}), 404
    bid = db_run("INSERT INTO bookings(offer_id,user_id,phone,message) VALUES(?,?,?,?)",
        (oid, u["id"], phone, d.get("message","")))
    return jsonify({"id":bid,"message":"Booking confirmed! The agency will contact you within 24h."}), 201

@app.route("/api/bookings/my", methods=["GET"])
@token_required
def my_bookings():
    rows = db_query("""SELECT b.*, o.title offer_title, o.price, o.image_url, o.category
        FROM bookings b JOIN offers o ON b.offer_id=o.id
        WHERE b.user_id=? ORDER BY b.created_at DESC""", (g.user["id"],))
    return jsonify(rows)

@app.route("/api/agencies/<int:aid>/bookings", methods=["GET"])
@token_required
def agency_bookings(aid):
    u = g.user
    if u["role"] not in ["admin"] and u.get("agencyId") != aid:
        return jsonify({"error":"Forbidden"}), 403
    rows = db_query("""SELECT b.*, o.title offer_title, o.price, o.category, o.image_url,
        u.name traveler_name, u.email traveler_email
        FROM bookings b
        JOIN offers o ON b.offer_id=o.id
        JOIN users u ON b.user_id=u.id
        WHERE o.agency_id=?
        ORDER BY b.created_at DESC""", (aid,))
    return jsonify(rows)

@app.route("/api/bookings/<int:bid>/status", methods=["PATCH"])
@token_required
def update_booking_status(bid):
    u = g.user
    d = request.json or {}
    status = d.get("status")
    VALID = ["pending","contacted","didnt_answer","pre_reserved","confirmed","completed","cancelled"]
    if status not in VALID:
        return jsonify({"error":"Invalid status"}), 400
    booking = db_query("""SELECT b.*, o.agency_id, o.title offer_title,
        u2.email traveler_email, u2.name traveler_name
        FROM bookings b
        JOIN offers o ON b.offer_id=o.id
        JOIN users u2 ON b.user_id=u2.id
        WHERE b.id=?""", (bid,), one=True)
    if not booking: return jsonify({"error":"Not found"}), 404
    if u["role"] == "agency" and booking["agency_id"] != u.get("agencyId"):
        return jsonify({"error":"Forbidden"}), 403
    db_run("UPDATE bookings SET status=? WHERE id=?", (status, bid))
    if status == "completed":
        review_url = f"{APP_URL}/?review_booking={bid}"
        html = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:48px">\U0001f30d</span>
            <h2 style="color:#0B2340;margin:8px 0">Get Lost DZ</h2>
          </div>
          <div style="background:#f0fdf4;border-radius:16px;padding:24px;text-align:center">
            <h3 style="color:#0B2340">Votre voyage est termin\u00e9 ! \U0001f389</h3>
            <p>Bonjour <strong>{booking['traveler_name']}</strong>,</p>
            <p>Votre r\u00e9servation pour <strong>{booking['offer_title']}</strong> est confirm\u00e9e.</p>
            <p>Partagez votre exp\u00e9rience en laissant un avis !</p>
            <a href="{review_url}" style="display:inline-block;margin-top:16px;padding:14px 32px;background:#0DB9A8;color:white;border-radius:50px;text-decoration:none;font-weight:700">
              \u2b50 Laisser un avis
            </a>
          </div>
          <p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Get Lost DZ</p>
        </div>"""
        send_email(booking["traveler_email"], "\U0001f389 Votre voyage est termin\u00e9 — Laissez un avis !", html)
    return jsonify({"message":f"Booking {status}"})

# ─── ADMIN ────────────────────────────────────────────────────────────────────

@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats():
    def cnt(sql,args=()): return db_query(sql,args,one=True)["c"]
    return jsonify({
        "total_offers":    cnt("SELECT COUNT(*) c FROM offers"),
        "pending_offers":  cnt("SELECT COUNT(*) c FROM offers WHERE status='pending'"),
        "approved_offers": cnt("SELECT COUNT(*) c FROM offers WHERE status='approved'"),
        "total_agencies":  cnt("SELECT COUNT(*) c FROM agencies"),
        "total_travelers": cnt("SELECT COUNT(*) c FROM users WHERE role='traveler'"),
        "total_reviews":   cnt("SELECT COUNT(*) c FROM reviews"),
        "pending_reviews": cnt("SELECT COUNT(*) c FROM reviews WHERE status='pending'"),
        "total_bookings":  cnt("SELECT COUNT(*) c FROM bookings"),
    })

@app.route("/api/admin/offers", methods=["GET"])
@admin_required
def admin_offers():
    rows = db_query("""SELECT o.*, a.name agency_name,
        ROUND(AVG(CASE WHEN r.status='approved' THEN r.rating END),1) avg_rating,
        COUNT(CASE WHEN r.status='approved' THEN 1 END) review_count
        FROM offers o LEFT JOIN agencies a ON o.agency_id=a.id
        LEFT JOIN reviews r ON r.offer_id=o.id
        GROUP BY o.id, a.name ORDER BY o.id DESC""")
    return jsonify([parse_offer(o) for o in rows])

@app.route("/api/admin/reviews", methods=["GET"])
@admin_required
def admin_reviews():
    rows = db_query("""SELECT r.*, u.name user_name, o.title offer_title
        FROM reviews r JOIN users u ON r.user_id=u.id JOIN offers o ON r.offer_id=o.id
        ORDER BY (r.status='pending') DESC, r.created_at DESC""")
    return jsonify(rows)

@app.route("/api/admin/bookings", methods=["GET"])
@admin_required
def admin_bookings():
    rows = db_query("""SELECT b.*, o.title offer_title, o.price, o.category,
        u.name traveler_name, u.email traveler_email,
        a.name agency_name
        FROM bookings b
        JOIN offers o ON b.offer_id=o.id
        JOIN users u ON b.user_id=u.id
        JOIN agencies a ON o.agency_id=a.id
        ORDER BY b.created_at DESC""")
    return jsonify(rows)

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_users():
    rows = db_query("SELECT id,name,email,role,created_at FROM users ORDER BY id")
    return jsonify(rows)


# ─── ANALYTICS ───────────────────────────────────────────────────────────────

@app.route("/api/events", methods=["POST"])
def track_event():
    d = request.json or {}
    ev_type = d.get("type","")
    if not ev_type: return jsonify({"ok":False}), 400
    # Parse device/browser from user agent
    ua = request.headers.get("User-Agent","")
    device = "mobile" if any(x in ua for x in ["iPhone","Android","Mobile"]) else "tablet" if "iPad" in ua else "desktop"
    browser = "Chrome" if "Chrome" in ua else "Safari" if "Safari" in ua else "Firefox" if "Firefox" in ua else "Other"
    referrer = request.headers.get("Referer","")
    source = "instagram" if "instagram" in referrer.lower() else "facebook" if "facebook" in referrer.lower() else "google" if "google" in referrer.lower() else "direct" if not referrer else "other"
    db_run("""INSERT INTO events(type,offer_id,user_id,session_id,device,browser,referrer,lang,search_query,filter_cat,metadata)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)""", (
        ev_type,
        d.get("offer_id"),
        d.get("user_id"),
        d.get("session_id",""),
        device,
        browser,
        source,
        d.get("lang","fr"),
        d.get("search_query",""),
        d.get("filter_cat",""),
        json.dumps(d.get("metadata",{}))
    ))
    return jsonify({"ok":True})

@app.route("/api/admin/analytics", methods=["GET"])
@admin_required
def admin_analytics():
    days = int(request.args.get("days", 30))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    def q(sql, args=()):
        return db_query(sql, args)

    # Daily visitors (unique sessions per day)
    daily = q("""SELECT DATE(created_at) as day, COUNT(*) as events,
        COUNT(DISTINCT session_id) as sessions
        FROM events WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY day""", (since,))

    # Top offers by views
    top_offers = q("""SELECT o.title, o.id,
        COUNT(e.id) as views,
        COUNT(CASE WHEN e.type='booking_started' THEN 1 END) as bookings_started,
        COUNT(CASE WHEN e.type='booking_done' THEN 1 END) as bookings_done
        FROM events e JOIN offers o ON e.offer_id=o.id
        WHERE e.created_at >= ? AND e.type IN ('offer_view','booking_started','booking_done')
        GROUP BY o.id, o.title ORDER BY views DESC LIMIT 10""", (since,))

    # Device breakdown
    devices = q("""SELECT device, COUNT(*) as c FROM events
        WHERE created_at >= ? GROUP BY device""", (since,))

    # Browser breakdown
    browsers = q("""SELECT browser, COUNT(*) as c FROM events
        WHERE created_at >= ? GROUP BY browser""", (since,))

    # Traffic sources
    sources = q("""SELECT referrer as source, COUNT(*) as c FROM events
        WHERE created_at >= ? GROUP BY referrer ORDER BY c DESC""", (since,))

    # Top searches
    searches = q("""SELECT search_query, COUNT(*) as c FROM events
        WHERE type='search' AND search_query!='' AND created_at >= ?
        GROUP BY search_query ORDER BY c DESC LIMIT 10""", (since,))

    # Category filters
    filters = q("""SELECT filter_cat, COUNT(*) as c FROM events
        WHERE type='filter_used' AND filter_cat!='' AND created_at >= ?
        GROUP BY filter_cat ORDER BY c DESC""", (since,))

    # Hourly heatmap (hour 0-23)
    hourly = q("""SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as c FROM events WHERE created_at >= ?
        GROUP BY hour ORDER BY hour""", (since,)) if not USE_POSTGRES else         q("""SELECT EXTRACT(HOUR FROM created_at)::int as hour,
        COUNT(*) as c FROM events WHERE created_at >= ?
        GROUP BY hour ORDER BY hour""", (since,))

    # Lang breakdown
    langs = q("""SELECT lang, COUNT(*) as c FROM events
        WHERE created_at >= ? GROUP BY lang""", (since,))

    # Funnel: offer_view -> booking_started -> booking_done
    funnel = {
        "offer_views": q("SELECT COUNT(*) as c FROM events WHERE type='offer_view' AND created_at >= ?", (since,))[0]["c"] if q("SELECT COUNT(*) as c FROM events WHERE type='offer_view' AND created_at >= ?", (since,)) else 0,
        "booking_started": q("SELECT COUNT(*) as c FROM events WHERE type='booking_started' AND created_at >= ?", (since,))[0]["c"] if q("SELECT COUNT(*) as c FROM events WHERE type='booking_started' AND created_at >= ?", (since,)) else 0,
        "booking_done": q("SELECT COUNT(*) as c FROM events WHERE type='booking_done' AND created_at >= ?", (since,))[0]["c"] if q("SELECT COUNT(*) as c FROM events WHERE type='booking_done' AND created_at >= ?", (since,)) else 0,
    }

    total_events = q("SELECT COUNT(*) as c FROM events WHERE created_at >= ?", (since,))
    total_sessions = q("SELECT COUNT(DISTINCT session_id) as c FROM events WHERE created_at >= ?", (since,))

    return jsonify({
        "daily": daily, "top_offers": top_offers, "devices": devices,
        "browsers": browsers, "sources": sources, "searches": searches,
        "filters": filters, "hourly": hourly, "langs": langs, "funnel": funnel,
        "total_events": total_events[0]["c"] if total_events else 0,
        "total_sessions": total_sessions[0]["c"] if total_sessions else 0,
    })

@app.route("/api/agencies/<int:aid>/analytics", methods=["GET"])
@token_required
def agency_analytics(aid):
    u = g.user
    if u["role"] not in ["admin"] and u.get("agencyId") != aid:
        return jsonify({"error":"Forbidden"}), 403
    days = int(request.args.get("days", 30))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    # Get offer IDs for this agency
    offer_ids = [o["id"] for o in db_query("SELECT id FROM offers WHERE agency_id=?", (aid,))]
    if not offer_ids:
        return jsonify({"daily":[], "top_offers":[], "funnel":{"offer_views":0,"booking_started":0,"booking_done":0}})

    placeholders = ",".join(["?" for _ in offer_ids])

    daily = db_query(f"""SELECT DATE(created_at) as day, COUNT(*) as events,
        COUNT(DISTINCT session_id) as sessions
        FROM events WHERE offer_id IN ({placeholders}) AND created_at >= ?
        GROUP BY DATE(created_at) ORDER BY day""", offer_ids + [since])

    top_offers = db_query(f"""SELECT o.title, o.id,
        COUNT(e.id) as views,
        COUNT(CASE WHEN e.type='booking_started' THEN 1 END) as bookings_started,
        COUNT(CASE WHEN e.type='booking_done' THEN 1 END) as bookings_done
        FROM events e JOIN offers o ON e.offer_id=o.id
        WHERE e.offer_id IN ({placeholders}) AND e.created_at >= ?
        GROUP BY o.id, o.title ORDER BY views DESC""", offer_ids + [since])

    funnel_views    = db_query(f"SELECT COUNT(*) as c FROM events WHERE type='offer_view' AND offer_id IN ({placeholders}) AND created_at >= ?", offer_ids + [since])
    funnel_started  = db_query(f"SELECT COUNT(*) as c FROM events WHERE type='booking_started' AND offer_id IN ({placeholders}) AND created_at >= ?", offer_ids + [since])
    funnel_done     = db_query(f"SELECT COUNT(*) as c FROM events WHERE type='booking_done' AND offer_id IN ({placeholders}) AND created_at >= ?", offer_ids + [since])

    return jsonify({
        "daily": daily,
        "top_offers": top_offers,
        "funnel": {
            "offer_views":      funnel_views[0]["c"] if funnel_views else 0,
            "booking_started":  funnel_started[0]["c"] if funnel_started else 0,
            "booking_done":     funnel_done[0]["c"] if funnel_done else 0,
        }
    })

# ─── STATIC ──────────────────────────────────────────────────────────────────

@app.route("/", defaults={"path":""})
@app.route("/<path:path>")
def serve(path):
    if path and os.path.exists(os.path.join("static", path)):
        return send_from_directory("static", path)
    return send_from_directory("static", "index.html")

# ─── STARTUP ─────────────────────────────────────────────────────────────────

def run_migrations():
    """Always runs migrations — even on already-seeded DBs."""
    print("🔄  Running migrations …")
    if USE_POSTGRES:
        db = _pg_conn()
        cur = db.cursor()
        cur.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';")
        cur.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INTEGER;")
        cur.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';")
        cur.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS agency_reply TEXT DEFAULT '';")
        cur.execute("ALTER TABLE reviews ALTER COLUMN status SET DEFAULT 'approved';")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                offer_id INTEGER,
                user_id INTEGER,
                session_id TEXT,
                device TEXT DEFAULT '',
                browser TEXT DEFAULT '',
                country TEXT DEFAULT '',
                referrer TEXT DEFAULT '',
                lang TEXT DEFAULT 'fr',
                search_query TEXT DEFAULT '',
                filter_cat TEXT DEFAULT '',
                metadata TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db.commit()
        db.close()
    else:
        import sqlite3 as _sq
        db = _sq.connect(DB)
        cols = [r[1] for r in db.execute("PRAGMA table_info(bookings)").fetchall()]
        if 'phone' not in cols:
            db.execute("ALTER TABLE bookings ADD COLUMN phone TEXT DEFAULT ''")
        ucols = [r[1] for r in db.execute("PRAGMA table_info(users)").fetchall()]
        if 'phone' not in ucols:
            db.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
        if 'avatar' not in ucols:
            db.execute("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''")
        db.execute("""CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE, expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id))""")
        db.execute("""CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL, offer_id INTEGER, user_id INTEGER,
            session_id TEXT, device TEXT DEFAULT '', browser TEXT DEFAULT '',
            country TEXT DEFAULT '', referrer TEXT DEFAULT '',
            lang TEXT DEFAULT 'fr', search_query TEXT DEFAULT '',
            filter_cat TEXT DEFAULT '', metadata TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")
        db.commit()
        db.close()
    print("✅  Migrations done")

if USE_POSTGRES or not os.path.exists("getlost.db"):
    print("🔧  Initialising database …")
    init_db()

run_migrations()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀  Get Lost DZ  →  http://localhost:{port}")
    print("    admin@getlostdz.com / admin123")
    print("    agency1@getlostdz.com / agency123")
    print("    sarah@test.com / user123")
    app.run(debug=False, host="0.0.0.0", port=port)