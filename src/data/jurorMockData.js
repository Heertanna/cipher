/**
 * Static mock data for juror mode (same user, responsibility layer).
 */

import { buildLedgerJurors } from "../lib/juryLedgerBuild.js";

export const JUROR_MOCK_CASES = [
  {
    id: "A392",
    type: "Emergency",
    description: "Acute post-surgical complication — anonymized imaging and ward notes attached.",
    detail:
      "Anonymized summary: patient presented with post-operative signs requiring escalation. Ward notes and imaging references are attached to the packet. No identifying fields are exposed. Your task is to evaluate whether the requested intervention aligns with protocol thresholds and shared-pool fairness.",
    responded: 6,
    totalJurors: 10,
    timeLeft: "12h left",
    status: "In Progress",
    emergency: true,
    lastInteracted: true,
  },
  {
    id: "B118",
    type: "Planned",
    description: "Elective procedure pre-authorization with cost variance vs. pool median.",
    detail:
      "Pre-authorization packet compares quoted costs to historical pool medians for the same procedure class. Review whether documentation supports the requested tier and timing.",
    responded: 10,
    totalJurors: 10,
    timeLeft: "Closed",
    status: "In Progress",
    emergency: false,
    lastInteracted: false,
    evaluationPacket: {
      symptoms: [
        "Scheduled pre-op clearance documented",
        "Stable vitals; no acute findings on last ambulatory visit",
      ],
      reportsTests:
        "Quoted facility bundle vs. pool median worksheet; imaging within elective cadence. Checklist items are complete.",
      treatmentRequested:
        "Elective arthroscopy with standard overnight observation and physiotherapy starter pack.",
      doctorNote:
        "Pre-authorization attestation: elective pathway satisfied; no contraindications noted on record.",
      cost: "₹2,85,000",
      expectedRange:
        "₹2,60,000 – ₹3,10,000 (median band for the same procedure class in the shared pool)",
    },
  },
  {
    id: "C204",
    type: "Emergency",
    description: "High-urgency medication escalation request; prior jury split on eligibility.",
    detail:
      "Urgency flags are raised; prior round ended without consensus. Focus on clinical necessity versus pool impact under emergency rules.",
    responded: 3,
    totalJurors: 10,
    timeLeft: "36h left",
    status: "In Progress",
    emergency: true,
    lastInteracted: false,
  },
  {
    id: "D441",
    type: "Planned",
    description: "Therapy extension review — duration and outcome metrics under peer standards.",
    detail:
      "Extension request includes outcome metrics and attending attestation. Assess whether continued coverage is proportionate and documented.",
    responded: 7,
    totalJurors: 10,
    timeLeft: "4d left",
    status: "In Progress",
    emergency: false,
    lastInteracted: false,
  },
  {
    id: "E903",
    type: "Planned",
    juryCaseCategory: "Ongoing",
    description: "Reimbursement alignment check for cross-border care documentation.",
    detail:
      "Cross-border documentation bundle is complete per checklist. Verify alignment with reimbursement rules before the jury window closes.",
    responded: 0,
    totalJurors: 10,
    timeLeft: "7d left",
    status: "Pending",
    emergency: false,
    lastInteracted: false,
  },
];

export const JUROR_ACTIVITY = [
  { id: 1, text: "You were assigned to Case #A392", time: "2h ago" },
  { id: 2, text: "Case #B118 reached decision", time: "Yesterday" },
  { id: 3, text: "Your review is pending on Case #C204", time: "3h ago" },
  { id: 4, text: "Pool notice: fairness audit completed", time: "2d ago" },
];

export const JURY_SEAT_STATES = [
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "self",
  "pending",
  "pending",
  "pending",
];

