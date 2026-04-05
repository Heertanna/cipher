/**
 * Syncs the latest final verdict into the protocol dashboard claims list (localStorage demo).
 */

const CLAIMS_KEY = "cipher_claims_demo";

/** Full caseResult for reopening /final-verdict from a claim card */
export const VERDICT_SNAPSHOT_KEY = "cipher_last_verdict_snapshot";

export const CLAIMS_UPDATED_EVENT = "cipher-claims-updated";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isJuryReviewClaim(c) {
  if (!c) return false;
  return (
    c.stage === "Jury review" ||
    c.status === "Under Jury Review" ||
    c.status === "UNDER JURY REVIEW"
  );
}

/**
 * Writes verdict into the first matching "jury review" claim, or the first claim, or seeds one row.
 * Stores full `caseResult` for navigation to `/final-verdict`.
 */
export function persistVerdictToClaims(caseResult) {
  if (typeof window === "undefined" || !caseResult) return;

  let claims = safeParse(window.localStorage.getItem(CLAIMS_KEY)) || [];
  let idx = claims.findIndex(isJuryReviewClaim);

  if (idx === -1 && claims.length > 0) {
    idx = 0;
  }

  if (idx === -1) {
    claims.push({
      id: `C${Math.floor(Date.now() / 1000)}`,
      status: "Under Jury Review",
      stage: "Jury review",
      stageDetail: "Review in progress",
      jurorCount: caseResult.totalJurors ?? 10,
      createdAt: Date.now(),
    });
    idx = claims.length - 1;
  }

  const approved = caseResult.finalDecision === "APPROVED";
  const next = [...claims];
  next[idx] = {
    ...next[idx],
    status: approved ? "Approved" : "Rejected",
    stage: "Decision",
    stageDetail: "Final verdict recorded — open to review",
    verdictCaseId: caseResult.caseId,
    verdictRecordedAt: Date.now(),
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(CLAIMS_KEY, JSON.stringify(next.slice(0, 20)));
  window.localStorage.setItem(
    VERDICT_SNAPSHOT_KEY,
    JSON.stringify({ caseResult, savedAt: Date.now() })
  );
  window.dispatchEvent(new CustomEvent(CLAIMS_UPDATED_EVENT));
}

export function readClaimsFromStorage() {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(CLAIMS_KEY)) || [];
}

export function readVerdictSnapshot() {
  if (typeof window === "undefined") return null;
  return safeParse(window.localStorage.getItem(VERDICT_SNAPSHOT_KEY));
}
