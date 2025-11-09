import React, { useState } from "react";

function Upload() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [photographerKey, setPhotographerKey] = useState(
    localStorage.getItem("photographerKey") || ""
  );

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setMessage("");
    setProgress(0);
    setResults([]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setMessage("⚠️ Please select photos to upload.");
      return;
    }

    setUploading(true);
    setMessage("⏳ Uploading...");
    setProgress(0);

    const formData = new FormData();
    for (let f of files) formData.append("photos", f);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://127.0.0.1:5000/upload");
      xhr.setRequestHeader("X-Photographer-Key", photographerKey || "photographer-secret");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setMessage(`✅ Uploaded ${response.saved.length} photos!`);
            setResults(response.results || []);
          } else setMessage("❌ Upload failed.");
        } else setMessage("🚫 Server error.");
      };

      xhr.send(formData);
    } catch {
      setMessage("⚠️ Network error during upload.");
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-10">
      <div className="card w-full max-w-3xl p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          📤 Upload Group Photos
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="password"
            value={photographerKey}
            onChange={(e) => {
              setPhotographerKey(e.target.value);
              localStorage.setItem("photographerKey", e.target.value);
            }}
            placeholder="Enter photographer key"
          />
          <input type="file" multiple onChange={handleFileChange} />

          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
              {files.map((file, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  className="rounded-lg shadow-glow object-cover w-full h-32"
                />
              ))}
            </div>
          )}

          {uploading && (
            <div className="w-full bg-[#1E1433] rounded-full h-3 mt-3">
              <div
                className="bg-gradient-button h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <button type="submit" className="btn-primary flex-1">
              {uploading ? `Uploading... (${progress}%)` : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setProgress(0);
                setMessage("");
              }}
              className="btn-secondary flex-1"
            >
              Reset
            </button>
          </div>
        </form>

        {message && <p className="text-center mt-4 text-soft">{message}</p>}
      </div>
    </div>
  );
}

export default Upload;
