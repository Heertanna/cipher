import { checkRiskFlags } from "./riskFlags.js";

export function routeClaim({ icd10_code, claim_cost, approvedProcedures, guardrails }) {
  const flags = [];

  // Check 1: procedure lookup
  const matchedProcedure =
    approvedProcedures.find((procedure) => procedure.icd10_code === icd10_code) ?? null;

  if (!matchedProcedure) {
    flags.push("UNKNOWN_PROCEDURE");
  } else {
    // Check 2: strict cost match with approved procedure amount.
    // Any mismatch routes through review.
    if (claim_cost !== matchedProcedure.max_cost_inr) {
      flags.push("EXCEEDS_PROCEDURE_MAX");
    }
  }

  // Check 3: pool guardrail threshold
  if (claim_cost > guardrails.costThreshold) {
    flags.push("EXCEEDS_COST_THRESHOLD");
  }

  // Check 4: risk flags
  if (checkRiskFlags(icd10_code)) {
    flags.push("RISK_FLAG");
  }

  return {
    path: flags.length === 0 ? "PATH_A" : "PATH_B",
    flags,
    matched_procedure: matchedProcedure,
  };
}

export function validateClaimPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Request body must be a JSON object.";
  }

  const { icd10_code, claim_cost } = payload;

  if (typeof icd10_code !== "string" || icd10_code.trim() === "") {
    return "Field 'icd10_code' is required and must be a non-empty string.";
  }

  if (typeof claim_cost !== "number" || Number.isNaN(claim_cost) || claim_cost < 0) {
    return "Field 'claim_cost' is required and must be a non-negative number.";
  }

  return null;
}
