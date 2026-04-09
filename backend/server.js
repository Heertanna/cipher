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

const app = express();
const PORT = Number(process.env.PORT) || 3001;

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

    await pool.query(
      `INSERT INTO claims
        (what_happened, cost_inr, routing_path, routing_reason, matched_procedure_id, similarity_score, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
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

    console.log("[POST /submit-claim] Routing result:", decision);
    return res.json(decision);
  } catch (error) {
    console.error("[POST /submit-claim] failed:", error?.message);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Cipher backend listening on port ${PORT}`);
    console.log("[Server] Routing endpoints ready: /claims/route, /submit-claim");
  });
}

startServer().catch((error) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});
