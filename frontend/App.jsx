import React, { useState } from "react";

const API_BASE = "http://localhost:8000";

export default function App() {
  // User upload states
  const [userFile, setUserFile] = useState(null);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [userUploadResult, setUserUploadResult] = useState(null);

  // Garment upload states
  const [garmentFile, setGarmentFile] = useState(null);
  const [measurements, setMeasurements] = useState("");
  const [garmentUploadResult, setGarmentUploadResult] = useState(null);

  // Try-on result
  const [tryonResult, setTryonResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handlers
  const handleUserUpload = async (e) => {
    e.preventDefault();
    setError("");
    if (!userFile) return;
    const formData = new FormData();
    formData.append("file", userFile);
    formData.append("height", height);
    formData.append("weight", weight);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/upload_user`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("User upload failed");
      const data = await res.json();
      setUserUploadResult(data);
    } catch (err) {
      setError("User upload failed. " + err.message);
    }
    setLoading(false);
  };

  const handleGarmentUpload = async (e) => {
    e.preventDefault();
    setError("");
    if (!garmentFile) return;
    const formData = new FormData();
    formData.append("file", garmentFile);
    formData.append("measurements", measurements);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/upload_garment`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Garment upload failed");
      const data = await res.json();
      setGarmentUploadResult(data);
    } catch (err) {
      setError("Garment upload failed. " + err.message);
    }
    setLoading(false);
  };

  const handleTryon = async () => {
    setError("");
    if (!userUploadResult || !garmentUploadResult) return;
    setLoading(true);
    setTryonResult(null);
    setFeedback("");
    const formData = new FormData();
    formData.append("user_image_path", userUploadResult.user_image_path);
    formData.append("garment_image_path", garmentUploadResult.garment_image_path);
    formData.append("measurements", garmentUploadResult.measurements);
    try {
      const res = await fetch(`${API_BASE}/virtual_tryon`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Try-on failed");
      const data = await res.json();
      if (!data.tryon_result) throw new Error("No try-on result returned");
      setTryonResult(data);
    } catch (err) {
      setError("Try-on failed. " + err.message);
    }
    setLoading(false);
  };

  const handleFeedback = async () => {
    setError("");
    if (!tryonResult) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("tryon_result", tryonResult.tryon_result);
    formData.append("user_info", JSON.stringify(userUploadResult));
    formData.append("garment_info", JSON.stringify(garmentUploadResult));
    try {
      const res = await fetch(`${API_BASE}/llm_feedback`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Feedback failed");
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (err) {
      setError("Feedback failed. " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Virtual Try-On</h1>
      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleUserUpload} style={{ marginBottom: 20 }}>
        <h2>1. Upload Your Photo</h2>
        <input type="file" accept="image/*" onChange={e => setUserFile(e.target.files[0])} required />
        <div>
          <label>Height (cm): <input type="number" value={height} onChange={e => setHeight(e.target.value)} required /></label>
        </div>
        <div>
          <label>Weight (kg): <input type="number" value={weight} onChange={e => setWeight(e.target.value)} required /></label>
        </div>
        <button type="submit" disabled={loading}>Upload User</button>
        {userUploadResult && <span style={{ color: 'green', marginLeft: 10 }}>Uploaded!</span>}
      </form>

      <form onSubmit={handleGarmentUpload} style={{ marginBottom: 20 }}>
        <h2>2. Upload Garment</h2>
        <input type="file" accept="image/*" onChange={e => setGarmentFile(e.target.files[0])} required />
        <div>
          <label>Measurements: <input type="text" value={measurements} onChange={e => setMeasurements(e.target.value)} required placeholder="e.g. Chest 100cm, Length 70cm" /></label>
        </div>
        <button type="submit" disabled={loading}>Upload Garment</button>
        {garmentUploadResult && <span style={{ color: 'green', marginLeft: 10 }}>Uploaded!</span>}
      </form>

      <div style={{ marginBottom: 20 }}>
        <h2>3. Try On</h2>
        <button onClick={handleTryon} disabled={loading || !userUploadResult || !garmentUploadResult}>Try On</button>
        {loading && <span style={{ marginLeft: 10 }}>Processing...</span>}
        {tryonResult && tryonResult.tryon_result && (
          <div style={{ marginTop: 20 }}>
            <img src={tryonResult.tryon_result} alt="Try-On Result" style={{ maxWidth: "100%", border: "1px solid #ccc" }} />
          </div>
        )}
      </div>

      {tryonResult && (
        <div style={{ marginBottom: 20 }}>
          <h2>4. Get Feedback</h2>
          <button onClick={handleFeedback} disabled={loading}>Get Feedback</button>
          {feedback && <div style={{ marginTop: 10, background: '#f9f9f9', padding: 10, borderRadius: 4 }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}
