import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!photo) return setPreviewUrl(null);
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !photo) {
      setMessage("⚠️ Name and photo are required.");
      return;
    }

    setLoading(true);
    setMessage("⏳ Registering...");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("password", password);
      formData.append("photo", photo);

      const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("✅ Registration successful!");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setMessage("❌ " + (data.error || "Registration failed."));
      }
    } catch {
      setMessage("🚫 Could not reach backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center min-h-screen"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card max-w-md w-full p-8"
      >
        <h2 className="text-2xl font-semibold text-center mb-5">📸 User Registration</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="password" placeholder="Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="text-light" />

          {previewUrl && <motion.img src={previewUrl} alt="preview" className="w-24 h-24 rounded-lg mx-auto mt-3 border border-accent shadow-glow" />}

          {message && <p className="text-center text-soft">{message}</p>}

          <button type="submit" disabled={loading} className={`btn-primary w-full ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-soft">
          Already registered?{" "}
          <button onClick={() => navigate("/login")} className="text-accent hover:underline">
            Login
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
