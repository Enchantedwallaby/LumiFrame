import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !password) {
      setMessage("⚠️ Please fill in both fields.");
      return;
    }

    setLoading(true);
    setMessage("⏳ Logging in...");

    try {
      const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", name);
        setMessage("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/gallery"), 1200);
      } else {
        setMessage("❌ " + (data.error || "Login failed."));
      }
    } catch {
      setMessage("🚫 Could not connect to the server.");
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
        className="card w-full max-w-md p-8"
      >
        <h2 className="text-3xl font-semibold text-center mb-6">🔐 Welcome Back</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && <p className="text-center text-soft text-sm">{message}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-soft">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-accent hover:underline"
          >
            Register
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
