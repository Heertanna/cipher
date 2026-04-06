CREATE TABLE IF NOT EXISTS members (
  anonymous_id     VARCHAR(64) PRIMARY KEY,
  alias_hash       VARCHAR(64) NOT NULL,
  tier             VARCHAR(20) NOT NULL DEFAULT 'contributor',
  joined_at        TIMESTAMPTZ DEFAULT now(),
  waiting_ends_at  TIMESTAMPTZ,
  rp_score         INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS health_profiles (
  anonymous_id     VARCHAR(64) PRIMARY KEY REFERENCES members(anonymous_id),
  age_range_enc    TEXT,
  blood_type_enc   TEXT,
  gender_enc       TEXT,
  allergies_enc    TEXT,
  conditions_enc   TEXT,
  documents_ipfs   TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
