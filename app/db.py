"""
GET LOST DZ — Database Layer
Single source of truth for all DB access.
Supports PostgreSQL (prod) and SQLite (dev) transparently.
"""
import sqlite3
from flask import g
from app.config import DATABASE_URL, USE_POSTGRES, SQLITE_FILE


# ── Connection helpers ────────────────────────────────────────────────────────

if USE_POSTGRES:
    import psycopg2, psycopg2.extras

    def _pg_conn():
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)

    def get_db():
        if "db" not in g:
            g.db = _pg_conn()
        return g.db

    def close_db(e=None):
        db = g.pop("db", None)
        if db:
            try: db.close()
            except: pass

    def _fix(sql):
        """Convert SQLite ? placeholders to PostgreSQL %s."""
        return sql.replace("?", "%s")

    def db_query(sql, args=(), one=False):
        cur = get_db().cursor()
        cur.execute(_fix(sql), args)
        rows = [dict(r) for r in cur.fetchall()]
        return (rows[0] if rows else None) if one else rows

    def db_run(sql, args=()):
        sql2 = _fix(sql)
        if sql2.strip().upper().startswith("INSERT"):
            sql2 = sql2.rstrip("; ") + " RETURNING id"
        db = get_db()
        cur = db.cursor()
        cur.execute(sql2, args)
        db.commit()
        if "RETURNING" in sql2:
            row = cur.fetchone()
            return row["id"] if row else None
        return None

    def raw_conn():
        """Direct connection outside request context (used by init_db / migrations)."""
        return _pg_conn()

else:
    def get_db():
        if "db" not in g:
            g.db = sqlite3.connect(SQLITE_FILE)
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA journal_mode=WAL")
            g.db.execute("PRAGMA foreign_keys=ON")
        return g.db

    def close_db(e=None):
        db = g.pop("db", None)
        if db: db.close()

    def db_query(sql, args=(), one=False):
        rows = get_db().execute(sql, args).fetchall()
        return (dict(rows[0]) if rows else None) if one else [dict(r) for r in rows]

    def db_run(sql, args=()):
        db = get_db()
        cur = db.execute(sql, args)
        db.commit()
        return cur.lastrowid

    def raw_conn():
        conn = sqlite3.connect(SQLITE_FILE)
        conn.row_factory = sqlite3.Row
        return conn
