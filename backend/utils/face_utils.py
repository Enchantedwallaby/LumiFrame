import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="face_recognition_models")

import face_recognition
import os
import numpy as np
import shutil

KNOWN_FACES_DIR = "known_faces"
UPLOADS_DIR = "uploads"

# -------------------------------
# Load known faces
# -------------------------------
def load_known_faces():
    known_faces = []
    known_names = []

    print("🔍 Loading known faces...")
    for name in os.listdir(KNOWN_FACES_DIR):
        person_dir = os.path.join(KNOWN_FACES_DIR, name)
        if not os.path.isdir(person_dir):
            continue

        for filename in os.listdir(person_dir):
            image_path = os.path.join(person_dir, filename)
            print(f"   ➕ Loading {image_path}")
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)

            if len(encodings) > 0:
                known_faces.append(encodings[0])
                known_names.append(name)
            else:
                print(f"⚠️ No faces found in {image_path}")

    return known_faces, known_names


# -------------------------------
# Recognize and Sort Uploaded Photos
# -------------------------------
def recognize_and_sort_photos(tolerance=0.5, copy_to_user_folder=True):
    known_faces, known_names = load_known_faces()
    results_list = []

    print("\n📸 Checking uploaded photos...\n")

    for filename in os.listdir(UPLOADS_DIR):
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
            continue

        image_path = os.path.join(UPLOADS_DIR, filename)
        print(f"➡️ Processing {filename}...")

        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)

        if len(encodings) == 0:
            print(f"⚠️ No faces detected in {filename}")
            results_list.append({"file": filename, "faces_found": 0, "matches": []})
            continue

        found_names = []
        for encoding in encodings:
            matches = face_recognition.compare_faces(known_faces, encoding, tolerance=tolerance)
            face_distances = face_recognition.face_distance(known_faces, encoding)

            if True in matches:
                best_match_index = np.argmin(face_distances)
                name = known_names[best_match_index]
                found_names.append(name)
                print(f"✅ Match found: {name}")

                if copy_to_user_folder:
                    target_folder = os.path.join(UPLOADS_DIR, name)
                    os.makedirs(target_folder, exist_ok=True)
                    target_path = os.path.join(target_folder, filename)
                    if not os.path.exists(target_path):
                        shutil.copy(image_path, target_path)
                        print(f"📂 Copied {filename} to {target_folder}")
            else:
                print(f"❌ No match found for a face in {filename}")

        # Move unknown or unmatched photos to 'unknown' folder
        if not found_names:
            unknown_folder = os.path.join(UPLOADS_DIR, "unknown")
            os.makedirs(unknown_folder, exist_ok=True)
            shutil.copy(image_path, os.path.join(unknown_folder, filename))
            print(f"📦 Moved {filename} to unknown folder")

        results_list.append({
            "file": filename,
            "faces_found": len(encodings),
            "matches": found_names
        })
        print()

        # Remove the original file after processing to avoid clutter
        os.remove(image_path)

    # Clean up empty unknown folder
    unknown_folder = os.path.join(UPLOADS_DIR, "unknown")
    if os.path.exists(unknown_folder) and not os.listdir(unknown_folder):
        os.rmdir(unknown_folder)
        print("🗑️ Removed empty unknown folder")

    return results_list


# -------------------------------
# Run directly (debugging)
# -------------------------------
if __name__ == "__main__":
    results = recognize_and_sort_photos(tolerance=0.5, copy_to_user_folder=True)
    print("\n🧾 Summary:")
    for r in results:
        print(r)
