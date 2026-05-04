import { useState, useRef } from "react";

const MODEL_INFO = {
  original:  { name: "PyTorch",        size: "~97 MB" },
  onnx:      { name: "ONNX",           size: "~97 MB" },
  quantized: { name: "Quantized ONNX", size: "~24 MB" },
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6767";

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const SpinnerIcon = () => (
  <div style={{
    width: 20, height: 20,
    border: "2px solid rgba(255,255,255,0.1)",
    borderTop: "2px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  }} />
);

export default function ImageClassifier({ onNavigate }) {
  const [model, setModel] = useState("quantized");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const [error, setError] = useState(null);

  const classify = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_URL}/predict?model=${model}`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Prediction failed");
      }
      const data = await res.json();
      setResult({
        id: data.id,
        label: data.label,
        conf: data.confidence * 100,
        infer: data.inference_time_ms.toFixed(1),
        model: data.model_used,
        modelSize: data.model_size_mb.toFixed(1) + " MB",
        file: data.file_name,
        fileSize: (data.file_size_bytes / 1024).toFixed(1) + " KB",
        top5: data.top5,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confColor = (c) => c >= 80 ? "var(--conf-high-text)" : c >= 50 ? "var(--conf-mid-text)" : "var(--conf-low-text)";

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .card-anim { animation: fadeIn 0.3s ease forwards; }
        .tab-btn { padding: 7px 18px; font-size: 13px; border-radius: 99px; border: 1px solid var(--border-md); background: transparent; color: var(--text-secondary); transition: all .15s; }
        .tab-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .tab-btn.active { background: var(--accent); color: var(--accent-text); border-color: var(--accent); font-weight: 500; }
        .drop-zone { border: 1px dashed var(--border-md); border-radius: var(--radius-lg); overflow: hidden; transition: border-color .2s; cursor: pointer; }
        .drop-zone:hover { border-color: var(--border-strong); }
        .classify-btn { padding: 10px 24px; background: var(--accent); color: var(--accent-text); border: none; border-radius: 99px; font-size: 14px; font-weight: 500; transition: opacity .15s; }
        .classify-btn:hover { opacity: 0.85; }
        .classify-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .nav-link { background: none; border: 1px solid var(--border-md); color: var(--text-secondary); padding: 6px 14px; border-radius: 99px; font-size: 12px; transition: all .15s; }
        .nav-link:hover { background: var(--bg-hover); color: var(--text-primary); }
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.5px", color: "var(--text-primary)" }}>
              Image Classifier
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>
              Upload an image · select a model · get predictions
            </p>
          </div>
          <button className="nav-link" onClick={() => onNavigate("results")}>
            View results →
          </button>
        </div>

        {/* Model selector */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Model
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(MODEL_INFO).map(([key, info]) => (
              <button
                key={key}
                className={`tab-btn ${model === key ? "active" : ""}`}
                onClick={() => setModel(key)}
              >
                {info.name}
              </button>
            ))}
          </div>
        </div>

        {/* Model info strip */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          {[
            ["Size", MODEL_INFO[model].size],
            ["Format", model === "original" ? "PyTorch .safetensors" : model === "onnx" ? "ONNX .onnx" : "ONNX Int8"],
            ["Device", "CPU"],
          ].map(([k, v]) => (
            <div key={k} style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "8px 14px",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Upload */}
          <div>
            <div
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current.click()}
            >
              <div style={{
                height: 260, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
                position: "relative", overflow: "hidden",
                background: preview ? "transparent" : "var(--bg-surface)",
              }}>
                {preview ? (
                  <>
                    <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", gap: 8, opacity: 0, transition: "opacity .2s",
                    }}
                      className="drop-hover-overlay"
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <UploadIcon />
                      <span style={{ fontSize: 13, color: "#fff" }}>Change image</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "var(--text-tertiary)" }}><ImageIcon /></div>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Drop image or click to upload</span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>JPG · PNG · WEBP · max 5 MB</span>
                  </>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 12 }}>
                {file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : "No file selected"}
              </span>
              <button className="classify-btn" onClick={classify} disabled={!file || loading}>
                {loading ? <SpinnerIcon /> : "Classify"}
              </button>
            </div>
          </div>

          {/* Result */}
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "1.25rem",
            display: "flex", flexDirection: "column", minHeight: 300,
          }}>
            {loading && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <SpinnerIcon />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Classifying…</span>
              </div>
            )}

            {!loading && !result && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.35 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Results appear here</span>
              </div>
            )}

            {!loading && error && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, color: "var(--conf-low-text)" }}>{error}</span>
              </div>
            )}

            {!loading && result && (
              <div className="card-anim" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Predicted label</div>
                  <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.3px", color: "var(--text-primary)" }}>
                    {result.label}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                    <span>Confidence</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: confColor(result.conf) }}>{result.conf.toFixed(2)}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--bg-raised)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${result.conf}%`, background: confColor(result.conf), borderRadius: 99, transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["Inference", result.infer + " ms"],
                    ["Model", result.model],
                    ["Model size", result.modelSize],
                    ["File size", result.fileSize],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-md)", padding: "8px 12px" }}>
                      <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>Top 5 predictions</div>
                  {result.top5.map(([name, pct], i) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: i === 0 ? 500 : 400, minWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                      <div style={{ flex: 1, height: 3, background: "var(--bg-raised)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "var(--accent)" : "var(--text-tertiary)", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", minWidth: 38, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 500, padding: "2px 10px", borderRadius: 99 }}>
                    ✓ Saved
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {result.id}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
