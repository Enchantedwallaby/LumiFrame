import React, { useEffect, useState } from "react";
import { apiDelete } from "../services/api";

function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("⏳ Loading your photos...");
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      setMessage("❌ Please log in first.");
      return;
    }

    const fetchGallery = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/gallery/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success && data.photos?.length > 0) {
          setPhotos(data.photos);
          setMessage("");
        } else setMessage("📁 No photos found.");
      } catch {
        setMessage("🚫 Server error.");
      }
    };

    fetchGallery();
  }, []);

  const handleDelete = async (photoUrl) => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const filename = photoUrl.split('/').pop();

    if (!confirm(`Delete photo "${filename}"?`)) return;

    try {
      const res = await apiDelete(`/delete/${username}/${filename}`, token);
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
    <div className="min-h-screen flex flex-col items-center py-10">
      <div className="card w-full max-w-5xl p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          🖼️ Your Personal Gallery
        </h2>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((p, i) => (
              <div key={i} className="overflow-hidden rounded-lg shadow-glow relative group">
                <img
                  src={`http://127.0.0.1:5000${p}`}
                  alt={`photo-${i}`}
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={() => setPreviewPhoto(p)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
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
        ) : (
          <p className="text-center text-soft">{message}</p>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="btn-secondary"
          >
            Logout
          </button>
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

export default Gallery;
