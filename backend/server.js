import express from "express";
import cors from "cors";
import { loadApprovedProcedures } from "./lib/loadApprovedProcedures.js";
import { routeClaim, validateClaimPayload } from "./lib/routeClaim.js";
import { evaluatePoolHealth } from "./lib/guardrailEngine.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://heertanna.github.io"],
  }),
);

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

  const validationError = validateClaimPayload(req.body);
  if (validationError) {
    console.warn("[POST /submit-claim] Validation failed:", validationError);
    return res.status(400).json({
      error: validationError,
    });
  }

  const { icd10_code, claim_cost } = req.body;
  const guardrails = evaluatePoolHealth();
  const result = routeClaim({
    icd10_code: icd10_code.trim(),
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
