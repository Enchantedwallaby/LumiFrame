import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PhotographerView() {
  const { username } = useParams();
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("Loading...");

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

  return (
    <div className="min-h-screen py-10 flex flex-col items-center">
      <div className="card w-full max-w-5xl p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          📁 {username}'s Gallery
        </h2>

        {message && <p className="text-soft text-center">{message}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((p, i) => (
            <img
              key={i}
              src={`http://127.0.0.1:5000${p}`}
              alt=""
              className="rounded-lg shadow-glow hover:scale-105 transition-transform object-cover w-full h-40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
