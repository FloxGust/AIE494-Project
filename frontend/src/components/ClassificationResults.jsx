import { useState, useMemo, useEffect } from "react";
import { CATEGORY_COLORS } from "../data/mockResults";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6767";

const ImagePlaceholder = ({ category }) => {
  const bg = CATEGORY_COLORS[category] || "#D3D1C7";
  return (
    <div style={{ width: "100%", height: "100%", background: bg + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
};

const ConfBadge = ({ conf }) => {
  const high = conf >= 80, mid = conf >= 50;
  const [bg, color] = high
    ? ["var(--conf-high-bg)", "var(--conf-high-text)"]
    : mid
    ? ["var(--conf-mid-bg)", "var(--conf-mid-text)"]
    : ["var(--conf-low-bg)", "var(--conf-low-text)"];
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 500, fontFamily: "var(--font-mono)", padding: "2px 7px", borderRadius: 99 }}>
      {conf.toFixed(1)}%
    </span>
  );
};

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function ClassificationResults({ onNavigate }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("time");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/classifications?limit=100`)
      .then((r) => r.json())
      .then((data) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let data = [...results];
    if (filter === "high") data = data.filter((r) => r.conf >= 80);
    else if (filter === "mid") data = data.filter((r) => r.conf >= 50 && r.conf < 80);
    else if (filter === "low") data = data.filter((r) => r.conf < 50);

    if (sort === "conf-desc") data.sort((a, b) => b.conf - a.conf);
    else if (sort === "conf-asc") data.sort((a, b) => a.conf - b.conf);
    else if (sort === "name") data.sort((a, b) => a.label.localeCompare(b.label));

    return data;
  }, [results, filter, sort]);

  const selected = results.find((r) => r.id === selectedId);
  const avgConf = results.length ? (results.reduce((s, r) => s + r.conf, 0) / results.length).toFixed(1) : "0.0";
  const avgInfer = results.length ? (results.reduce((s, r) => s + r.infer, 0) / results.length).toFixed(1) : "0.0";

  const toggleSelect = (id) => setSelectedId((prev) => (prev === id ? null : id));

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .card-anim { animation: fadeIn 0.25s ease forwards; }
        .result-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; transition: border-color .15s, transform .12s; }
        .result-card:hover { border-color: var(--border-strong); transform: translateY(-1px); }
        .result-card.selected { border: 2px solid var(--accent); }
        .filter-btn { padding: 5px 14px; font-size: 12px; border-radius: 99px; border: 1px solid var(--border-md); background: transparent; color: var(--text-secondary); transition: all .12s; }
        .filter-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .filter-btn.active { background: var(--accent); color: var(--accent-text); border-color: var(--accent); font-weight: 500; }
        .nav-link { background: none; border: 1px solid var(--border-md); color: var(--text-secondary); padding: 6px 14px; border-radius: 99px; font-size: 12px; transition: all .15s; }
        .nav-link:hover { background: var(--bg-hover); color: var(--text-primary); }
        .sort-select { font-size: 12px; padding: 5px 10px; border: 1px solid var(--border-md); border-radius: var(--radius-sm); background: var(--bg-surface); color: var(--text-secondary); font-family: var(--font-sans); cursor: pointer; outline: none; }
        .close-btn { background: none; border: 1px solid var(--border-md); color: var(--text-tertiary); padding: 4px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; transition: all .12s; }
        .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
      `}</style>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Container */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.5px", color: "var(--text-primary)" }}>
                Classification results
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>
                Batch run · Quantized ONNX · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <button className="nav-link" onClick={() => onNavigate("classifier")}>
              ← New classification
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[
              ["Images", results.length],
              ["Avg confidence", avgConf + "%"],
              ["Avg inference", avgInfer + " ms"],
              ["High conf ≥80%", results.filter((r) => r.conf >= 80).length],
              ["Low conf <50%", results.filter((r) => r.conf < 50).length],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
            {[
              ["all", "All"],
              ["high", "High ≥80%"],
              ["mid", "Mid 50–79%"],
              ["low", "Low <50%"],
            ].map(([key, label]) => (
              <button key={key} className={`filter-btn ${filter === key ? "active" : ""}`} onClick={() => { setFilter(key); setSelectedId(null); }}>
                {label}
              </button>
            ))}
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ marginLeft: "auto" }}>
              <option value="time">Newest first</option>
              <option value="conf-desc">Confidence ↓</option>
              <option value="conf-asc">Confidence ↑</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 12 }}>
            {loading && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 0", color: "var(--text-tertiary)", fontSize: 13 }}>
                Loading…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 0", color: "var(--text-tertiary)", fontSize: 13 }}>
                No results found.
              </div>
            )}
            {filtered.map((r, i) => (
              <div
                key={r.id}
                className={`result-card card-anim ${selectedId === r.id ? "selected" : ""}`}
                style={{ animationDelay: `${i * 0.03}s`, opacity: 0, animationFillMode: "forwards" }}
                onClick={() => toggleSelect(r.id)}
              >
                <div style={{ height: 130, position: "relative", overflow: "hidden" }}>
                  <ImagePlaceholder category={r.category} />
                  <div style={{ position: "absolute", top: 8, right: 8 }}>
                    <ConfBadge conf={r.conf} />
                  </div>
                  <div style={{
                    position: "absolute", bottom: 8, left: 8,
                    background: "rgba(0,0,0,0.55)", borderRadius: 4, padding: "2px 6px",
                    fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)",
                  }}>
                    {r.infer} ms
                  </div>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.file}</div>
                  <div style={{ height: 3, background: "var(--bg-raised)", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                    <div style={{ height: "100%", width: `${r.conf}%`, background: r.conf >= 80 ? "var(--conf-high-text)" : r.conf >= 50 ? "var(--conf-mid-text)" : "var(--conf-low-text)", borderRadius: 99 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <aside className="card-anim" style={{ width: 400, flexShrink: 0, position: "sticky", top: "2rem", background: "var(--bg-surface)", border: "1px solid var(--border-md)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ height: 250, background: (CATEGORY_COLORS[selected.category] || "#D3D1C7") + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImagePlaceholder category={selected.category} />
            </div>
            <div style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.file} · {selected.size}</div>
                </div>
                <button className="close-btn" style={{ marginLeft: 8, flexShrink: 0 }} onClick={() => setSelectedId(null)}><CloseIcon /></button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: "1rem" }}>
                {[
                  ["Confidence", selected.conf.toFixed(2) + "%"],
                  ["Inference", selected.infer + " ms"],
                  ["Model", selected.model],
                  ["Model size", selected.modelSize],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-md)", padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>Top 5 predictions</div>
              {selected.top5.map(([name, pct], i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: i === 0 ? 500 : 400, minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  <div style={{ width: 60, height: 3, background: "var(--bg-raised)", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "var(--accent)" : "var(--text-tertiary)", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", minWidth: 38, textAlign: "right", flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
