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
                images TEXT DEFAULT '[]',
                itinerary TEXT DEFAULT '[]',
                includes TEXT DEFAULT '[]',
                available_dates TEXT DEFAULT '[]',
                price_details TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                archived BOOLEAN DEFAULT FALSE,
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS offer_departures (
                id SERIAL PRIMARY KEY,
                offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
                departure_date DATE NOT NULL,
                return_date DATE,
                max_places INTEGER NOT NULL DEFAULT 20,
                label TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS custom_requests (
                id SERIAL PRIMARY KEY,
                agency_id INTEGER NOT NULL REFERENCES agencies(id),
                user_id INTEGER REFERENCES users(id),
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT DEFAULT '',
                month TEXT NOT NULL,
                travelers TEXT NOT NULL DEFAULT '[]',
                budget TEXT DEFAULT '',
                duration TEXT DEFAULT '',
                style TEXT DEFAULT '',
                safari TEXT DEFAULT '',
                message TEXT DEFAULT '',
                status TEXT DEFAULT 'new',
                agency_notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                offer_id INTEGER NOT NULL REFERENCES offers(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                phone TEXT DEFAULT '',
                message TEXT DEFAULT '',
                travelers INTEGER DEFAULT 1,
                departure_id INTEGER,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS booking_checklist (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                flight TEXT DEFAULT 'pending',
                hotel TEXT DEFAULT 'pending',
                visa TEXT DEFAULT 'pending',
                activities TEXT DEFAULT 'pending',
                guides TEXT DEFAULT 'pending',
                insurance TEXT DEFAULT 'no',
                group_type TEXT DEFAULT '',
                amount_paid INTEGER DEFAULT 0,
                amount_total INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, offer_id)
            );
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
                images TEXT DEFAULT '[]',
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
                travelers INTEGER DEFAULT 1,
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
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                offer_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, offer_id),
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(offer_id) REFERENCES offers(id) ON DELETE CASCADE
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
        ("Admin GetLost",    "admin@getlostdz.com",       h("Belaloui2024*"),   "admin"),
        ("Get Lost DZ",      "elyaminedb@getlostdz.com",  h("Belaloui2024*"),  "agency"),
    ]
    agencies = [
        (2, "Get Lost DZ", "Votre agence de voyage en Algerie. Zanzibar, Vietnam, et plus. Des voyages inoubliables organises par des passionnes.", "🌍", "premium", "approved"),
    ]
    offers = [
        (1, "Zanzibar — Sejour Paradisiaque",
         "intl", 238000, 9, "Zanzibar, Tanzanie",
         "Decouvrez Zanzibar du 17 au 27 juillet 2025. 9 jours et 8 nuits dans l'un des plus beaux endroits du monde.\n\nOption economique (2 villes) : 238 000 DZD/pers\nOption VIP (3 villes, hotels pieds dans l'eau) : 299 000 DZD/pers\n\nContactez-nous sur WhatsApp pour tous les details.",
         "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&w=700",
         '[\"Jour 1 : Arrivee a Zanzibar — transfert hotel\",\"Jour 2-3 : Nungwi — plages, snorkeling, coucher de soleil\",\"Jour 4-5 : Excursions — Prison Island, Stone Town\",\"Jour 6-7 : Detente plage, activites nautiques\",\"Jour 8 : Journee libre, shopping local\",\"Jour 9 : Transfert aeroport — retour\"]',
         '[\"Vol aller-retour\",\"Hebergement 8 nuits\",\"Transferts aeroport\",\"Petit-dejeuner inclus\",\"Assurance voyage\"]',
         '[\"17 Juillet 2025\"]',
         "approved"),
    ]
    reviews = []

    if USE_POSTGRES:
        for name, email, pw, role in users:
            cur.execute("INSERT INTO users(name,email,password,role) VALUES(%s,%s,%s,%s) ON CONFLICT(email) DO NOTHING", (name, email, pw, role))
        # Set agency phone number
        cur.execute("UPDATE users SET phone=%s WHERE email=%s", ("+213782829246", "elyaminedb@getlostdz.com"))
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
        # Set agency phone number
        db.execute("UPDATE users SET phone=? WHERE email=?", ("+213782829246", "elyaminedb@getlostdz.com"))
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
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travelers INTEGER DEFAULT 1;",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departure_id INTEGER;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS family_name TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';",
            "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INTEGER;",
            "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';",
            "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS agency_reply TEXT DEFAULT '';",
            "ALTER TABLE offers ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]';",
            "ALTER TABLE offers ADD COLUMN IF NOT EXISTS price_details TEXT DEFAULT '';",
            "ALTER TABLE offers ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;",
            """CREATE TABLE IF NOT EXISTS offer_departures (
                id SERIAL PRIMARY KEY,
                offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
                departure_date DATE NOT NULL,
                return_date DATE,
                max_places INTEGER NOT NULL DEFAULT 20,
                label TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS custom_requests (
                id SERIAL PRIMARY KEY,
                agency_id INTEGER NOT NULL REFERENCES agencies(id),
                user_id INTEGER REFERENCES users(id),
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT DEFAULT '',
                month TEXT NOT NULL,
                travelers TEXT NOT NULL DEFAULT '[]',
                budget TEXT DEFAULT '',
                duration TEXT DEFAULT '',
                style TEXT DEFAULT '',
                safari TEXT DEFAULT '',
                message TEXT DEFAULT '',
                status TEXT DEFAULT 'new',
                agency_notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS booking_checklist (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                flight TEXT DEFAULT 'pending',
                hotel TEXT DEFAULT 'pending',
                visa TEXT DEFAULT 'pending',
                activities TEXT DEFAULT 'pending',
                guides TEXT DEFAULT 'pending',
                insurance TEXT DEFAULT 'no',
                group_type TEXT DEFAULT '',
                amount_paid INTEGER DEFAULT 0,
                amount_total INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
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
        if "travelers" not in bcols:
            db.execute("ALTER TABLE bookings ADD COLUMN travelers INTEGER DEFAULT 1")
        if "departure_id" not in bcols:
            db.execute("ALTER TABLE bookings ADD COLUMN departure_id INTEGER")
        rcols = {r[1] for r in db.execute("PRAGMA table_info(reviews)").fetchall()}
        for col, dflt in [("booking_id", "NULL"), ("photo", "''"), ("agency_reply", "''")]:
            if col not in rcols:
                db.execute(f"ALTER TABLE reviews ADD COLUMN {col} TEXT DEFAULT {dflt}")
        ocols = {r[1] for r in db.execute("PRAGMA table_info(offers)").fetchall()}
        if "images" not in ocols:
            db.execute("ALTER TABLE offers ADD COLUMN images TEXT DEFAULT '[]'")
        if "price_details" not in ocols:
            db.execute("ALTER TABLE offers ADD COLUMN price_details TEXT DEFAULT ''")
        if "archived" not in ocols:
            db.execute("ALTER TABLE offers ADD COLUMN archived INTEGER DEFAULT 0")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS offer_departures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
                departure_date TEXT NOT NULL,
                return_date TEXT,
                max_places INTEGER NOT NULL DEFAULT 20,
                label TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """);
        db.executescript("""
            CREATE TABLE IF NOT EXISTS custom_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agency_id INTEGER NOT NULL REFERENCES agencies(id),
                user_id INTEGER,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT DEFAULT '',
                month TEXT NOT NULL,
                travelers TEXT NOT NULL DEFAULT '[]',
                budget TEXT DEFAULT '',
                duration TEXT DEFAULT '',
                style TEXT DEFAULT '',
                safari TEXT DEFAULT '',
                message TEXT DEFAULT '',
                status TEXT DEFAULT 'new',
                agency_notes TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS booking_checklist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                flight TEXT DEFAULT 'pending',
                hotel TEXT DEFAULT 'pending',
                visa TEXT DEFAULT 'pending',
                activities TEXT DEFAULT 'pending',
                guides TEXT DEFAULT 'pending',
                insurance TEXT DEFAULT 'no',
                group_type TEXT DEFAULT '',
                amount_paid INTEGER DEFAULT 0,
                amount_total INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """);
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