export function getJurorCaseById(caseId) {
  const raw = String(caseId || "")
    .replace(/^case\s*#/i, "")
    .trim();
  return JUROR_MOCK_CASES.find((c) => c.id.toLowerCase() === raw.toLowerCase());
}

/** Display type for jury evaluation overview: Emergency / Planned / Ongoing */
export function resolveJuryCaseType(c) {
  if (!c) return "—";
  if (c.juryCaseCategory) return c.juryCaseCategory;
  if (c.emergency) return "Emergency";
  if (String(c.type).toLowerCase() === "planned") return "Planned";
  return "Ongoing";
}

const DEFAULT_EVALUATION_PACKET = {
  symptoms: [
    "Post-operative tenderness with erythema along the incision corridor",
    "Low-grade fever (38.1°C) on ward flowsheet; trend monitored",
  ],
  reportsTests:
    "Anonymized surgical note summary, CRP trend (downward), and portable imaging reference consistent with expected post-op evolution. Ward labs from the last 48h are attached.",
  treatmentRequested:
    "Escalated IV antimicrobial regimen with a 72-hour reassessment window and stepped telemetry monitoring.",
  doctorNote:
    "Attending attests clinical necessity under the post-operative complication pathway; documentation matches pool emergency-tier checklist.",
  cost: "₹4,20,000",
  expectedRange: "₹3,75,000 – ₹4,55,000 (pool reference band for comparable escalation episodes)",
};

/** Default anonymized “original report” excerpts for the jury report modal (mock). */
const DEFAULT_ANONYMIZED_REPORT = {
  entries: [
    {
      at: "19 Mar 2026 · 14:22 UTC",
      label: "Ward nursing note",
      bullets: [
        "Post-op day 3; dressing changed per protocol.",
        "Mild erythema ~4 cm along incision; no purulent drainage recorded.",
      ],
    },
    {
      at: "19 Mar 2026 · 15:05 UTC",
      label: "Laboratory — chemistry",
      results: [
        { k: "CRP", v: "42 mg/L (previous 68 mg/L)" },
        { k: "WBC", v: "11.2 ×10⁹/L" },
      ],
    },
    {
      at: "19 Mar 2026 · 16:40 UTC",
      label: "Imaging summary (portable)",
      bullets: [
        "Findings consistent with expected post-operative changes; anonymized read notes no new fluid collection.",
      ],
    },
  ],
};

function buildAnonymizedReportForCase(caseId, override) {
  if (override && typeof override === "object") {
    return {
      caseFileRef: override.caseFileRef ?? `#${caseId}`,
      redactions: override.redactions ?? [
        { label: "Patient name", value: "[REDACTED]" },
        { label: "Hospital", value: "[REDACTED]" },
        { label: "Location", value: "[REDACTED]" },
      ],
      entries: override.entries ?? DEFAULT_ANONYMIZED_REPORT.entries,
    };
  }
  return {
    caseFileRef: `#${caseId}`,
    redactions: [
      { label: "Patient name", value: "[REDACTED]" },
      { label: "Hospital", value: "[REDACTED]" },
      { label: "Location", value: "[REDACTED]" },
    ],
    entries: DEFAULT_ANONYMIZED_REPORT.entries,
  };
}

/**
 * Structured context for the guided jury evaluation flow (mock).
 * Cases may set `evaluationPacket` to override any field.
 */
export function getJuryEvaluationPacket(caseId) {
  const c = getJurorCaseById(caseId);
  if (!c) return null;
  const o = c.evaluationPacket || {};
  return {
    caseId: c.id,
    caseType: resolveJuryCaseType(c),
    /** Count before this juror submits (used for post-submission collective UI). */
    respondedBefore: c.responded ?? 0,
    totalJurors: c.totalJurors ?? 10,
    symptoms: o.symptoms ?? DEFAULT_EVALUATION_PACKET.symptoms,
    reportsTests: o.reportsTests ?? DEFAULT_EVALUATION_PACKET.reportsTests,
    treatmentRequested:
      o.treatmentRequested ?? DEFAULT_EVALUATION_PACKET.treatmentRequested,
    doctorNote: o.doctorNote ?? DEFAULT_EVALUATION_PACKET.doctorNote,
    cost: o.cost ?? DEFAULT_EVALUATION_PACKET.cost,
    expectedRange: o.expectedRange ?? DEFAULT_EVALUATION_PACKET.expectedRange,
    anonymizedReport: buildAnonymizedReportForCase(
      c.id,
      o.anonymizedReport
    ),
  };
}

function deriveVerdictConfidenceLevel(avg) {
  if (avg > 0.7) return "High";
  if (avg >= 0.5) return "Moderate";
  return "Low";
}

function positionAnswerToUserVote(answer) {
  if (answer === "support") return "APPROVED";
  return "REJECTED";
}

function confidenceKeyToDecimal(key) {
  if (key === "high") return 0.82;
  if (key === "medium") return 0.58;
  return 0.38;
}

/** Mock finalized pool aggregates (no vote counts) per case for Final Verdict page. */
const FINAL_VERDICT_SEEDS = {
  A392: {
    finalDecision: "APPROVED",
    avgConfidence: 0.78,
    yesRatio: 0.72,
    wasReevaluated: false,
    allowReevaluation: false,
  },
  B118: {
    finalDecision: "APPROVED",
    avgConfidence: 0.76,
    yesRatio: 0.71,
    wasReevaluated: false,
    allowReevaluation: false,
  },
  C204: {
    finalDecision: "REJECTED",
    avgConfidence: 0.52,
    yesRatio: 0.46,
    wasReevaluated: true,
    allowReevaluation: true,
  },
  D441: {
    finalDecision: "APPROVED",
    avgConfidence: 0.68,
    yesRatio: 0.67,
    wasReevaluated: false,
    allowReevaluation: false,
  },
  E903: {
    finalDecision: "APPROVED",
    avgConfidence: 0.74,
    yesRatio: 0.7,
    wasReevaluated: false,
    allowReevaluation: false,
  },
};

/**
 * Builds `caseResult` for `FinalVerdictPage` from a completed evaluation submission.
 */
export function getFinalVerdictCaseResult(submission, packet) {
  const caseId = packet?.caseId ?? submission?.caseId ?? "A392";
  const id = String(caseId).toUpperCase();
  const seed = FINAL_VERDICT_SEEDS[id] ?? { ...FINAL_VERDICT_SEEDS.A392 };
  const userVote = positionAnswerToUserVote(submission?.position?.answer);
  const userConfidence = confidenceKeyToDecimal(submission?.position?.confidence);
  const avg = seed.avgConfidence;
  return {
    caseId: id,
    finalDecision: seed.finalDecision,
    avgConfidence: avg,
    confidenceLevel: deriveVerdictConfidenceLevel(avg),
    wasReevaluated: seed.wasReevaluated,
    yesRatio: seed.yesRatio,
    userVote,
    userConfidence,
    totalJurors: packet?.totalJurors ?? 10,
    allowReevaluation: Boolean(seed.allowReevaluation),
    ledgerJurors: buildLedgerJurors(submission, packet, {
      yesRatio: seed.yesRatio,
    }),
  };
}
