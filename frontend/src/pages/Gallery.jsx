import React, { useEffect, useState } from "react";

function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("⏳ Loading your photos...");

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

  return (
    <div className="min-h-screen flex flex-col items-center py-10">
      <div className="card w-full max-w-5xl p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          🖼️ Your Personal Gallery
        </h2>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((p, i) => (
              <div key={i} className="overflow-hidden rounded-lg shadow-glow">
                <img
                  src={`http://127.0.0.1:5000${p}`}
                  alt={`photo-${i}`}
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                />
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
    </div>
  );
}

export default Gallery;
