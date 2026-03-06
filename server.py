"""
GET LOST DZ — Full Backend API
Flask + SQLite + JWT + bcrypt
"""
import sqlite3, bcrypt, jwt, json, os
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

JWT_SECRET = "getlostdz_jwt_secret_2025"
DB = "getlost.db"

# ─── DATABASE ─────────────────────────────────────────────────────────────────

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
    db = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur.lastrowid

def init_db():
    db = sqlite3.connect(DB)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'traveler',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS agencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            logo TEXT DEFAULT '🏢',
            plan TEXT DEFAULT 'standard',
            status TEXT DEFAULT 'approved',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agency_id INTEGER NOT NULL,
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(agency_id) REFERENCES agencies(id)
        );
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            offer_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            title TEXT NOT NULL,
            comment TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(offer_id) REFERENCES offers(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            offer_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            message TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(offer_id) REFERENCES offers(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    """)
    db.commit()

    # seed users
    seeds = [
        ("Admin GetLost", "admin@getlostdz.com", "admin123", "admin"),
        ("DZ Horizons Travel", "agency1@getlostdz.com", "agency123", "agency"),
        ("Sahara Wings", "agency2@getlostdz.com", "agency123", "agency"),
        ("Atlas Adventures", "agency3@getlostdz.com", "agency123", "agency"),
        ("Sarah Meziane", "sarah@test.com", "user123", "traveler"),
        ("Karim Bensalem", "karim@test.com", "user123", "traveler"),
    ]
    for name, email, pw, role in seeds:
        hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
        try:
            db.execute("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)", (name,email,hashed,role))
        except: pass
    db.commit()

    # seed agencies
    ag_seeds = [
        (2,"DZ Horizons Travel","Spécialiste voyages internationaux premium","✈️","premium","approved"),
        (3,"Sahara Wings","Expert destinations africaines et randonnées","🦅","standard","approved"),
        (4,"Atlas Adventures","Aventures et treks en Algérie","⛰️","standard","approved"),
    ]
    for uid,name,desc,logo,plan,status in ag_seeds:
        try:
            db.execute("INSERT INTO agencies(user_id,name,description,logo,plan,status) VALUES(?,?,?,?,?,?)",(uid,name,desc,logo,plan,status))
        except: pass
    db.commit()

    # seed offers
    offers = [
        (1,"Zanzibar Paradise","intl",185000,8,"Afrique de l'Est",
         "Découvrez les plages paradisiaques de Zanzibar avec hébergement 4★, vols et transferts inclus. Une expérience entre plages de sable blanc et culture swahili.",
         "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=700&q=80",
         '["Jour 1: Arrivée Stone Town, visite guidée","Jour 2-3: North Coast, plages de Nungwi","Jour 4-5: Snorkeling & plage Kendwa","Jour 6-7: Safari bleu & épices","Jour 8: Retour"]',
         '["Vol A/R","Hébergement 4★","Transferts aéroport","Guide francophone","Petit-déjeuner"]',
         '["15 Avril 2025","10 Mai 2025","20 Juin 2025"]',"approved"),
        (1,"Kenya Safari & Masai Mara","intl",220000,10,"Afrique de l'Est",
         "Safari inoubliable dans le Masai Mara avec lodge de luxe, game drives et rencontre avec les Maasaï.",
         "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=80",
         '["Jour 1: Nairobi, arrivée","Jour 2-4: Masai Mara safaris","Jour 5-6: Amboseli & Kilimandjaro","Jour 7-9: Plages Mombasa","Jour 10: Retour"]',
         '["Vol A/R","Lodge 4★","Safaris 4x4","Pension complète","Guide expert"]',
         '["5 Mai 2025","1 Juin 2025","15 Juillet 2025"]',"approved"),
        (2,"Tamanrasset & Massif du Hoggar","national",55000,5,"Tamanrasset",
         "Plongez au cœur du Sahara algérien. Dormez sous un ciel étoilé, explorez les formations rocheuses du Hoggar.",
         "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&q=80",
         '["Jour 1: Vol Alger→Tamanrasset","Jour 2: Assekrem & coucher soleil","Jour 3-4: Trek dans le Hoggar","Jour 5: Retour"]',
         '["Vol interne A/R","Camping équipé","Guide local","Repas traditionnels"]',
         '["20 Mars 2025","15 Avril 2025","10 Oct 2025"]',"approved"),
        (2,"Kabylie — Villages & Cascades","national",18000,3,"Kabylie",
         "Week-end en Kabylie : villages berbères authentiques, cascade de Kefrida et lac Tiouliline.",
         "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&q=80",
         '["Jour 1: Cascade de Kefrida & baignade","Jour 2: Villages berbères traditionnels","Jour 3: Lac Tiouliline & retour"]',
         '["Transport confort","Hébergement","Petit-déjeuner"]',
         '["Chaque week-end"]',"approved"),
        (3,"Trek Djurdjura — Bivouac","hike",12000,2,"Bouira / Tizi Ouzou",
         "Randonnée au Parc National du Djurdjura avec bivouac sous les étoiles.",
         "https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&q=80",
         '["Jour 1: Tala Guilef → Col de Tirourda","Jour 2: Sommet Lalla Khedidja → retour"]',
         '["Guide certifié","Matériel bivouac complet","Repas sur le parcours"]',
         '["Tous les samedis"]',"approved"),
        (3,"Sahara Bivouac Weekend","hike",25000,3,"El Oued",
         "Nuit dans les dunes de l'erg algérien, balade en dromadaire et coucher de soleil spectaculaire.",
         "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=700&q=80",
         '["Jour 1: Route des dunes en 4x4","Jour 2: Dromadaires & coucher soleil","Jour 3: Oasis & retour"]',
         '["Transport 4x4","Tente dans les dunes","Repas traditionnels","Guide"]',
         '["Chaque week-end Nov-Mars"]',"approved"),
        (1,"Visa Turquie Express","visa",8500,1,"Service en ligne",
         "Visa électronique pour la Turquie en 48h. Accompagnement complet du dossier.",
         "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=700&q=80",
         '["Préparation du dossier","Soumission en ligne","Suivi temps réel","Livraison visa"]',
         '["Accompagnement complet","Traduction si besoin","Suivi dossier","Support 24/7"]',
         '["Disponible toute l\'année"]',"approved"),
        (2,"Malaisie & Bali — Grand Tour","intl",310000,14,"Asie du Sud-Est",
         "Combiné Kuala Lumpur & Bali — villes modernes, rizières et plages tropicales.",
         "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=700&q=80",
         '["J1-4: Kuala Lumpur","J5-7: Langkawi & îles","J8-11: Ubud rizières Bali","J12-14: Seminyak plages"]',
         '["Vols internationaux","Hôtels 4★","Transferts","Visites guidées"]',
         '["20 Juillet 2025","5 Août 2025"]',"approved"),
    ]
    for ag_id,title,cat,price,dur,region,desc,img,itin,incl,dates,status in offers:
        try:
            db.execute("""INSERT INTO offers(agency_id,title,category,price,duration,region,description,
                image_url,itinerary,includes,available_dates,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
                (ag_id,title,cat,price,dur,region,desc,img,itin,incl,dates,status))
        except: pass
    db.commit()

    # seed reviews
    rev_seeds = [
        (1,5,5,"Voyage de rêve !","Zanzibar était absolument magnifique. Organisation parfaite.","approved"),
        (1,6,4,"Très bonne expérience","Belles plages, bon hébergement. Quelques retards.","approved"),
        (3,5,5,"Sahara magique","Dormir sous les étoiles au Hoggar, expérience inoubliable.","approved"),
        (5,5,5,"Trek parfait","Le Djurdjura est splendide. Guide très compétent.","approved"),
        (2,6,5,"Kenya exceptionnel","Les safaris au Masai Mara dépassent toutes les attentes !","approved"),
    ]
    for oid,uid,rating,title,comment,status in rev_seeds:
        try:
            db.execute("INSERT INTO reviews(offer_id,user_id,rating,title,comment,status) VALUES(?,?,?,?,?,?)",(oid,uid,rating,title,comment,status))
        except: pass
    db.commit()
    db.close()
    print("✅  Database seeded")

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
    if not name or not email or not password:
        return jsonify({"error":"Tous les champs sont requis"}), 400
    if len(password) < 6:
        return jsonify({"error":"Mot de passe: minimum 6 caractères"}), 400
    if db_query("SELECT id FROM users WHERE email=?", (email,), one=True):
        return jsonify({"error":"Email déjà utilisé"}), 409
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    uid = db_run("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",(name,email,hashed,role))
    agency_id = None
    if role == "agency":
        agency_name = (d.get("agencyName") or name).strip()
        desc = (d.get("description") or "").strip()
        agency_id = db_run("INSERT INTO agencies(user_id,name,description,status) VALUES(?,?,?,?)",(uid,agency_name,desc,"approved"))
    user = {"id":uid,"name":name,"email":email,"role":role}
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
        "id":user["id"],"name":user["name"],"email":user["email"],"role":user["role"],"agencyId":agency_id
    }})

