import pool from "../db.js";

function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function fuzzyMatchProcedure(whatHappened) {
  const text = toTrimmedString(whatHappened);
  if (!text) return { matchedProcedure: null, similarityScore: null };

  // First try: fuzzy similarity search using pg_trgm
  const result = await pool.query(
    `SELECT id, procedure_name, max_cost_inr, is_experimental, is_rare, governance_flagged,
            similarity(lower(procedure_name), lower($1)) AS score
     FROM approved_procedures
     WHERE similarity(lower(procedure_name), lower($1)) > 0.15
     ORDER BY score DESC
     LIMIT 1`,
    [text],
  );

  // Second try: if no fuzzy match, check if any procedure_name word appears in what_happened
  if (result.rowCount === 0) {
    const fallback = await pool.query(
      `SELECT id, procedure_name, max_cost_inr, is_experimental, is_rare, governance_flagged,
              0.2 AS score
       FROM approved_procedures
       WHERE lower($1) LIKE '%' || lower(procedure_name) || '%'
          OR lower(procedure_name) LIKE '%' || lower($1) || '%'
       LIMIT 1`,
      [text],
    );
    if (fallback.rowCount === 0) {
      return { matchedProcedure: null, similarityScore: null };
    }
    const row = fallback.rows[0];
    return {
      matchedProcedure: {
        id: row.id,
        procedure_name: row.procedure_name,
        max_cost_inr: row.max_cost_inr,
        is_experimental: row.is_experimental,
        is_rare: row.is_rare,
        governance_flagged: row.governance_flagged,
      },
      similarityScore: 0.2,
    };
  }

  const row = result.rows[0];
  return {
    matchedProcedure: {
      id: row.id,
      procedure_name: row.procedure_name,
      max_cost_inr: row.max_cost_inr,
      is_experimental: row.is_experimental,
      is_rare: row.is_rare,
      governance_flagged: row.governance_flagged,
    },
    similarityScore: Number(row.score),
  };
}

export async function routeClaim(claim) {
  const whatHappened = toTrimmedString(claim?.what_happened);
  const costInr = Number(claim?.cost_inr ?? 0);

  console.log(`[routeClaim] what_happened="${whatHappened}" cost_inr=${costInr}`);

  // CHECK 1 — Procedure match
  const { matchedProcedure, similarityScore } = await fuzzyMatchProcedure(whatHappened);
  if (!matchedProcedure) {
    console.log("[routeClaim] → PATH_B: procedure_not_recognized");
    return {
      path: "PATH_B",
      reason: "procedure_not_recognized",
      matchedProcedure: null,
      similarityScore: null,
    };
  }
  console.log(`[routeClaim] Matched: "${matchedProcedure.procedure_name}" score=${similarityScore}`);

  // CHECK 2 — Cost vs procedure max
  if (
    matchedProcedure.max_cost_inr !== null &&
    matchedProcedure.max_cost_inr > 0 &&
    costInr > matchedProcedure.max_cost_inr
  ) {
    console.log("[routeClaim] → PATH_B: exceeds_procedure_max_cost");
    return {
      path: "PATH_B",
      reason: "exceeds_procedure_max_cost",
      matchedProcedure,
      similarityScore,
    };
  }

  // CHECK 3 — Pool guardrail
  if (costInr > 500000) {
    console.log("[routeClaim] → PATH_B: exceeds_pool_guardrail");
    return {
      path: "PATH_B",
      reason: "exceeds_pool_guardrail",
      matchedProcedure,
      similarityScore,
    };
  }
  if (costInr >= 100000) {
    console.log("[routeClaim] → PATH_B: risk_check_required");
    return {
      path: "PATH_B",
      reason: "risk_check_required",
      matchedProcedure,
      similarityScore,
    };
  }

  // CHECK 4 — Red flags
  if (
    matchedProcedure.is_experimental ||
    matchedProcedure.is_rare ||
    matchedProcedure.governance_flagged
  ) {
    console.log("[routeClaim] → PATH_B: procedure_flagged");
    return {
      path: "PATH_B",
      reason: "procedure_flagged",
      matchedProcedure,
      similarityScore,
    };
  }

  // All checks passed
  console.log("[routeClaim] → PATH_A: approved_procedure_within_limits");
  return {
    path: "PATH_A",
    reason: "approved_procedure_within_limits",
    matchedProcedure,
    similarityScore,
  };
}

export function validateClaimPayloadForRouting(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Request body must be a JSON object.";
  }
  const { what_happened, cost_inr } = payload;
  if (typeof what_happened !== "string" || what_happened.trim() === "") {
    return "Field 'what_happened' is required and must be a non-empty string.";
  }
  const n = Number(cost_inr);
  if (!Number.isFinite(n) || n < 0) {
    return "Field 'cost_inr' is required and must be a non-negative number.";
  }
  return null;
}