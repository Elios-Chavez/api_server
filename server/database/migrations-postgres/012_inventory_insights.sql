CREATE TABLE IF NOT EXISTS inventory_insight_runs (
  run_id VARCHAR(80) PRIMARY KEY,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  provider VARCHAR(20) NOT NULL DEFAULT 'local',
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS inventory_insights (
  id VARCHAR(180) PRIMARY KEY,
  run_id VARCHAR(80) NOT NULL REFERENCES inventory_insight_runs(run_id) ON DELETE CASCADE,
  kind VARCHAR(40) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  suggested_action TEXT,
  product_id VARCHAR(120),
  product_name VARCHAR(200),
  image_url TEXT,
  facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by VARCHAR(20) NOT NULL DEFAULT 'local',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_inventory_insights_run ON inventory_insights(run_id);

CREATE INDEX IF NOT EXISTS idx_inventory_insights_severity ON inventory_insights(severity);

CREATE INDEX IF NOT EXISTS idx_inventory_insights_kind ON inventory_insights(kind);
