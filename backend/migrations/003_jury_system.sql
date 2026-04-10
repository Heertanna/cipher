ALTER TABLE members
ADD COLUMN IF NOT EXISTS is_juror BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS jury_cases (
  id BIGSERIAL PRIMARY KEY,
  claim_id BIGINT REFERENCES claims(id),
  status VARCHAR(20) DEFAULT 'pending',
  selected_juror_ids INTEGER[],
  selected_juror_anonymous_ids TEXT[],
  final_decision VARCHAR(20),
  confidence_avg NUMERIC(4,3),
  votes_cast INTEGER DEFAULT 0,
  votes_required INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS jury_votes (
  id BIGSERIAL PRIMARY KEY,
  jury_case_id BIGINT REFERENCES jury_cases(id),
  juror_anonymous_id TEXT NOT NULL,
  vote VARCHAR(10) NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,
  reasoning TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (jury_case_id, juror_anonymous_id)
);