@app.route("/api/auth/me", methods=["GET"])
@token_required
def me():
    u = db_query("SELECT id,name,email,role,created_at FROM users WHERE id=?", (g.user["id"],), one=True)
    return jsonify(u)

# ─── OFFERS ───────────────────────────────────────────────────────────────────

def parse_offer(o):
    if not o: return o
    for f in ["itinerary","includes","available_dates"]:
        try: o[f] = json.loads(o.get(f) or "[]")
        except: o[f] = []
    return o

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
    sql += " GROUP BY o.id"
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
             WHERE o.id=? GROUP BY o.id""", (oid,), one=True)
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
    rating = int(d.get("rating",0))
    title  = (d.get("title") or "").strip()
    if not rating or not title: return jsonify({"error":"Rating and title required"}), 400
    if not (1 <= rating <= 5):  return jsonify({"error":"Rating must be 1-5"}), 400
    if db_query("SELECT id FROM reviews WHERE offer_id=? AND user_id=?", (oid,u["id"]), one=True):
        return jsonify({"error":"You already reviewed this offer"}), 409
    rid = db_run("INSERT INTO reviews(offer_id,user_id,rating,title,comment,status) VALUES(?,?,?,?,?,?)",
        (oid, u["id"], rating, title, d.get("comment",""), "pending"))
    return jsonify({"id":rid,"message":"Review submitted – will appear after moderation"}), 201

@app.route("/api/reviews/<int:rid>/status", methods=["PATCH"])
@admin_required
def set_review_status(rid):
    status = (request.json or {}).get("status")
    if status not in ["approved","rejected"]: return jsonify({"error":"Invalid"}), 400
    db_run("UPDATE reviews SET status=? WHERE id=?", (status,rid))
    return jsonify({"message":f"Review {status}"})

# ─── AGENCIES ────────────────────────────────────────────────────────────────

@app.route("/api/agencies", methods=["GET"])
def get_agencies():
    rows = db_query("""SELECT a.*, u.email,
        COUNT(DISTINCT o.id) offer_count,
        COUNT(DISTINCT b.id) booking_count
        FROM agencies a JOIN users u ON a.user_id=u.id
        LEFT JOIN offers o ON o.agency_id=a.id AND o.status='approved'
        LEFT JOIN bookings b ON b.offer_id IN (SELECT id FROM offers WHERE agency_id=a.id)
        GROUP BY a.id ORDER BY a.id""")
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
    oid = d.get("offerId")
    if not oid: return jsonify({"error":"offerId required"}), 400
    if not db_query("SELECT id FROM offers WHERE id=? AND status='approved'", (oid,), one=True):
        return jsonify({"error":"Offer not found"}), 404
    bid = db_run("INSERT INTO bookings(offer_id,user_id,message) VALUES(?,?,?)",
        (oid, u["id"], d.get("message","")))
    return jsonify({"id":bid,"message":"Booking confirmed! The agency will contact you within 24h."}), 201

@app.route("/api/bookings/my", methods=["GET"])
@token_required
def my_bookings():
    rows = db_query("""SELECT b.*, o.title offer_title, o.price, o.image_url, o.category
        FROM bookings b JOIN offers o ON b.offer_id=o.id
        WHERE b.user_id=? ORDER BY b.created_at DESC""", (g.user["id"],))
    return jsonify(rows)

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
        GROUP BY o.id ORDER BY (o.status='pending') DESC, o.id DESC""")
    return jsonify([parse_offer(o) for o in rows])

@app.route("/api/admin/reviews", methods=["GET"])
@admin_required
def admin_reviews():
    rows = db_query("""SELECT r.*, u.name user_name, o.title offer_title
        FROM reviews r JOIN users u ON r.user_id=u.id JOIN offers o ON r.offer_id=o.id
        ORDER BY (r.status='pending') DESC, r.created_at DESC""")
    return jsonify(rows)

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_users():
    rows = db_query("SELECT id,name,email,role,created_at FROM users ORDER BY id")
    return jsonify(rows)

# ─── STATIC ──────────────────────────────────────────────────────────────────

@app.route("/", defaults={"path":""})
@app.route("/<path:path>")
def serve(path):
    if path and os.path.exists(os.path.join("static", path)):
        return send_from_directory("static", path)
    return send_from_directory("static", "index.html")

# ─── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not os.path.exists(DB):
        print("🔧  Initialising database …")
        init_db()
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀  Get Lost DZ  →  http://localhost:{port}")
    print("    admin@getlostdz.com / admin123")
    print("    agency1@getlostdz.com / agency123")
    print("    sarah@test.com / user123")
    app.run(debug=False, host="0.0.0.0", port=port)
