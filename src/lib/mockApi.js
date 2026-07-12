import { getSession, saveSession } from "./session.js";

const JURY_CASES_KEY = "cipher_jury_cases";
const VOTES_KEY = "cipher_votes";
const CLAIMS_KEY = "cipher_claims_demo";

const DEFAULT_RP = {
  newcomer: { min: 0, level: "newcomer" },
  contributor: { min: 50, level: "contributor" },
  trusted: { min: 150, level: "trusted" },
  expert: { min: 400, level: "expert" },
};

function tierToRpLevel(tier) {
  const t = String(tier || "TRUSTED").toUpperCase();
  if (t === "NEWCOMER") return "newcomer";
  if (t === "CONTRIBUTOR") return "contributor";
  if (t === "EXPERT") return "expert";
  return "trusted";
}

function delay(ms = 80) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveClaimPath(payload) {
  const text = String(payload.what_happened || payload.whatHappened || "").trim().toLowerCase();
  return text.includes("fever") ? "PATH_A" : "PATH_B";
}

export function claimRouteForWhatHappened(whatHappened) {
  const isFastTrack = String(whatHappened || "").trim().toLowerCase().includes("fever");
  return {
    path: isFastTrack ? "PATH_A" : "PATH_B",
    reason: isFastTrack ? "fever_fast_track_eligible" : "requires_jury_review",
    rp_awarded: isFastTrack ? 5 : 10,
  };
}

function nextJuryCaseId() {
  const n = Number(localStorage.getItem("cipher_jury_case_seq") || "1000") + 1;
  localStorage.setItem("cipher_jury_case_seq", String(n));
  return n;
}

