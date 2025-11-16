# db.py
import sqlite3
import os
from datetime import datetime, timedelta
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

DB_FILE = "database.db"

def get_conn():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_FILE):
        conn = get_conn()
        c = conn.cursor()
        # users: id, name (unique), password_hash, face_image (path), created_at
        c.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            face_image TEXT,
            created_at TEXT
        )
        """)
        # sessions: token, user_id, expires_at
        c.execute("""
        CREATE TABLE sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER,
            expires_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)
        # photos metadata: id, filename, uploaded_at, matched_users (JSON string)
        c.execute("""
        CREATE TABLE photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            uploaded_at TEXT,
            matches TEXT
        )
        """)
        conn.commit()
        conn.close()
        print("Initialized database:", DB_FILE)
    else:
        print("Database exists:", DB_FILE)

# USER helpers
def create_user(name, password=None, face_image=None):
    conn = get_conn()
    c = conn.cursor()
    pw_hash = generate_password_hash(password) if password else None
    now = datetime.utcnow().isoformat()
    try:
        c.execute("INSERT INTO users (name, password_hash, face_image, created_at) VALUES (?,?,?,?)",
                  (name, pw_hash, face_image, now))
        conn.commit()
        user_id = c.lastrowid
    except sqlite3.IntegrityError:
        user_id = None
    conn.close()
    return user_id

def get_user_by_name(name):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE name = ?", (name,))
    row = c.fetchone()
    conn.close()
    return row

def verify_password(name, password):
    user = get_user_by_name(name)
    if not user or not user["password_hash"]:
        return False, None
    ok = check_password_hash(user["password_hash"], password)
    return ok, user

# SESSIONS (token)
def create_session(user_id, hours_valid=24):
    conn = get_conn()
    c = conn.cursor()
    token = str(uuid.uuid4())
    expires = (datetime.utcnow() + timedelta(hours=hours_valid)).isoformat()
    c.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)", (token, user_id, expires))
    conn.commit()
    conn.close()
    return token, expires

def verify_token(token):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM sessions WHERE token = ?", (token,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    if datetime.fromisoformat(row["expires_at"]) < datetime.utcnow():
        return None
    return row["user_id"]

# PHOTOS metadata
def save_photo_metadata(filename, matches):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    import json
    matches_json = json.dumps(matches)
    c.execute("INSERT INTO photos (filename, uploaded_at, matches) VALUES (?,?,?)",
              (filename, now, matches_json))
    conn.commit()
    conn.close()

def delete_photo_metadata(filename):
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM photos WHERE filename = ?", (filename,))
    conn.commit()
    conn.close()

def delete_user(name):
    conn = get_conn()
    c = conn.cursor()
    # Get user id
    c.execute("SELECT id FROM users WHERE name = ?", (name,))
    row = c.fetchone()
    if not row:
        conn.close()
        return False
    user_id = row["id"]
    # Delete sessions
    c.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    # Delete user
    c.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return True


