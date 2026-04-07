import { checkRiskFlags } from "./riskFlags.js";

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function routeClaim({
  icd10_code,
  procedure_name,
  claim_cost,
  approvedProcedures,
  guardrails,
}) {
  const flags = [];
  const normalizedCode = String(icd10_code ?? "").trim().toUpperCase();
  const normalizedProcedureName = normalizeText(procedure_name);

  // Check 1: lookup by submitted procedure name (preferred), else by ICD.
  const matchedProcedure = normalizedProcedureName
    ? approvedProcedures.find(
        (procedure) => normalizeText(procedure.procedure_name) === normalizedProcedureName,
      ) ?? null
    : approvedProcedures.find(
        (procedure) => String(procedure.icd10_code ?? "").trim().toUpperCase() === normalizedCode,
      ) ?? null;

  if (!matchedProcedure) {
    flags.push("UNKNOWN_PROCEDURE");
  } else {
    // Check 2: compare claim against max_cost_inr retrieved in Check 1.
    // Any mismatch with the approved procedure cost is routed to Path B.
    if (claim_cost !== matchedProcedure.max_cost_inr) {
      flags.push("EXCEEDS_PROCEDURE_MAX");
    }
  }

  // Check 3: pool guardrail threshold
  if (claim_cost > guardrails.costThreshold) {
    flags.push("EXCEEDS_COST_THRESHOLD");
  }

  // Check 4: risk flags
  const riskCode = matchedProcedure?.icd10_code
    ? String(matchedProcedure.icd10_code).trim().toUpperCase()
    : normalizedCode;
  if (checkRiskFlags(riskCode)) {
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

  const { icd10_code, procedure_name, claim_cost } = payload;

  const hasCode = typeof icd10_code === "string" && icd10_code.trim() !== "";
  const hasProcedureName =
    typeof procedure_name === "string" && procedure_name.trim() !== "";
  if (!hasCode && !hasProcedureName) {
    return "Either 'procedure_name' or 'icd10_code' is required.";
  }

  if (typeof claim_cost !== "number" || Number.isNaN(claim_cost) || claim_cost < 0) {
    return "Field 'claim_cost' is required and must be a non-negative number.";
  }

  return null;
}
