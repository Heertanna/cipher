import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import multer from "multer";
import {
  routeClaim,
  validateClaimPayloadForRouting,
} from "./lib/routeClaim.js";
import pool from "./db.js";
import { encrypt, encryptBuffer } from "./lib/encryption.js";
import { uploadToIPFS } from "./lib/ipfsUpload.js";
import { seedApprovedProceduresIfEmpty } from "./lib/seedApprovedProcedures.js";
import { seedJurorsIfEmpty } from "./lib/seedJurors.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const allowDevUnassignedJurorVotes =
  process.env.ALLOW_UNASSIGNED_JUROR_VOTES !== "false";

const upload = multer({ storage: multer.memoryStorage() });

const defaultCorsOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://heertanna.github.io",
];
const extraCorsOrigins =
  typeof process.env.CORS_ORIGINS === "string"
    ? process.env.CORS_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
const corsOrigins = [...new Set([...defaultCorsOrigins, ...extraCorsOrigins])];

const localhostOriginRe = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function corsAllowed(origin) {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;
  // Vite picks any free port (e.g. 5176); allow all local dev origins.
  if (localhostOriginRe.test(origin)) return true;
  return false;
}

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, corsAllowed(origin));
    },
  }),
);

function waitingEndsAtForTier(tier) {
  const days =
    tier === "contributor" ? 90 : tier === "supporter" ? 60 : tier === "sustainer" ? 30 : 90;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function normalizeRoutingPayload(body) {
  const what_happened =
    body?.what_happened ??
    body?.whatHappened ??
    body?.procedure_name ??
    body?.procedureName ??
    body?.icd10_code ??
    body?.icd10Code ??
    "";
  const costRaw =
    body?.cost_inr ?? body?.costInr ?? body?.claim_cost ?? body?.claimCost ?? body?.estimatedCost;
  const cost_inr = Number(costRaw);
  return {
    what_happened: String(what_happened ?? "").trim(),
    cost_inr,
  };
}

/** RP rewards participation quality only (not vote outcome or claim cost). Max 21 / case. */
function calculateJurorRP({ reasoning, confidence }) {
  const r = String(reasoning ?? "").trim();
  let rp = 0;
  rp += 10;
  if (r.length > 80) rp += 5;
  if (r.split("|").length >= 3) rp += 3;
  if (Number(confidence) >= 0.7) rp += 3;
  return Math.min(21, rp);
}

function calculatePatientRP(body) {
  const b = body ?? {};
  const rec = String(b.recommendedTreatment ?? b.recommended_treatment ?? "").trim();
  const cost = String(b.costDetails ?? b.cost_details ?? "").trim();
  const impact = String(b.impactIfUntreated ?? b.impact_if_untreated ?? "").trim();
  const reportsMeta = b.reportsMeta ?? b.reports_meta;
  const hasReports = Array.isArray(reportsMeta) && reportsMeta.length > 0;
  let rp = 0;
  rp += 5;
  if (rec) rp += 3;
  if (cost) rp += 2;
  if (impact) rp += 2;
  if (hasReports) rp += 5;
  return Math.min(17, rp);
}

const SIMULATED_JUROR_REASONING = "Protocol evaluation completed.";

function rpMetaForPoints(rpRaw) {
  const rp = Math.max(0, Number(rpRaw) || 0);
  let rp_level;
  let bandMin;
  let bandMax;
  let nextThreshold;
  if (rp < 50) {
    rp_level = "newcomer";
    bandMin = 0;
    bandMax = 49;
    nextThreshold = 50;
  } else if (rp < 150) {
    rp_level = "contributor";
    bandMin = 50;
    bandMax = 149;
    nextThreshold = 150;
  } else if (rp < 300) {
    rp_level = "trusted";
    bandMin = 150;
    bandMax = 299;
    nextThreshold = 300;
  } else {
    rp_level = "expert";
    bandMin = 300;
    bandMax = null;
    nextThreshold = null;
  }

  let rp_progress_pct;
  if (rp_level === "expert") {
    rp_progress_pct = 100;
  } else {
    const span = nextThreshold - bandMin;
    rp_progress_pct = span > 0 ? Math.min(100, Math.round(((rp - bandMin) / span) * 100)) : 0;
  }

  const rp_next_level_points = nextThreshold != null ? Math.max(0, nextThreshold - rp) : 0;

  const benefits = ["Protocol participation"];
  if (rp >= 50) benefits.push("Healthcare benefits (free checkups)");
  if (rp >= 150) {
    benefits.push("Governance participation (propose protocol changes, vote on rules)");
  }
  if (rp >= 300) {
    benefits.push("Professional credibility + faster care processing (fewer document checks)");
  }

  return {
    rp_level,
    rp_next_level_points,
    rp_progress_pct,
    benefits,
  };
}

async function ensureClaimsTable() {
  await pool.query(`
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
    )
  `);
}

async function ensureJuryTables() {
  await pool.query(`
    ALTER TABLE members
    ADD COLUMN IF NOT EXISTS is_juror BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rp_score INTEGER DEFAULT 0
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS jury_votes (
      id BIGSERIAL PRIMARY KEY,
      jury_case_id BIGINT REFERENCES jury_cases(id),
      juror_anonymous_id TEXT NOT NULL,
      vote VARCHAR(10) NOT NULL,
      confidence NUMERIC(3,2) NOT NULL,
      reasoning TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (jury_case_id, juror_anonymous_id)
    )
  `);

  // Allow multiple jury rounds per claim (no one-active-case limit at DB level).
  await pool.query(`ALTER TABLE jury_cases DROP CONSTRAINT IF EXISTS jury_cases_claim_id_key`);
}

async function ensureJurorApplicationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS juror_applications (
      id SERIAL PRIMARY KEY,
      anonymous_id TEXT NOT NULL,
      credential_name TEXT NOT NULL,
      institution TEXT,
      year INTEGER,
      registration_number TEXT,
      trial_answers JSONB,
      status VARCHAR(20) DEFAULT 'approved',
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

async function assignJury(claimId) {
  const jurorsResult = await pool.query(
    `SELECT anonymous_id, alias_hash
       FROM members
      WHERE is_juror = true
      ORDER BY RANDOM()
      LIMIT 8`,
  );
  const assignedJurors = jurorsResult.rows;
  if (assignedJurors.length < 8) {
    throw new Error("Not enough jurors available to assign");
  }

  const jurorAnonymousIds = assignedJurors.map((j) => j.anonymous_id);
  const jurorOrdinalIds = assignedJurors.map((_, idx) => idx + 1);

  const caseResult = await pool.query(
    `INSERT INTO jury_cases
      (claim_id, status, selected_juror_ids, selected_juror_anonymous_ids, votes_required)
     VALUES ($1, 'voting', $2::int[], $3::text[], 8)
     RETURNING id`,
    [claimId, jurorOrdinalIds, jurorAnonymousIds],
  );

  return {
    jury_case_id: Number(caseResult.rows[0].id),
    assigned_jurors: assignedJurors,
  };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/procedures", async (_req, res) => {
  try {
    console.log("[GET /procedures] Returning approved procedures");
    const result = await pool.query(
      `SELECT id, procedure_name, max_cost_inr, is_experimental, is_rare, governance_flagged
       FROM approved_procedures
       ORDER BY id ASC`,
    );
    res.json({
      count: result.rowCount,
      procedures: result.rows,
    });
  } catch (error) {
    console.error("[GET /procedures] failed:", error?.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/claims/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid claim id" });
    }

    const result = await pool.query(
      `SELECT c.*,
              jc.id AS jury_case_id,
              jc.status AS jury_status,
              jc.final_decision,
              jc.confidence_avg,
              jc.votes_cast,
              ap.id AS matched_procedure_id_resolved,
              ap.procedure_name AS matched_procedure_name,
              ap.max_cost_inr AS matched_procedure_max_cost
         FROM claims c
         LEFT JOIN jury_cases jc ON jc.claim_id = c.id
         LEFT JOIN approved_procedures ap ON ap.id = c.matched_procedure_id
        WHERE c.id = $1
        ORDER BY jc.created_at DESC NULLS LAST
        LIMIT 1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Claim not found" });
    }

    const row = result.rows[0];
    return res.json({
      ...row,
      matched_procedure:
        row.matched_procedure_id_resolved != null
          ? {
              id: row.matched_procedure_id_resolved,
              procedure_name: row.matched_procedure_name,
              max_cost_inr: row.matched_procedure_max_cost,
            }
          : null,
    });
  } catch (error) {
    console.error("[GET /claims/:id] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/claims/route", async (req, res) => {
  try {
    const claim = normalizeRoutingPayload(req.body ?? {});
    const validationError = validateClaimPayloadForRouting(claim);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const decision = await routeClaim(claim);
    return res.json(decision);
  } catch (error) {
    console.error("[POST /claims/route] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/submit-claim", async (req, res) => {
  console.log("[POST /submit-claim] Incoming payload:", req.body);
  try {
    const claim = normalizeRoutingPayload(req.body ?? {});
    const validationError = validateClaimPayloadForRouting(claim);
    if (validationError) {
      console.warn("[POST /submit-claim] Validation failed:", validationError);
      return res.status(400).json({
        error: validationError,
      });
    }

    const decision = await routeClaim(claim);

    const insertResult = await pool.query(
      `INSERT INTO claims
        (what_happened, cost_inr, routing_path, routing_reason, matched_procedure_id, similarity_score, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id`,
      [
        claim.what_happened,
        claim.cost_inr,
        decision.path,
        decision.reason,
        decision.matchedProcedure?.id ?? null,
        decision.similarityScore ?? null,
        JSON.stringify(req.body ?? {}),
      ],
    );
    const claimId = insertResult.rows[0].id;

    let juryAssignment = null;
    if (decision.path === "PATH_B") {
      juryAssignment = await assignJury(claimId);
    }

    const patientId = String(req.body?.anonymous_id ?? req.body?.anonymousId ?? "").trim();
    let rpAwardedPatient = 0;
    if (patientId) {
      rpAwardedPatient = calculatePatientRP(req.body);
      if (rpAwardedPatient > 0) {
        await pool.query(
          `UPDATE members
            SET reputation_points = COALESCE(reputation_points, 0) + $2
          WHERE anonymous_id = $1`,
          [patientId, rpAwardedPatient],
        );
      }
    }

    console.log("[POST /submit-claim] Routing result:", decision);
    return res.json({
      ...decision,
      claim_id: claimId,
      jury_assignment: juryAssignment,
      rp_awarded: rpAwardedPatient,
    });
  } catch (error) {
    console.error("[POST /submit-claim] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/members/rp/:anonymous_id", async (req, res) => {
  try {
    const anonymousId = String(req.params.anonymous_id ?? "").trim();
    if (!anonymousId) {
      return res.status(400).json({ error: "anonymous_id is required" });
    }
    const [result, votesCount] = await Promise.all([
      pool.query(
        `SELECT anonymous_id, reputation_points, tier FROM members WHERE anonymous_id = $1`,
        [anonymousId],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM jury_votes WHERE juror_anonymous_id = $1`,
        [anonymousId],
      ),
    ]);
    const cases_reviewed = Number(votesCount.rows[0]?.n ?? 0);
    if (result.rowCount === 0) {
      const meta = rpMetaForPoints(0);
      return res.json({
        anonymous_id: anonymousId,
        reputation_points: 0,
        tier: null,
        cases_reviewed,
        ...meta,
      });
    }
    const row = result.rows[0];
    const reputation_points = Number(row.reputation_points ?? 0);
    const meta = rpMetaForPoints(reputation_points);
    return res.json({
      anonymous_id: row.anonymous_id,
      reputation_points,
      tier: row.tier ?? null,
      cases_reviewed,
      ...meta,
    });
  } catch (error) {
    console.error("[GET /members/rp/:anonymous_id] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/stats", async (_req, res) => {
  try {
    const claimsResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_cases,
        COUNT(*) FILTER (WHERE routing_path = 'PATH_A')::int AS path_a_count,
        COUNT(*) FILTER (WHERE routing_path = 'PATH_B')::int AS path_b_count
      FROM claims
    `);

    const juryResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE final_decision = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE final_decision = 'denied')::int AS denied,
        COUNT(*) FILTER (WHERE final_decision = 're_evaluation')::int AS re_evaluation,
        ROUND(AVG(confidence_avg) * 100)::int AS avg_confidence_pct
      FROM jury_cases
      WHERE status = 'decided'
    `);

    const claims = claimsResult.rows[0] ?? {};
    const jury = juryResult.rows[0] ?? {};
    return res.json({
      total_cases: Number(claims.total_cases ?? 0),
      approved: Number(jury.approved ?? 0),
      denied: Number(jury.denied ?? 0),
      re_evaluation: Number(jury.re_evaluation ?? 0),
      path_a_count: Number(claims.path_a_count ?? 0),
      path_b_count: Number(claims.path_b_count ?? 0),
      avg_confidence_pct: Number(jury.avg_confidence_pct ?? 0),
    });
  } catch (error) {
    console.error("[GET /stats] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/members/juror-status", async (req, res) => {
  try {
    const anonymousId = String(req.query.anonymous_id ?? "").trim();
    if (!anonymousId) {
      return res.status(400).json({ error: "anonymous_id is required" });
    }
    const result = await pool.query(`SELECT is_juror FROM members WHERE anonymous_id = $1`, [
      anonymousId,
    ]);
    if (result.rowCount === 0) {
      return res.json({ is_juror: false });
    }
    return res.json({ is_juror: Boolean(result.rows[0].is_juror) });
  } catch (error) {
    console.error("[GET /members/juror-status] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/juror/apply", async (req, res) => {
  try {
    const anonymousId = String(req.body?.anonymous_id ?? "").trim();
    const credentialName = String(req.body?.credential_name ?? "").trim();
    const institution = String(req.body?.institution ?? "").trim();
    const year = Number(req.body?.year);
    const registrationNumber = String(req.body?.registration_number ?? "").trim();
    const trialAnswers = req.body?.trial_answers;

    if (!anonymousId) {
      return res.status(400).json({ error: "anonymous_id is required" });
    }
    if (!credentialName || !institution || !registrationNumber) {
      return res.status(400).json({ error: "Missing required credential fields" });
    }
    if (!Number.isFinite(year) || year < 1950 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: "Invalid year of completion" });
    }
    if (!trialAnswers || typeof trialAnswers !== "object") {
      return res.status(400).json({ error: "trial_answers is required" });
    }
    const { evidence, treatment, cost } = trialAnswers;
    if (!evidence || !treatment || !cost) {
      return res.status(400).json({ error: "Complete all trial evaluation questions" });
    }

    const refNum = Math.floor(Math.random() * 10000);
    const reference = `JP-${String(refNum).padStart(4, "0")}`;

    await pool.query(
      `INSERT INTO juror_applications
        (anonymous_id, credential_name, institution, year, registration_number, trial_answers, status)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'approved')`,
      [
        anonymousId,
        credentialName,
        institution,
        year,
        registrationNumber,
        JSON.stringify({ evidence, treatment, cost }),
      ],
    );

    const upd = await pool.query(`UPDATE members SET is_juror = true WHERE anonymous_id = $1`, [
      anonymousId,
    ]);
    if (upd.rowCount === 0) {
      return res.status(404).json({ error: "Member not found. Complete onboarding first." });
    }

    return res.json({ success: true, reference, status: "approved" });
  } catch (error) {
    console.error("[POST /juror/apply] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/jury/assign", async (req, res) => {
  try {
    const claimId = Number(req.body?.claim_id);
    if (!Number.isFinite(claimId) || claimId <= 0) {
      return res.status(400).json({ error: "claim_id is required" });
    }
    const assignment = await assignJury(claimId);
    return res.json(assignment);
  } catch (error) {
    console.error("[POST /jury/assign] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/jury/:jury_case_id/vote", async (req, res) => {
  try {
    const juryCaseId = Number(req.params.jury_case_id);
    const jurorAnonymousId = String(req.body?.juror_anonymous_id ?? "").trim();
    const vote = String(req.body?.vote ?? "").trim().toLowerCase();
    const confidence = Number(req.body?.confidence);
    const reasoning = String(req.body?.reasoning ?? "").trim();
    const demoOutcome = req.body?.demo_outcome;

    if (!Number.isFinite(juryCaseId) || juryCaseId <= 0) {
      return res.status(400).json({ error: "jury_case_id is invalid" });
    }
    if (!jurorAnonymousId) {
      return res.status(400).json({ error: "juror_anonymous_id is required" });
    }
    if (vote !== "approved" && vote !== "denied") {
      return res.status(400).json({ error: "vote must be 'approved' or 'denied'" });
    }
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return res.status(400).json({ error: "confidence must be between 0 and 1" });
    }
    if (!reasoning) {
      return res.status(400).json({ error: "reasoning must not be empty" });
    }

    const caseResult = await pool.query(
      `SELECT id, claim_id, status, votes_required, selected_juror_anonymous_ids
         FROM jury_cases
        WHERE id = $1`,
      [juryCaseId],
    );
    if (caseResult.rowCount === 0) {
      return res.status(404).json({ error: "jury case not found" });
    }
    const juryCase = caseResult.rows[0];
    if (juryCase.status !== "voting") {
      return res.status(400).json({ error: "jury case is not accepting votes" });
    }
    if (!juryCase.selected_juror_anonymous_ids?.includes(jurorAnonymousId)) {
      if (!allowDevUnassignedJurorVotes) {
        return res.status(403).json({ error: "juror is not assigned to this case" });
      }
      // In local/dev mode allow demo jurors and backfill assignment.
      await pool.query(
        `UPDATE jury_cases
            SET selected_juror_anonymous_ids = (
              CASE
                WHEN selected_juror_anonymous_ids IS NULL THEN ARRAY[$2::text]
                WHEN NOT ($2::text = ANY(selected_juror_anonymous_ids))
                  THEN array_append(selected_juror_anonymous_ids, $2::text)
                ELSE selected_juror_anonymous_ids
              END
            )
          WHERE id = $1`,
        [juryCaseId, jurorAnonymousId],
      );
    }

    const voteInsert = await pool.query(
      `INSERT INTO jury_votes (jury_case_id, juror_anonymous_id, vote, confidence, reasoning)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (jury_case_id, juror_anonymous_id) DO NOTHING
       RETURNING id`,
      [juryCaseId, jurorAnonymousId, vote, confidence, reasoning],
    );
    const voteWasNew = voteInsert.rowCount > 0;
    let rpAwarded = 0;
    if (
      voteWasNew &&
      reasoning !== SIMULATED_JUROR_REASONING &&
      String(reasoning ?? "").trim().length > 0
    ) {
      rpAwarded = calculateJurorRP({ reasoning, confidence });
      await pool.query(
        `UPDATE members
            SET reputation_points = COALESCE(reputation_points, 0) + $2
          WHERE anonymous_id = $1`,
        [jurorAnonymousId, rpAwarded],
      );
    }

    const caseRefresh = await pool.query(
      `SELECT id, claim_id, status, votes_required, selected_juror_anonymous_ids
         FROM jury_cases
        WHERE id = $1`,
      [juryCaseId],
    );
    const jcRow = caseRefresh.rows[0];
    const votesRequired = Number(jcRow.votes_required ?? 8);
    const assignedIds = Array.isArray(jcRow.selected_juror_anonymous_ids)
      ? jcRow.selected_juror_anonymous_ids
      : [];

    const votedRows = await pool.query(
      `SELECT juror_anonymous_id FROM jury_votes WHERE jury_case_id = $1`,
      [juryCaseId],
    );
    const votedSet = new Set(votedRows.rows.map((r) => r.juror_anonymous_id));
    const votesCastSoFar = votedSet.size;
    const votesNeeded = Math.max(0, votesRequired - votesCastSoFar);
    const notVoted = assignedIds.filter((id) => !votedSet.has(id));

    const demoReEval = demoOutcome === "re_evaluation";

    for (const aid of notVoted.slice(0, votesNeeded)) {
      const simVote = Math.random() < 0.7 ? "approved" : "denied";
      const simConf = demoReEval
        ? Number((0.2 + Math.random() * 0.2).toFixed(2))
        : Number((0.65 + Math.random() * 0.3).toFixed(2));
      await pool.query(
        `INSERT INTO jury_votes (jury_case_id, juror_anonymous_id, vote, confidence, reasoning)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (jury_case_id, juror_anonymous_id) DO NOTHING`,
        [juryCaseId, aid, simVote, simConf, SIMULATED_JUROR_REASONING],
      );
    }

    const aggResult = await pool.query(
      `SELECT
         COUNT(*)::int AS votes_cast,
         COUNT(*) FILTER (WHERE vote = 'approved')::int AS approve_count,
         COUNT(*) FILTER (WHERE vote = 'denied')::int AS deny_count,
         AVG(confidence)::numeric AS confidence_avg
       FROM jury_votes
       WHERE jury_case_id = $1`,
      [juryCaseId],
    );
    const agg = aggResult.rows[0];
    const votesCast = Number(agg.votes_cast ?? 0);
    const approveCount = Number(agg.approve_count ?? 0);
    const denyCount = Number(agg.deny_count ?? 0);
    const confidenceAvg = agg.confidence_avg == null ? null : Number(agg.confidence_avg);

    let finalDecision;
    if (demoReEval) {
      finalDecision = "re_evaluation";
    } else {
      finalDecision = "denied";
      if (confidenceAvg != null && confidenceAvg < 0.6) {
        finalDecision = "re_evaluation";
      } else if (approveCount > denyCount) {
        finalDecision = "approved";
      } else {
        finalDecision = "denied";
      }
    }

    await pool.query(
      `UPDATE jury_cases
          SET status = 'decided',
              final_decision = $2,
              confidence_avg = $3,
              votes_cast = $4,
              decided_at = now()
        WHERE id = $1`,
      [juryCaseId, finalDecision, confidenceAvg, votesRequired],
    );

    const claimPathResult = await pool.query(
      `SELECT routing_path FROM claims WHERE id = $1`,
      [jcRow.claim_id],
    );
    const path = claimPathResult.rows[0]?.routing_path ?? "PATH_B";

    return res.json({
      path,
      status: "decided",
      jury_case_id: juryCaseId,
      final_decision: finalDecision,
      confidence_avg: confidenceAvg,
      approve_count: approveCount,
      deny_count: denyCount,
      votes_cast: votesCast,
      votes_required: votesRequired,
      rp_awarded: rpAwarded,
    });
  } catch (error) {
    console.error("[POST /jury/:jury_case_id/vote] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/jury/case/:jury_case_id", async (req, res) => {
  try {
    const juryCaseId = Number(req.params.jury_case_id);
    if (!Number.isFinite(juryCaseId) || juryCaseId <= 0) {
      return res.status(400).json({ error: "jury_case_id is invalid" });
    }

    const caseResult = await pool.query(
      `SELECT id, claim_id, status, votes_cast, votes_required, confidence_avg, final_decision, decided_at
         FROM jury_cases
        WHERE id = $1`,
      [juryCaseId],
    );
    if (caseResult.rowCount === 0) {
      return res.status(404).json({ error: "jury case not found" });
    }
    const juryCase = caseResult.rows[0];

    const voteAggResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE vote = 'approved')::int AS approve_count,
         COUNT(*) FILTER (WHERE vote = 'denied')::int AS deny_count,
         COUNT(*)::int AS votes_cast,
         AVG(confidence)::numeric AS confidence_avg
       FROM jury_votes
       WHERE jury_case_id = $1`,
      [juryCaseId],
    );
    const agg = voteAggResult.rows[0];

    const votesListResult = await pool.query(
      `SELECT vote, confidence, reasoning
         FROM jury_votes
        WHERE jury_case_id = $1
        ORDER BY id ASC`,
      [juryCaseId],
    );
    const votes = votesListResult.rows.map((row) => ({
      vote: row.vote,
      confidence: row.confidence != null ? Number(row.confidence) : null,
      reasoning: String(row.reasoning ?? ""),
    }));

    return res.json({
      jury_case_id: juryCase.id,
      claim_id: juryCase.claim_id,
      status: juryCase.status,
      votes_cast: Number(agg.votes_cast ?? juryCase.votes_cast ?? 0),
      votes_required: Number(juryCase.votes_required ?? 8),
      approve_count: Number(agg.approve_count ?? 0),
      deny_count: Number(agg.deny_count ?? 0),
      confidence_avg:
        agg.confidence_avg != null ? Number(agg.confidence_avg) : juryCase.confidence_avg,
      final_decision: juryCase.final_decision,
      decided_at: juryCase.decided_at,
      votes,
    });
  } catch (error) {
    console.error("[GET /jury/case/:jury_case_id] failed:", error?.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/onboarding/identity", async (req, res) => {
  try {
    const { alias, password } = req.body ?? {};
    if (!alias || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const anonymousId = crypto
      .createHash("sha256")
      .update(String(alias) + String(password) + String(Date.now()))
      .digest("hex");
    const aliasHash = crypto.createHash("sha256").update(String(alias)).digest("hex");
    const waitingEndsAt = waitingEndsAtForTier("contributor");

    await pool.query(
      `INSERT INTO members (anonymous_id, alias_hash, tier, waiting_ends_at)
       VALUES ($1, $2, 'contributor', $3)`,
      [anonymousId, aliasHash, waitingEndsAt],
    );
    await pool.query(
      "UPDATE members SET reputation_points = 150 WHERE anonymous_id = $1",
      [anonymousId],
    );

    return res.json({
      anonymousId,
      message: "Identity created successfully",
    });
  } catch {
    console.error("[onboarding/identity] request failed");
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/onboarding/health-profile", async (req, res) => {
  try {
    const {
      anonymousId,
      encryptionKey,
      ageRange,
      bloodType,
      gender,
      allergies,
      conditions,
    } = req.body ?? {};

    if (
      !anonymousId ||
      !encryptionKey ||
      ageRange === undefined ||
      ageRange === null ||
      String(ageRange).trim() === "" ||
      !bloodType ||
      !gender
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const ageRangeEnc = encrypt(ageRange, encryptionKey);
    const bloodTypeEnc = encrypt(bloodType, encryptionKey);
    const genderEnc = encrypt(gender, encryptionKey);
    const allergiesEnc = encrypt(allergies ?? "", encryptionKey);
    const conditionsEnc = encrypt(conditions ?? "", encryptionKey);

    await pool.query(
      `INSERT INTO health_profiles (
        anonymous_id, age_range_enc, blood_type_enc, gender_enc, allergies_enc, conditions_enc
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (anonymous_id) DO UPDATE SET
        age_range_enc = EXCLUDED.age_range_enc,
        blood_type_enc = EXCLUDED.blood_type_enc,
        gender_enc = EXCLUDED.gender_enc,
        allergies_enc = EXCLUDED.allergies_enc,
        conditions_enc = EXCLUDED.conditions_enc,
        updated_at = now()`,
      [anonymousId, ageRangeEnc, bloodTypeEnc, genderEnc, allergiesEnc, conditionsEnc],
    );

    return res.json({ success: true, message: "Health profile saved" });
  } catch {
    console.error("[onboarding/health-profile] request failed");
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/onboarding/documents", upload.array("files"), async (req, res) => {
  try {
    const { anonymousId } = req.body ?? {};
    const secret = process.env.ENCRYPTION_SECRET;
    const files = req.files ?? [];

    if (!anonymousId || !secret || files.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const ipfsHashes = [];
    for (const file of files) {
      const encrypted = encryptBuffer(file.buffer, secret);
      const hash = await uploadToIPFS(encrypted, file.originalname || "document.enc");
      ipfsHashes.push(hash);
    }

    const updateResult = await pool.query(
      `UPDATE health_profiles
       SET documents_ipfs = COALESCE(documents_ipfs, '{}') || $2::text[], updated_at = now()
       WHERE anonymous_id = $1`,
      [anonymousId, ipfsHashes],
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    return res.json({ success: true, ipfsHashes });
  } catch {
    console.error("[onboarding/documents] request failed");
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/onboarding/tier", async (req, res) => {
  try {
    const { anonymousId, tier } = req.body ?? {};
    const allowed = ["contributor", "supporter", "sustainer"];

    if (!anonymousId || !tier || !allowed.includes(String(tier).toLowerCase())) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedTier = String(tier).toLowerCase();
    const waitingEndsAt = waitingEndsAtForTier(normalizedTier);

    const result = await pool.query(
      `UPDATE members SET tier = $1, waiting_ends_at = $2 WHERE anonymous_id = $3`,
      [normalizedTier, waitingEndsAt, anonymousId],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    return res.json({
      success: true,
      tier: normalizedTier,
      waitingEndsAt,
    });
  } catch {
    console.error("[onboarding/tier] request failed");
    return res.status(500).json({ error: "Something went wrong" });
  }
});

async function startServer() {
  await seedApprovedProceduresIfEmpty();
  await ensureClaimsTable();
  await ensureJuryTables();
  await ensureJurorApplicationsTable();
  await seedJurorsIfEmpty();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Cipher backend listening on port ${PORT}`);
    console.log("[Server] Routing endpoints ready: /claims/route, /submit-claim");
  });
}

startServer().catch((error) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});
