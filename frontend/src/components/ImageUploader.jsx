import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6767";

export default function ImageUploader() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.elements.image.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_URL}/predict`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Prediction failed");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Image Classifier</h2>
      <form onSubmit={handleSubmit}>
        <input name="image" type="file" accept="image/*" onChange={handleFile} />
        <button type="submit" disabled={loading || !preview}>
          {loading ? "Classifying..." : "Classify"}
        </button>
      </form>

      {preview && <img src={preview} alt="preview" style={{ width: "100%", marginTop: 16 }} />}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16, padding: 16, background: "#f0f0f0", borderRadius: 8 }}>
          <p><strong>Label:</strong> {result.label}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
          <p><strong>Inference:</strong> {result.inference_time_ms.toFixed(1)} ms</p>
        </div>
      )}
    </div>
  );
}
