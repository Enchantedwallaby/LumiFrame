import React, { useState } from "react";

export default function PhotographerLogin() {
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    if (!key.trim()) {
      setMessage("⚠️ Please enter a valid key.");
      return;
    }
    localStorage.setItem("photographer_key", key);
    setMessage("✅ Photographer key saved successfully!");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          📷 Photographer Login
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="password"
            placeholder="Enter photographer key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button type="submit" className="btn-primary w-full">
            Save Key
          </button>
        </form>

        {message && <p className="text-center text-soft mt-3">{message}</p>}
      </div>
    </div>
  );
}
