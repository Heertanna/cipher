import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import multer from "multer";
import { loadApprovedProcedures } from "./lib/loadApprovedProcedures.js";
import { routeClaim, validateClaimPayload } from "./lib/routeClaim.js";
import { evaluatePoolHealth } from "./lib/guardrailEngine.js";
import pool from "./db.js";
import { encrypt, encryptBuffer } from "./lib/encryption.js";
import { uploadToIPFS } from "./lib/ipfsUpload.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://heertanna.github.io"],
  }),
);

function waitingEndsAtForTier(tier) {
  const days =
    tier === "contributor" ? 90 : tier === "supporter" ? 60 : tier === "sustainer" ? 30 : 90;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

let approvedProcedures = [];

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/procedures", (_req, res) => {
  console.log("[GET /procedures] Returning approved procedures");
  res.json({
    count: approvedProcedures.length,
    procedures: approvedProcedures,
  });
});

app.post("/submit-claim", (req, res) => {
  console.log("[POST /submit-claim] Incoming payload:", req.body);

  const normalizedPayload = {
    icd10_code: req.body?.icd10_code ?? req.body?.icd10Code,
    procedure_name: req.body?.procedure_name ?? req.body?.procedureName,
    claim_cost: req.body?.claim_cost ?? req.body?.claimCost,
  };

  const validationError = validateClaimPayload(normalizedPayload);
  if (validationError) {
    console.warn("[POST /submit-claim] Validation failed:", validationError);
    return res.status(400).json({
      error: validationError,
    });
  }

  const { icd10_code, procedure_name, claim_cost } = normalizedPayload;
  const guardrails = evaluatePoolHealth();
  const result = routeClaim({
    icd10_code: typeof icd10_code === "string" ? icd10_code.trim() : "",
    procedure_name: typeof procedure_name === "string" ? procedure_name.trim() : "",
    claim_cost,
    approvedProcedures,
    guardrails,
  });
  const requiresExtraJury =
    (guardrails.healthLevel === "cautious" &&
      claim_cost > (guardrails.extraJuryThreshold ?? Number.MAX_SAFE_INTEGER)) ||
    (guardrails.healthLevel === "critical" && result.path === "PATH_B");
  const responsePayload = {
    path: result.path,
    flags: result.flags,
    matched_procedure: result.matched_procedure,
    guardrails: {
      healthLevel: guardrails.healthLevel,
      reserveRatio: guardrails.reserveRatio,
      costThreshold: guardrails.costThreshold,
      message: guardrails.message,
    },
    requiresExtraJury,
    claim_cost,
  };

  console.log("[POST /submit-claim] Routing result:", responsePayload);
  return res.json(responsePayload);
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
  approvedProcedures = await loadApprovedProcedures();

  app.listen(PORT, () => {
    console.log(`[Server] Cipher backend listening on port ${PORT}`);
    console.log(`[Server] Loaded procedures: ${approvedProcedures.length}`);
  });
}

startServer().catch((error) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});
