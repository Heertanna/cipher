import crypto from "node:crypto";
import pool from "../db.js";

const FAKE_JURORS = [
  { alias: "DrSingh", tier: "sustainer", reputation_points: 120 },
  { alias: "DrPatel", tier: "sustainer", reputation_points: 95 },
  { alias: "DrMehta", tier: "sustainer", reputation_points: 110 },
  { alias: "DrKhan", tier: "supporter", reputation_points: 80 },
  { alias: "DrRao", tier: "sustainer", reputation_points: 140 },
  { alias: "DrGupta", tier: "supporter", reputation_points: 75 },
  { alias: "DrIyer", tier: "sustainer", reputation_points: 130 },
  { alias: "DrNair", tier: "supporter", reputation_points: 88 },
  { alias: "DrJoshi", tier: "sustainer", reputation_points: 102 },
  { alias: "DrVerma", tier: "supporter", reputation_points: 91 },
  { alias: "DrReddy", tier: "sustainer", reputation_points: 115 },
  { alias: "DrShah", tier: "supporter", reputation_points: 78 },
];

async function ensureJurorColumns() {
  await pool.query(`
    ALTER TABLE members
    ADD COLUMN IF NOT EXISTS is_juror BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0
  `);
}

export async function seedJurorsIfEmpty() {
  await ensureJurorColumns();

  const existing = await pool.query(
    `SELECT COUNT(*)::int AS count FROM members WHERE is_juror = true`,
  );
  const count = Number(existing.rows[0]?.count ?? 0);
  if (count > 0) {
    return { seeded: false, count };
  }

  for (const juror of FAKE_JURORS) {
    const anonymousId = crypto.randomBytes(32).toString("hex");
    const aliasHash = crypto.randomBytes(32).toString("hex");
    await pool.query(
      `INSERT INTO members
        (anonymous_id, alias_hash, tier, is_juror, reputation_points, rp_score)
       VALUES ($1, $2, $3, true, $4, $4)
       ON CONFLICT (anonymous_id) DO NOTHING`,
      [anonymousId, aliasHash, juror.tier, juror.reputation_points],
    );
  }

  return { seeded: true, count: FAKE_JURORS.length };
}

