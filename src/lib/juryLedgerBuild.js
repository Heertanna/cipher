/**
 * Build anonymized Jury Ledger rows from the juror simulation (+ real user).
 * Aliases are assigned after a seeded shuffle (no identity leakage).
 */

import { generateMockJurors, combineJurors } from "./jurorDecisionEngine.js";

function hashSeed(str) {
  let h = 0;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) >>> 0;
}

function mulberry32(a) {
  let state = a >>> 0;
  return function next() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic shuffle — stable for the same `seedKey`. */
export function seededShuffle(arr, seedKey) {
  const rng = mulberry32(hashSeed(seedKey));
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function confidenceKeyToDecimal(key) {
  if (key === "high") return 0.82;
  if (key === "medium") return 0.58;
  return 0.38;
}

/** Map evaluation position → simulation YES/NO (deterministic for furtherReview). */
export function simulationVoteFromPosition(answer, caseId) {
  if (answer === "support") return "YES";
  if (answer === "doNotSupport") return "NO";
  return hashSeed(`${caseId}:fr`) % 2 === 0 ? "YES" : "NO";
}

export function scenarioFromYesRatio(yesRatio) {
  const y = Number(yesRatio);
  if (y >= 0.65) return "strong_yes";
  if (y <= 0.35) return "strong_no";
  if (y >= 0.45 && y <= 0.55) return "split";
  if (y > 0.55) return "uncertain_yes";
  return "uncertain_no";
}

const REASON_APPROVE = [
  "Evidence aligns with pathway thresholds.",
  "Treatment fit consistent with attending attestation.",
  "Cost band within pool reference for this class.",
  "Documentation supports escalation where noted.",
  "No material gaps in the anonymized record.",
];

const REASON_REJECT = [
  "Variance vs pool median requires clarification.",
  "Documentation did not fully support tier requested.",
  "Cost envelope outside comparable band.",
  "Timing relative to protocol window is ambiguous.",
  "Further attestation suggested before release.",
];

function pickReason(vote, seedKey, index) {
  const pool = vote === "YES" ? REASON_APPROVE : REASON_REJECT;
  const idx = hashSeed(`${seedKey}:${index}`) % pool.length;
  return pool[idx];
}

function toLedgerRows(combinedSimulationJurors, shuffleKey, includeReason = true) {
  const shuffled = seededShuffle(combinedSimulationJurors, shuffleKey);
  return shuffled.map((j, i) => {
    const vote = j.vote === "YES" ? "APPROVE" : "REJECT";
    return {
      id: `Juror_${String(i + 1).padStart(2, "0")}`,
      vote,
      confidence: Math.min(1, Math.max(0, j.confidence)),
      ...(includeReason
        ? { reason: pickReason(j.vote, shuffleKey, i) }
        : {}),
    };
  });
}

/**
 * @param {object} submission — jury evaluation payload (position.answer, position.confidence)
 * @param {object} packet — `getJuryEvaluationPacket` result
 * @param {{ yesRatio?: number }} [opts]
 */
export function buildLedgerJurors(submission, packet, opts = {}) {
  const total = Math.max(2, packet?.totalJurors ?? 10);
  const mockCount = total - 1;
  const caseId = packet?.caseId ?? "A392";
  const scenario = scenarioFromYesRatio(opts.yesRatio ?? 0.5);
  const mock = generateMockJurors(mockCount, scenario);
  const userConf =
    submission?.position?.confidence != null
      ? confidenceKeyToDecimal(submission.position.confidence)
      : 0.7;
  const userVote = simulationVoteFromPosition(
    submission?.position?.answer,
    caseId
  );
  const combined = combineJurors(mock, userVote, userConf);
  const shuffleKey = `ledger:${caseId}:${opts.yesRatio ?? "x"}`;
  return toLedgerRows(combined, shuffleKey, true);
}

/**
 * When opening the ledger without a live submission (e.g. direct /final-verdict).
 */
export function buildLedgerJurorsFallback(caseResult) {
  const total = Math.max(2, caseResult?.totalJurors ?? 10);
  const mockCount = total - 1;
  const caseId = caseResult?.caseId ?? "A392";
  const scenario = scenarioFromYesRatio(caseResult?.yesRatio ?? 0.5);
  const mock = generateMockJurors(mockCount, scenario);
  const userVote = caseResult?.userVote === "APPROVED" ? "YES" : "NO";
  const userConf = Number(caseResult?.userConfidence) || 0.7;
  const combined = combineJurors(mock, userVote, userConf);
  return toLedgerRows(combined, `ledger-fallback:${caseId}`, true);
}
