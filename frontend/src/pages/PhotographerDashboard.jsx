import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiDeleteUser } from "../services/api";

export default function PhotographerDashboard() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("Loading users...");
  const navigate = useNavigate();

  const handleDeleteUser = async (username) => {
    if (!confirm(`Delete user "${username}" and all associated data? This action cannot be undone.`)) return;

    const key = localStorage.getItem("photographer_key");
    try {
      const res = await apiDeleteUser(username, key);
      if (res.success) {
        setUsers(users.filter(u => u.name !== username));
        alert("User deleted successfully!");
      } else {
        alert("Failed to delete user: " + res.error);
      }
    } catch {
      alert("Error deleting user.");
    }
  };

  useEffect(() => {
    const key = localStorage.getItem("photographer_key");
    if (!key) {
      setMessage("❌ No photographer key found. Please log in first.");
      return;
    }

    fetch("http://127.0.0.1:5000/admin/users", {
      headers: { "X-Photographer-Key": key },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          setMessage("⚠️ " + (err.error || "Failed to fetch users."));
          return;
        }
        const data = await res.json();
        setUsers(data.users);
        setMessage("");
      })
      .catch(() => setMessage("🚫 Server error."));
  }, []);

  return (
    <div className="min-h-screen py-10 flex flex-col items-center">
      <div className="card w-full max-w-5xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">📸 Photographer Dashboard</h2>
          <button
            onClick={() => {
              localStorage.removeItem("photographer_key");
              window.location.href = "/photographer";
            }}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>

        {message && <p className="text-soft text-center">{message}</p>}

        <div className="grid gap-6 mt-6">
          {users.map((user) => (
            <div
              key={user.name}
              className="border border-[#5A3FFF]/30 rounded-xl p-6 bg-[#1E1433]/50 backdrop-blur-md shadow-glow"
            >
              <h3 className="text-xl font-semibold text-accent mb-3">{user.name}</h3>
              {user.photos.length === 0 ? (
                <p className="text-soft">No photos found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                  {user.photos.slice(0, 4).map((p, i) => (
                    <img
                      key={i}
                      src={`http://127.0.0.1:5000${p}`}
                      alt=""
                      className="rounded-lg w-full h-28 object-cover hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate(`/photographer/view/${user.name}`)}
                  className="btn-outline"
                >
                  View Full Gallery →
                </button>
                <button
                  onClick={() => handleDeleteUser(user.name)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  🗑️ Delete User
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
