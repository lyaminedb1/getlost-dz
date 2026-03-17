"""
GET LOST DZ — Database Initialisation & Migrations
Separated from app logic so it can be run standalone or imported.
"""
import bcrypt
from app.config import USE_POSTGRES, SQLITE_FILE


def init_db():
    """Create all tables and seed demo data if DB is empty."""
    if USE_POSTGRES:
        from app.db import raw_conn
        db = raw_conn()
        cur = db.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                family_name TEXT DEFAULT '',
                birth_date TEXT DEFAULT '',
                gender TEXT DEFAULT '',
                city TEXT DEFAULT '',
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
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                offer_id INTEGER NOT NULL REFERENCES offers(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                phone TEXT DEFAULT '',
                message TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
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
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                sender_id INTEGER NOT NULL REFERENCES users(id),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP
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
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                body TEXT,
                link VARCHAR(255),
                ref_id INTEGER,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, read_at);
        """)
        db.commit()
        cur.execute("SELECT COUNT(*) as c FROM users")
        already_seeded = cur.fetchone()["c"] > 0
    else:
        import sqlite3
        db = sqlite3.connect(SQLITE_FILE)
        db.row_factory = sqlite3.Row
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                family_name TEXT DEFAULT '',
                birth_date TEXT DEFAULT '',
                gender TEXT DEFAULT '',
                city TEXT DEFAULT '',
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'traveler',
                phone TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
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
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                offer_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                phone TEXT DEFAULT '',
                message TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(offer_id) REFERENCES offers(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                offer_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                booking_id INTEGER,
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                title TEXT NOT NULL,
                comment TEXT DEFAULT '',
                photo TEXT DEFAULT '',
                agency_reply TEXT DEFAULT '',
                status TEXT DEFAULT 'approved',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(offer_id) REFERENCES offers(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME,
                FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY(sender_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT,
                link TEXT,
                ref_id INTEGER,
                read_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        already_seeded = db.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0

    if already_seeded:
        db.close()
        print("✅  DB already seeded — skipping seed")
        return

    # ── Seed data ────────────────────────────────────────────────────────────
    def h(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    users = [
        ("Admin GetLost",    "admin@getlostdz.com",    h("admin123"),   "admin"),
        ("DZ Horizons",      "agency1@getlostdz.com",  h("agency123"),  "agency"),
        ("Sahara Wings",     "agency2@getlostdz.com",  h("agency123"),  "agency"),
        ("Atlas Adventures", "agency3@getlostdz.com",  h("agency123"),  "agency"),
        ("Sarah Meziane",    "sarah@test.com",          h("user123"),    "traveler"),
        ("Karim Bensalem",   "karim@test.com",          h("user123"),    "traveler"),
    ]
    agencies = [
        (2, "DZ Horizons Travel",  "Spécialiste voyages internationaux", "✈️", "premium",  "approved"),
        (3, "Sahara Wings",         "Expert destinations africaines",     "🦅", "standard", "approved"),
        (4, "Atlas Adventures",     "Aventures et treks en Algérie",      "⛰️", "standard", "approved"),
    ]
    offers = [
        (1, "Zanzibar Paradise",   "intl",     185000, 8,  "Afrique Est",   "Plages paradisiaques de Zanzibar.",       "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=700&q=80",   '[\"Jour 1: Stone Town\",\"Jour 8: Retour\"]',     '[\"Vol A/R\",\"Hébergement 4 étoiles\"]', '[\"15 Avril 2025\",\"10 Mai 2025\"]',  "approved"),
        (1, "Kenya Safari",        "intl",     220000, 10, "Afrique Est",   "Safari inoubliable Masai Mara.",          "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=80",   '[\"Jour 1: Nairobi\",\"Jour 10: Retour\"]',       '[\"Vol A/R\",\"Lodge 4 étoiles\"]',       '[\"5 Mai 2025\",\"1 Juin 2025\"]',     "approved"),
        (2, "Tamanrasset & Hoggar","national",  55000,  5, "Tamanrasset",   "Sahara algérien.",                        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&q=80",  '[\"Jour 1: Vol Alger-Tam\",\"Jour 5: Retour\"]',  '[\"Vol interne\",\"Camping\",\"Guide\"]',  '[\"20 Mars 2025\"]',                   "approved"),
        (2, "Kabylie Villages",    "national",  18000,  3, "Kabylie",       "Week-end en Kabylie.",                    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&q=80",  '[\"Jour 1: Cascade\",\"Jour 3: Retour\"]',        '[\"Transport\",\"Hébergement\"]',         '[\"Chaque week-end\"]',                "approved"),
        (3, "Trek Djurdjura",      "hike",      12000,  2, "Bouira",        "Randonnée Djurdjura.",                    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&q=80",   '[\"Jour 1: Tala Guilef\",\"Jour 2: Sommet\"]',    '[\"Guide\",\"Bivouac\"]',                 '[\"Tous les samedis\"]',               "approved"),
        (3, "Sahara Bivouac",      "hike",      25000,  3, "El Oued",       "Nuit dans les dunes.",                    "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=700&q=80",  '[\"Jour 1: Dunes 4x4\",\"Jour 3: Retour\"]',      '[\"4x4\",\"Tente\",\"Guide\"]',            '[\"Week-ends Nov-Mars\"]',             "approved"),
        (1, "Visa Turquie Express","visa",       8500,  1, "Service ligne", "Visa electronique 48h.",                  "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=700&q=80",  '[\"Préparation\",\"Livraison\"]',                 '[\"Accompagnement\",\"Support 24/7\"]',   '[\"Toute lannee\"]',                  "approved"),
        (2, "Malaisie et Bali",    "intl",     310000, 14, "Asie Sud-Est",  "Combiné Kuala Lumpur et Bali.",           "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=700&q=80",  '[\"J1-4: KL\",\"J8-14: Bali\"]',                 '[\"Vols\",\"Hotels 4 étoiles\"]',         '[\"20 Juillet 2025\"]',               "approved"),
    ]
    reviews = [
        (1, 5, 5, "Voyage de rêve !",       "Zanzibar magnifique.", "approved"),
        (1, 6, 4, "Très bonne expérience",   "Belles plages.",       "approved"),
        (3, 5, 5, "Sahara magique",           "Inoubliable.",         "approved"),
        (5, 5, 5, "Trek parfait",             "Djurdjura splendide.", "approved"),
        (2, 6, 5, "Kenya exceptionnel",       "Masai Mara !",         "approved"),
    ]

    if USE_POSTGRES:
        for name, email, pw, role in users:
            cur.execute("INSERT INTO users(name,email,password,role) VALUES(%s,%s,%s,%s) ON CONFLICT(email) DO NOTHING", (name, email, pw, role))
        db.commit()
        for uid, name, desc, logo, plan, status in agencies:
            cur.execute("INSERT INTO agencies(user_id,name,description,logo,plan,status) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT(user_id) DO NOTHING", (uid, name, desc, logo, plan, status))
        db.commit()
        for ag_id, title, cat, price, dur, region, desc, img, itin, incl, dates, status in offers:
            cur.execute("INSERT INTO offers(agency_id,title,category,price,duration,region,description,image_url,itinerary,includes,available_dates,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (ag_id, title, cat, price, dur, region, desc, img, itin, incl, dates, status))
        db.commit()
        for oid, uid, rating, title, comment, status in reviews:
            cur.execute("INSERT INTO reviews(offer_id,user_id,rating,title,comment,status) VALUES(%s,%s,%s,%s,%s,%s)", (oid, uid, rating, title, comment, status))
        db.commit()
        db.close()
    else:
        for name, email, pw, role in users:
            try: db.execute("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)", (name, email, pw, role))
            except: pass
        for uid, name, desc, logo, plan, status in agencies:
            try: db.execute("INSERT INTO agencies(user_id,name,description,logo,plan,status) VALUES(?,?,?,?,?,?)", (uid, name, desc, logo, plan, status))
            except: pass
        for ag_id, title, cat, price, dur, region, desc, img, itin, incl, dates, status in offers:
            try: db.execute("INSERT INTO offers(agency_id,title,category,price,duration,region,description,image_url,itinerary,includes,available_dates,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (ag_id, title, cat, price, dur, region, desc, img, itin, incl, dates, status))
            except: pass
        for oid, uid, rating, title, comment, status in reviews:
            try: db.execute("INSERT INTO reviews(offer_id,user_id,rating,title,comment,status) VALUES(?,?,?,?,?,?)", (oid, uid, rating, title, comment, status))
            except: pass
        db.commit()

    print("✅  Database seeded with demo data")


def run_migrations():
    """Idempotent migrations — safe to run on every startup."""
    print("🔄  Running migrations …")
    if USE_POSTGRES:
        from app.db import raw_conn
        db = raw_conn()
        cur = db.cursor()
        migrations = [
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS family_name TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';",
            "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INTEGER;",
            "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';",
            "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS agency_reply TEXT DEFAULT '';",
            "ALTER TABLE reviews ALTER COLUMN status SET DEFAULT 'approved';",
            """CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL, offer_id INTEGER, user_id INTEGER,
                session_id TEXT, device TEXT DEFAULT '', browser TEXT DEFAULT '',
                country TEXT DEFAULT '', referrer TEXT DEFAULT '',
                lang TEXT DEFAULT 'fr', search_query TEXT DEFAULT '',
                filter_cat TEXT DEFAULT '', metadata TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                body TEXT,
                link VARCHAR(255),
                ref_id INTEGER,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            "CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, read_at);",
        ]
        for m in migrations:
            try: cur.execute(m)
            except Exception as e: print(f"  ⚠️  Migration skipped: {e}")
        db.commit()
        db.close()
    else:
        import sqlite3
        db = sqlite3.connect(SQLITE_FILE)
        existing = {r[1] for r in db.execute("PRAGMA table_info(users)").fetchall()}
        for col, dflt in [("phone","''"), ("avatar","''"), ("family_name","''"), ("birth_date","''"), ("gender","''"), ("city","''")]:
            if col not in existing:
                db.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT DEFAULT {dflt}")
        bcols = {r[1] for r in db.execute("PRAGMA table_info(bookings)").fetchall()}
        if "phone" not in bcols:
            db.execute("ALTER TABLE bookings ADD COLUMN phone TEXT DEFAULT ''")
        rcols = {r[1] for r in db.execute("PRAGMA table_info(reviews)").fetchall()}
        for col, dflt in [("booking_id", "NULL"), ("photo", "''"), ("agency_reply", "''")]:
            if col not in rcols:
                db.execute(f"ALTER TABLE reviews ADD COLUMN {col} TEXT DEFAULT {dflt}")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
                token TEXT NOT NULL UNIQUE, expires_at DATETIME NOT NULL,
                used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id));
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY, type TEXT NOT NULL,
                offer_id INTEGER, user_id INTEGER, session_id TEXT,
                device TEXT DEFAULT '', browser TEXT DEFAULT '', country TEXT DEFAULT '',
                referrer TEXT DEFAULT '', lang TEXT DEFAULT 'fr',
                search_query TEXT DEFAULT '', filter_cat TEXT DEFAULT '',
                metadata TEXT DEFAULT '{}', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT,
                link TEXT,
                ref_id INTEGER,
                read_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
        """)
        db.commit()
        db.close()
    print("✅  Migrations done")
