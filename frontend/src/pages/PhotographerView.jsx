import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiDelete } from "../services/api";

export default function PhotographerView() {
  const { username } = useParams();
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("Loading...");
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("photographer_key");
    if (!key) {
      setMessage("❌ No photographer key found. Please log in first.");
      return;
    }

    fetch(`http://127.0.0.1:5000/gallery/${username}`, {
      headers: { "X-Photographer-Key": key },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          setMessage("⚠️ " + (err.error || "Failed to fetch gallery."));
          return;
        }
        const data = await res.json();
        setPhotos(data.photos);
        setMessage("");
      })
      .catch(() => setMessage("🚫 Server error."));
  }, [username]);

  const handleDelete = async (photoUrl) => {
    const key = localStorage.getItem("photographer_key");
    const filename = photoUrl.split('/').pop();

    if (!confirm(`Delete photo "${filename}"?`)) return;

    try {
      const res = await apiDelete(`/delete/${username}/${filename}`, null, key);
      if (res.success) {
        setPhotos(photos.filter(p => p !== photoUrl));
        alert("Photo deleted successfully!");
      } else {
        alert("Failed to delete photo: " + res.error);
      }
    } catch {
      alert("Error deleting photo.");
    }
  };

  const handleDeleteAll = async () => {
    const key = localStorage.getItem("photographer_key");

    if (!confirm(`Delete ALL photos for ${username}? This action cannot be undone.`)) return;

    try {
      const res = await apiDelete(`/delete/${username}/all`, null, key);
      if (res.success) {
        setPhotos([]);
        alert(`Deleted ${res.deleted.length} photos successfully!`);
      } else {
        alert("Failed to delete photos: " + res.error);
      }
    } catch {
      alert("Error deleting photos.");
    }
  };

  const handleDownload = (photoUrl) => {
    const filename = photoUrl.split('/').pop();
    const downloadUrl = `http://127.0.0.1:5000${photoUrl}?download=true`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen py-10 flex flex-col items-center">
      <div className="card w-full max-w-5xl p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          📁 {username}'s Gallery
        </h2>

        {message && <p className="text-soft text-center">{message}</p>}

        {photos.length > 0 && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🗑️ Delete All Photos
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((p, i) => (
            <div key={i} className="relative group">
              <img
                src={`http://127.0.0.1:5000${p}`}
                alt=""
                className="rounded-lg shadow-glow hover:scale-105 transition-transform object-cover w-full h-48 cursor-pointer"
                onClick={() => setPreviewPhoto(p)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewPhoto(p); }}
                  className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                >
                  👁️ Preview
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(p); }}
                  className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600"
                >
                  📥 Download
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={`http://127.0.0.1:5000${previewPhoto}`}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
            >
              ✕
            </button>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <button
                onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                🔍 Fullscreen
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(previewPhoto); }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                📥 Download
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(previewPhoto); setPreviewPhoto(null); }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && previewPhoto && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50" onClick={() => setIsFullscreen(false)}>
          <img
            src={`http://127.0.0.1:5000${previewPhoto}`}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 text-xl"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
