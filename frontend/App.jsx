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
    formData.append("height", userUploadResult.height);
    formData.append("weight", userUploadResult.weight);
    try {
      const res = await fetch(`${API_BASE}/virtual_tryon`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Try-on failed");
      const data = await res.json();
      if (data.error) {
        setError("Backend error: " + data.error);
        setLoading(false);
        return;
      }
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

  function handleUserUploadFile(file, height, weight) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("height", height);
    formData.append("weight", weight);
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/upload_user`, {
      method: "POST",
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error("User upload failed");
        return res.json();
      })
      .then(data => setUserUploadResult(data))
      .catch(err => setError("User upload failed. " + err.message))
      .finally(() => setLoading(false));
  }

  function handleGarmentUploadFile(file, measurements) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("measurements", measurements);
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/upload_garment`, {
      method: "POST",
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error("Garment upload failed");
        return res.json();
      })
      .then(data => setGarmentUploadResult(data))
      .catch(err => setError("Garment upload failed. " + err.message))
      .finally(() => setLoading(false));
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#14171f', // dark background for the whole page
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 600,
        width: '100%',
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
        background: "#181c24",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
        padding: 32,
        border: "1px solid #232a36"
      }}>
        <h1 style={{ textAlign: 'center', color: '#e3e8ef', fontWeight: 700, letterSpacing: 1, marginBottom: 32 }}>Virtual Try-On</h1>
        {error && <div style={{ color: "#ff6b6b", background: "#2d2323", border: "1px solid #ffbdbd", padding: 12, borderRadius: 6, marginBottom: 18, textAlign: 'center' }}>{error}</div>}
        <div style={{ marginBottom: 32, background: '#232a36', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #232a36' }}>
          <h2 style={{ color: '#e3e8ef', fontSize: 20, marginBottom: 12 }}>1. Upload Your Photo</h2>
          <label style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #1976d2 60%, #388e3c 100%)',
            color: '#fff',
            padding: '10px 28px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 14,
            fontSize: 16,
            boxShadow: '0 2px 8px #232a36',
            border: 'none',
            transition: 'background 0.2s',
          }}>
            Choose Photo
            <input type="file" accept="image/*" onChange={e => { setUserFile(e.target.files[0]); if(e.target.files[0]) handleUserUploadFile(e.target.files[0], height, weight); }} style={{ display: 'none' }} />
          </label>
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <label style={{ flex: 1, color: '#bfc7d5' }}>Height (cm): <input type="number" value={height} onChange={e => setHeight(e.target.value)} required style={{ width: 80, marginLeft: 6, borderRadius: 4, border: '1px solid #38404d', padding: 4, background: '#232a36', color: '#e3e8ef' }} /></label>
            <label style={{ flex: 1, color: '#bfc7d5' }}>Weight (kg): <input type="number" value={weight} onChange={e => setWeight(e.target.value)} required style={{ width: 80, marginLeft: 6, borderRadius: 4, border: '1px solid #38404d', padding: 4, background: '#232a36', color: '#e3e8ef' }} /></label>
          </div>
          {userUploadResult && <span style={{ color: '#4caf50', marginLeft: 14, fontWeight: 500 }}>Uploaded!</span>}
        </div>

        <div style={{ marginBottom: 32, background: '#232a36', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #232a36' }}>
          <h2 style={{ color: '#e3e8ef', fontSize: 20, marginBottom: 12 }}>2. Upload Garment</h2>
          <label style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #1976d2 60%, #388e3c 100%)',
            color: '#fff',
            padding: '10px 28px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 14,
            fontSize: 16,
            boxShadow: '0 2px 8px #232a36',
            border: 'none',
            transition: 'background 0.2s',
          }}>
            Choose Garment
            <input type="file" accept="image/*" onChange={e => { setGarmentFile(e.target.files[0]); if(e.target.files[0]) handleGarmentUploadFile(e.target.files[0], measurements); }} style={{ display: 'none' }} />
          </label>
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#bfc7d5' }}>Measurements: <input type="text" value={measurements} onChange={e => setMeasurements(e.target.value)} required placeholder="e.g. Chest 100cm, Length 70cm" style={{ borderRadius: 4, border: '1px solid #38404d', padding: 4, width: 220, marginLeft: 6, background: '#232a36', color: '#e3e8ef' }} /></label>
          </div>
          {garmentUploadResult && <span style={{ color: '#4caf50', marginLeft: 14, fontWeight: 500 }}>Uploaded!</span>}
        </div>

        <div style={{ marginBottom: 32, background: '#232a36', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #232a36' }}>
          <h2 style={{ color: '#e3e8ef', fontSize: 20, marginBottom: 12 }}>3. Try On</h2>
          <button onClick={handleTryon} disabled={loading || !userUploadResult || !garmentUploadResult} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Try On</button>
          {loading && <span style={{ marginLeft: 14, color: '#90caf9' }}>Processing...</span>}
          {error && <div style={{ color: "#ff6b6b", background: "#2d2323", border: "1px solid #ffbdbd", padding: 10, borderRadius: 6, marginTop: 14, textAlign: 'center' }}>{error}</div>}
          {tryonResult && tryonResult.tryon_result && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <img src={tryonResult.tryon_result} alt="Try-On Result" style={{ maxWidth: "100%", border: "2px solid #1976d2", borderRadius: 8, boxShadow: '0 2px 8px #232a36' }} />
            </div>
          )}
        </div>

        {tryonResult && (
          <div style={{ marginBottom: 20, background: '#232a36', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #232a36' }}>
            <h2 style={{ color: '#e3e8ef', fontSize: 20, marginBottom: 12 }}>4. Get Feedback</h2>
            <button onClick={handleFeedback} disabled={loading} style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Get Feedback</button>
            {feedback && <div style={{ marginTop: 14, background: '#1b2b1b', color: '#a5d6a7', padding: 14, borderRadius: 6, fontWeight: 500 }}>{feedback}</div>}
          </div>
        )}
      </div>
    </div>
  );
}