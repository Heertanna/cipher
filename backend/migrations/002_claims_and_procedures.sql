CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS approved_procedures (
  id SERIAL PRIMARY KEY,
  procedure_name TEXT NOT NULL,
  max_cost_inr INTEGER,
  is_experimental BOOLEAN DEFAULT false,
  is_rare BOOLEAN DEFAULT false,
  governance_flagged BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS claims (
  id BIGSERIAL PRIMARY KEY,
  what_happened TEXT NOT NULL,
  cost_inr INTEGER NOT NULL,
  routing_path VARCHAR(10) NOT NULL,
  routing_reason TEXT NOT NULL,
  matched_procedure_id INTEGER REFERENCES approved_procedures(id),
  similarity_score NUMERIC(6,4),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

