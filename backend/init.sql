CREATE TABLE IF NOT EXISTS classifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename    TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    file_size   INTEGER,
    label       TEXT,
    confidence  FLOAT,
    model       TEXT,
    infer_ms    FLOAT,
    top5        JSONB DEFAULT '[]',
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_created ON classifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_label   ON classifications(label);
