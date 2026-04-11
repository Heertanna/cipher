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

app.use(express.json());
app.use(
  cors({
    origin: corsOrigins,
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
    ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0
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

    console.log("[POST /submit-claim] Routing result:", decision);
    return res.json({
      ...decision,
      claim_id: claimId,
      jury_assignment: juryAssignment,
    });
  } catch (error) {
    console.error("[POST /submit-claim] failed:", error?.message);
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

    await pool.query(
      `INSERT INTO jury_votes (jury_case_id, juror_anonymous_id, vote, confidence, reasoning)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (jury_case_id, juror_anonymous_id) DO NOTHING`,
      [juryCaseId, jurorAnonymousId, vote, confidence, reasoning],
    );

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

    for (const aid of notVoted.slice(0, votesNeeded)) {
      const simVote = Math.random() < 0.7 ? "approved" : "denied";
      const simConf = Number((0.65 + Math.random() * 0.3).toFixed(2));
      await pool.query(
        `INSERT INTO jury_votes (jury_case_id, juror_anonymous_id, vote, confidence, reasoning)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (jury_case_id, juror_anonymous_id) DO NOTHING`,
        [juryCaseId, aid, simVote, simConf, "Protocol evaluation completed."],
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

    let finalDecision = "denied";
    if (confidenceAvg != null && confidenceAvg < 0.6) {
      finalDecision = "re_evaluation";
    } else if (approveCount > denyCount) {
      finalDecision = "approved";
    } else {
      finalDecision = "denied";
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

    if (assignedIds.length > 0) {
      await pool.query(
        `UPDATE members
            SET reputation_points = COALESCE(reputation_points, 0) + 10,
                rp_score = COALESCE(rp_score, 0) + 10
          WHERE anonymous_id = ANY($1::text[])`,
        [assignedIds],
      );
    }

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
