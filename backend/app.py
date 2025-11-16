# app.py
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from utils.face_utils import recognize_and_sort_photos
import db

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
KNOWN_FOLDER = 'known_faces'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(KNOWN_FOLDER, exist_ok=True)

# Initialize DB (creates file if missing)
db.init_db()

@app.route('/')
def home():
    return "✅ Smart Wedding Drive Backend Running!"


# -----------------------------------------------------------
# REGISTER USER (Name + Password + Photo)
# -----------------------------------------------------------
@app.route('/register', methods=['POST'])
def register_user():
    try:
        name = request.form.get('name')
        file = request.files.get('photo')
        password = request.form.get('password', None)

        if not name or not file:
            return jsonify({"success": False, "error": "Name and photo are required"}), 400

        person_dir = os.path.join(KNOWN_FOLDER, name)
        os.makedirs(person_dir, exist_ok=True)
        filepath = os.path.join(person_dir, file.filename)
        file.save(filepath)

        user = db.get_user_by_name(name)
        if user:
            conn = db.get_conn()
            conn.execute("UPDATE users SET face_image = ? WHERE name = ?", (filepath, name))
            conn.commit()
            conn.close()
            return jsonify({
                "success": True,
                "message": f"User '{name}' updated with new face image."
            }), 200
        else:
            user_id = db.create_user(name, password=password, face_image=filepath)
            if not user_id:
                return jsonify({"success": False, "error": "User already exists."}), 400
            return jsonify({
                "success": True,
                "message": f"User '{name}' registered successfully!"
            }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# LOGIN (Name + Password) → Returns Token
# -----------------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.form or request.json or {}
        name = data.get('name')
        password = data.get('password')

        if not name or not password:
            return jsonify({"success": False, "error": "Name and password required"}), 400

        ok, user = db.verify_password(name, password)
        if not ok:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        token, expires = db.create_session(user["id"])
        return jsonify({
            "success": True,
            "token": token,
            "expires_at": expires
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# UPLOAD PHOTOS + AUTO FACE SORTING
# -----------------------------------------------------------
@app.route('/upload', methods=['POST'])
def upload_photos():
    try:
        files = request.files.getlist('photos')
        if not files:
            return jsonify({"success": False, "error": "No files provided"}), 400

        saved = []
        for f in files:
            filename = f.filename.strip().replace(" ", "_")
            if not filename:
                continue
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            base, ext = os.path.splitext(filename)
            idx = 1
            while os.path.exists(filepath):
                filepath = os.path.join(UPLOAD_FOLDER, f"{base}_{idx}{ext}")
                idx += 1
            f.save(filepath)
            saved.append(os.path.basename(filepath))

        tol = request.args.get('tol', default=0.5, type=float)
        results = recognize_and_sort_photos(tolerance=tol, copy_to_user_folder=True)

        for r in results:
            db.save_photo_metadata(r["file"], r.get("matches", []))

        return jsonify({
            "success": True,
            "saved": saved,
            "results": results
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# TOKEN VALIDATION HELPER
# -----------------------------------------------------------
def get_auth_user_id():
    auth = request.headers.get('Authorization')
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        uid = db.verify_token(token)
        return uid
    return None


# -----------------------------------------------------------
# GALLERY (Protected) — Requires Token or Photographer Key
# -----------------------------------------------------------
PHOTOGRAPHER_KEY = os.environ.get("PHOTOGRAPHER_KEY", "photographer-secret")

@app.route('/gallery/<username>', methods=['GET'])
def gallery(username):
    try:
        auth_key = request.headers.get('X-Photographer-Key')
        if auth_key == PHOTOGRAPHER_KEY:
            allowed = True
        else:
            user = db.get_user_by_name(username)
            if not user:
                return jsonify({"photos": []})
            uid = get_auth_user_id()
            allowed = (uid == user["id"])

        if not allowed:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        user_dir = os.path.join(UPLOAD_FOLDER, username)
        if not os.path.exists(user_dir):
            return jsonify({"success": True, "photos": []}), 200

        photos = [
            f"/uploads/{username}/{p}"
            for p in os.listdir(user_dir)
            if p.lower().endswith(('.jpg', '.jpeg', '.png'))
        ]
        return jsonify({"success": True, "photos": photos}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# PHOTOGRAPHER ADMIN DASHBOARD (List all users + galleries)
# -----------------------------------------------------------
@app.route('/admin/users', methods=['GET'])
def admin_list_users():
    try:
        auth_key = request.headers.get('X-Photographer-Key')
        if auth_key != PHOTOGRAPHER_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        users = []
        conn = db.get_conn()
        cur = conn.execute("SELECT id, name, face_image FROM users")
        rows = cur.fetchall()
        conn.close()

        seen = set()
        for r in rows:
            uid, name, face = r
            user_dir = os.path.join(UPLOAD_FOLDER, name)
            photos = []
            if os.path.exists(user_dir):
                photos = [
                    f"/uploads/{name}/{p}"
                    for p in os.listdir(user_dir)
                    if p.lower().endswith(('.jpg', '.jpeg', '.png'))
                ]
            users.append({
                "id": uid,
                "name": name,
                "face_image": face,
                "photos": photos
            })
            seen.add(name)

        # Include users present in uploads folder but not in DB
        for folder in os.listdir(UPLOAD_FOLDER):
            if folder not in seen:
                path = os.path.join(UPLOAD_FOLDER, folder)
                if os.path.isdir(path):
                    photos = [
                        f"/uploads/{folder}/{p}"
                        for p in os.listdir(path)
                        if p.lower().endswith(('.jpg', '.jpeg', '.png'))
                    ]
                    users.append({
                        "id": None,
                        "name": folder,
                        "face_image": None,
                        "photos": photos
                    })

        return jsonify({"success": True, "users": users}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# STATIC FILE SERVING (Uploaded Photos) + DOWNLOAD
# -----------------------------------------------------------
# DELETE USER ACCOUNT (Photographer Only)
# -----------------------------------------------------------
@app.route('/delete_user/<username>', methods=['DELETE'])
def delete_user(username):
    try:
        auth_key = request.headers.get('X-Photographer-Key')
        if auth_key != PHOTOGRAPHER_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        # Delete from database
        if not db.delete_user(username):
            return jsonify({"success": False, "error": "User not found"}), 404

        # Delete user folder and files
        user_dir = os.path.join(UPLOAD_FOLDER, username)
        if os.path.exists(user_dir):
            import shutil
            shutil.rmtree(user_dir)

        # Delete known faces folder
        known_dir = os.path.join(KNOWN_FOLDER, username)
        if os.path.exists(known_dir):
            shutil.rmtree(known_dir)

        return jsonify({"success": True, "message": f"User '{username}' and all associated data deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------


@app.route('/uploads/<user>/<filename>')
def serve_upload(user, filename):
    try:
        directory = os.path.join(UPLOAD_FOLDER, user)
        if not os.path.exists(directory):
            return jsonify({"success": False, "error": "Folder not found"}), 404

        download = request.args.get('download', 'false').lower() == 'true'
        if download:
            from flask import send_file
            filepath = os.path.join(directory, filename)
            if not os.path.exists(filepath):
                return jsonify({"success": False, "error": "File not found"}), 404
            return send_file(filepath, as_attachment=True, download_name=filename)
        else:
            return send_from_directory(directory, filename)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# DELETE PHOTO (Individual) — Requires Token or Photographer Key
# -----------------------------------------------------------


@app.route('/delete/<username>/<filename>', methods=['DELETE'])
def delete_photo(username, filename):
    try:
        auth_key = request.headers.get('X-Photographer-Key')
        if auth_key == PHOTOGRAPHER_KEY:
            allowed = True
        else:
            user = db.get_user_by_name(username)
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404
            uid = get_auth_user_id()
            allowed = (uid == user["id"])

        if not allowed:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        user_dir = os.path.join(UPLOAD_FOLDER, username)
        filepath = os.path.join(user_dir, filename)
        if not os.path.exists(filepath):
            return jsonify({"success": False, "error": "File not found"}), 404

        os.remove(filepath)
        db.delete_photo_metadata(filename)

        return jsonify({"success": True, "message": f"Photo '{filename}' deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# DELETE ALL PHOTOS (Photographer Only)
# -----------------------------------------------------------


@app.route('/delete/<username>/all', methods=['DELETE'])
def delete_all_photos(username):
    try:
        auth_key = request.headers.get('X-Photographer-Key')
        if auth_key != PHOTOGRAPHER_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        user_dir = os.path.join(UPLOAD_FOLDER, username)
        if not os.path.exists(user_dir):
            return jsonify({"success": False, "error": "User folder not found"}), 404

        deleted_files = []
        for f in os.listdir(user_dir):
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                filepath = os.path.join(user_dir, f)
                os.remove(filepath)
                db.delete_photo_metadata(f)
                deleted_files.append(f)

        return jsonify({"success": True, "message": f"Deleted {len(deleted_files)} photos", "deleted": deleted_files}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -----------------------------------------------------------
# MAIN ENTRY POINT
# -----------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True)
