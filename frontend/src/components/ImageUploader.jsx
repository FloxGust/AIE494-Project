import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6767";

const MODELS = [
  { id: "original", label: "Original (PyTorch)" },
  { id: "onnx", label: "ONNX" },
  { id: "quantized", label: "Quantized ONNX" },
];

export default function ImageUploader() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState("quantized");

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
      const res = await fetch(`${API_URL}/predict?model=${selectedModel}`, {
        method: "POST",
        body: form,
      });
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
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: 24,color:"#ffffff"}}>
      <h2>Image Classifier</h2>

      <div style={{ marginBottom: 16}}>
        <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>Select Model:</p>
        <div style={{ display: "flex", gap: 8 }}>
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModel(m.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "2px solid",
                borderColor: selectedModel === m.id ? "#2563eb" : "#d1d5db",
                background: selectedModel === m.id ? "#2563eb" : "#fff",
                color: selectedModel === m.id ? "#fff" : "#374151",
                cursor: "pointer",
                fontWeight: selectedModel === m.id ? "bold" : "normal",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <input name="image" type="file" accept="image/*" label="Upload Image" onChange={handleFile} />
        <button type="submit" disabled={loading || !preview} style={{ marginLeft: 8 }}>
          {loading ? "Classifying..." : "Classify"}
        </button>
      </form>

      {preview && <img src={preview} alt="preview" style={{ width: "100%", marginTop: 16 }} />}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
       <aside>
          <div style={{ marginTop: 16, padding: 16, background: "#202020", borderRadius: 8 }}>
            <p><strong>Label:</strong> {result.label}</p>
            <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
            <p><strong>Inference:</strong> {result.inference_time_ms.toFixed(1)} ms</p>
            <p><strong>Model:</strong> {result.model_used}</p>
            <p><strong>Model Size:</strong> {result.model_size_mb.toFixed(1)} MB</p>
          </div>
       </aside>
      )}
    </div>
  );
}