function readJuryCases() {
  try {
    return JSON.parse(localStorage.getItem(JURY_CASES_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeJuryCases(cases) {
  localStorage.setItem(JURY_CASES_KEY, JSON.stringify(cases));
}

export function getMemberRp(anonymousId) {
  const session = getSession();
  const pts = Number(session.reputationPoints ?? 150);
  return {
    anonymous_id: anonymousId || session.anonymousId,
    reputation_points: pts,
    rp_level: tierToRpLevel(session.tier),
  };
}

export function getJurorStatus(anonymousId) {
  const isJuror =
    localStorage.getItem("cipher_is_juror") === "true" ||
    Number(getMemberRp(anonymousId).reputation_points) >= DEFAULT_RP.trusted.min;
  return { is_juror: isJuror, anonymous_id: anonymousId };
}

export async function mockCreateIdentity(alias, password) {
  await delay();
  const anonymousId = `mbr_${Math.random().toString(36).slice(2, 10)}`;
  const session = {
    anonymousId,
    encryptionKey: password || Math.random().toString(36).slice(2, 18),
    alias: alias || anonymousId,
    reputationPoints: 0,
    tier: "NEWCOMER",
    joinedAt: new Date().toISOString(),
  };
  saveSession(session);
  try {
    localStorage.setItem("cipher_member_id", anonymousId);
    localStorage.setItem("cipher_alias", session.alias);
  } catch {
    // best-effort
  }
  return { anonymousId, encryptionKey: session.encryptionKey };
}

export async function mockSaveHealthProfile(anonymousId, encryptionKey, healthData) {
  await delay();
  const prev = getSession();
  saveSession({
    ...prev,
    anonymousId: anonymousId || prev.anonymousId,
    encryptionKey: encryptionKey || prev.encryptionKey,
    healthProfile: healthData,
  });
  return { ok: true };
}

export async function mockSetTier(anonymousId, tier) {
  await delay();
  const prev = getSession();
  const tierUpper = String(tier || "standard").toUpperCase();
  saveSession({
    ...prev,
    anonymousId: anonymousId || prev.anonymousId,
    tier: tierUpper === "BASIC" ? "NEWCOMER" : tierUpper === "PREMIUM" ? "EXPERT" : "TRUSTED",
  });
  return { ok: true };
}

export async function mockUploadDocuments(anonymousId, files, onProgress) {
  await delay(120);
  if (typeof onProgress === "function") {
    onProgress(50);
    await delay(80);
    onProgress(100);
  }
  return {
    uploaded: files?.length ?? 0,
    anonymousId,
    skipped: !files?.length,
  };
}

export async function mockSubmitClaim(payload) {
  await delay(150);
  const numericCost = Number(payload.cost_inr) || 0;
  const path = resolveClaimPath(payload);
  const claimId = `CLM_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const claims = JSON.parse(localStorage.getItem(CLAIMS_KEY) || "[]");
  const newClaim = {
    id: claimId,
    ...payload,
    status: "pending",
    submittedAt: new Date().toISOString(),
    path,
    rp_awarded: path === "PATH_A" ? 5 : 10,
  };
  claims.unshift(newClaim);
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims.slice(0, 20)));
  return {
    claim_id: claimId,
    path,
    reason: path === "PATH_B" ? "requires_jury_review" : "fever_fast_track_eligible",
    rp_awarded: newClaim.rp_awarded,
    matched_procedure: numericCost
      ? { max_cost_inr: Math.round(numericCost * 1.15) }
      : null,
  };
}

export async function mockRouteClaim(payload) {
  await delay(80);
  const path = resolveClaimPath(payload);
  return {
    path,
    reason: path === "PATH_B" ? "requires_jury_review" : "fever_fast_track_eligible",
  };
}

export async function mockGetClaim(claimId) {
  await delay(80);
  const idNum = Number(claimId);
  const claims = JSON.parse(localStorage.getItem(CLAIMS_KEY) || "[]");
  const stored = claims.find(
    (c) => String(c.id) === String(claimId) || String(c.id).replace(/\D/g, "") === String(idNum)
  );
  if (stored) {
    return {
      id: idNum > 0 ? idNum : stored.id,
      what_happened: stored.whatHappened || stored.complaint || stored.what_happened || "Claim details",
      cost_inr: Number(String(stored.costDetails || stored.estimatedCost || "0").replace(/[^\d.]/g, "")) || 0,
      payload: stored,
      status: stored.status || "Under Jury Review",
      jury_case_id: stored.jury_case_id ?? null,
    };
  }
  return {
    id: idNum || 1,
    what_happened: "Demo claim for jury review",
    cost_inr: 85000,
    payload: { typeOfIssue: "General", recommendedTreatment: "Standard care protocol" },
    status: "Under Jury Review",
    jury_case_id: null,
  };
}

export async function mockAssignJuryCase(claim_id) {
  await delay(100);
  const claimId = Number(claim_id);
  const cases = readJuryCases();
  const existing = cases.find((c) => c.claim_id === claimId);
  if (existing) return existing.jury_case_id;

  const jury_case_id = nextJuryCaseId();
  cases.push({
    jury_case_id,
    claim_id: claimId,
    created_at: new Date().toISOString(),
    votes: [],
  });
  writeJuryCases(cases);
  return jury_case_id;
}

export async function mockSubmitJuryVote(juryCaseId, body) {
  await delay(120);
  const votes = JSON.parse(localStorage.getItem(VOTES_KEY) || "[]");
  const entry = {
    juryCaseId: Number(juryCaseId),
    ...body,
    timestamp: new Date().toISOString(),
  };
  votes.push(entry);
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));

  const cases = readJuryCases();
  const jc = cases.find((c) => c.jury_case_id === Number(juryCaseId));
  if (jc) {
    jc.votes = jc.votes || [];
    jc.votes.push(entry);
    writeJuryCases(cases);
  }

  const vote = body.vote || "approved";
  const demoOutcome = body.demo_outcome;
  const final_decision =
    demoOutcome === "re_evaluation"
      ? "re_evaluation"
      : vote === "approved"
        ? "approved"
        : "denied";

  const approve_count = final_decision === "approved" ? 6 : final_decision === "denied" ? 2 : 4;
  return {
    jury_case_id: Number(juryCaseId),
    final_decision,
    votes_required: 8,
    approve_count,
    deny_count: 8 - approve_count,
    confidence_avg: Number(body.confidence) || 0.72,
    decided_at: new Date().toISOString(),
    rp_awarded: 8,
    votes: [
      { juror: "juror_01", vote: "approved", confidence: 0.85 },
      { juror: "juror_02", vote: final_decision === "denied" ? "denied" : "approved", confidence: 0.7 },
    ],
  };
}

export async function mockGetJuryCase(juryCaseId) {
  await delay(80);
  const id = Number(juryCaseId);
  const cases = readJuryCases();
  const jc = cases.find((c) => c.jury_case_id === id);
  const votes = jc?.votes?.length ? jc.votes : JSON.parse(localStorage.getItem(VOTES_KEY) || "[]").filter(
    (v) => v.juryCaseId === id
  );
  const lastVote = votes[votes.length - 1];
  const final_decision =
    lastVote?.demo_outcome === "re_evaluation"
      ? "re_evaluation"
      : lastVote?.vote === "denied"
        ? "denied"
        : "approved";

  return {
    jury_case_id: id,
    claim_id: jc?.claim_id ?? 1,
    final_decision,
    votes_required: 8,
    approve_count: final_decision === "approved" ? 6 : 2,
    deny_count: final_decision === "approved" ? 2 : 6,
    confidence_avg: Number(lastVote?.confidence) || 0.72,
    decided_at: new Date().toISOString(),
    rp_awarded: 8,
    votes: votes.length
      ? votes.map((v, i) => ({
          juror: `juror_${String(i + 1).padStart(2, "0")}`,
          vote: v.vote,
          confidence: v.confidence,
        }))
      : [
          { juror: "juror_01", vote: "approved", confidence: 0.85 },
          { juror: "juror_02", vote: "approved", confidence: 0.7 },
        ],
  };
}
