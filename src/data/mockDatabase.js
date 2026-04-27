export const MOCK_MEMBERS = [
  { id: "mbr_001", alias: "care_node_21", reputation: 420, tier: "Verified", role: "Juror", joined: "2025-11-03", claimsSubmitted: 2, casesReviewed: 14 },
  { id: "mbr_002", alias: "health_relay_7", reputation: 380, tier: "Standard", role: "Contributor", joined: "2025-12-18", claimsSubmitted: 1, casesReviewed: 9 },
  { id: "mbr_003", alias: "node_anchor_k", reputation: 510, tier: "Verified", role: "Juror", joined: "2025-10-01", claimsSubmitted: 3, casesReviewed: 22 },
  { id: "mbr_004", alias: "mesh_relay_3", reputation: 342, tier: "Standard", role: "Contributor", joined: "2026-01-10", claimsSubmitted: 2, casesReviewed: 3 },
  { id: "mbr_005", alias: "cipher_peer_9", reputation: 455, tier: "Verified", role: "Juror", joined: "2025-09-21", claimsSubmitted: 1, casesReviewed: 16 },
  { id: "mbr_006", alias: "clinic_mesh_5", reputation: 398, tier: "Standard", role: "Juror", joined: "2025-12-30", claimsSubmitted: 0, casesReviewed: 11 },
  { id: "mbr_007", alias: "vital_grid_8", reputation: 476, tier: "Verified", role: "Contributor", joined: "2025-10-14", claimsSubmitted: 4, casesReviewed: 7 },
  { id: "mbr_008", alias: "pulse_anchor_2", reputation: 288, tier: "Basic", role: "Contributor", joined: "2026-02-01", claimsSubmitted: 1, casesReviewed: 2 },
  { id: "mbr_009", alias: "triage_peer_4", reputation: 532, tier: "Verified", role: "Juror", joined: "2025-08-19", claimsSubmitted: 2, casesReviewed: 27 },
  { id: "mbr_010", alias: "ledger_care_6", reputation: 364, tier: "Standard", role: "Contributor", joined: "2026-01-22", claimsSubmitted: 2, casesReviewed: 4 },
  { id: "mbr_011", alias: "jury_mesh_11", reputation: 491, tier: "Verified", role: "Juror", joined: "2025-09-04", claimsSubmitted: 0, casesReviewed: 18 },
  { id: "mbr_012", alias: "safe_channel_10", reputation: 319, tier: "Standard", role: "Contributor", joined: "2026-02-14", claimsSubmitted: 1, casesReviewed: 5 },
  { id: "mbr_013", alias: "consensus_node_1", reputation: 430, tier: "Verified", role: "Juror", joined: "2025-11-26", claimsSubmitted: 2, casesReviewed: 15 },
  { id: "mbr_014", alias: "med_peer_13", reputation: 402, tier: "Standard", role: "Juror", joined: "2025-10-29", claimsSubmitted: 1, casesReviewed: 12 },
  { id: "mbr_015", alias: "signal_anchor_12", reputation: 350, tier: "Standard", role: "Contributor", joined: "2026-01-06", claimsSubmitted: 3, casesReviewed: 3 },
  { id: "mbr_016", alias: "cipher_relay_14", reputation: 540, tier: "Verified", role: "Juror", joined: "2025-07-30", claimsSubmitted: 2, casesReviewed: 30 },
  { id: "mbr_017", alias: "caseflow_peer_15", reputation: 468, tier: "Verified", role: "Juror", joined: "2025-09-16", claimsSubmitted: 1, casesReviewed: 19 },
  { id: "mbr_018", alias: "care_bridge_16", reputation: 301, tier: "Basic", role: "Contributor", joined: "2026-03-03", claimsSubmitted: 1, casesReviewed: 1 },
  { id: "mbr_019", alias: "jury_anchor_17", reputation: 447, tier: "Verified", role: "Juror", joined: "2025-10-07", claimsSubmitted: 0, casesReviewed: 13 },
  { id: "mbr_020", alias: "medmesh_peer_18", reputation: 525, tier: "Verified", role: "Juror", joined: "2025-08-11", claimsSubmitted: 2, casesReviewed: 24 },
];

export const MOCK_CLAIMS = [
  { id: "C1776761918", memberId: "mbr_004", complaint: "Appendix surgery", dateFiled: "2026-04-18", status: "Under Jury Review", juryPanel: 8, juryVoted: 5, progress: 56, estimatedCost: 120000, treatment: "Emergency surgery", category: "Emergency" },
  { id: "C1776763980", memberId: "mbr_007", complaint: "Chronic back pain treatment", dateFiled: "2026-04-15", status: "Approved", juryPanel: 8, juryVoted: 8, progress: 100, estimatedCost: 45000, treatment: "Physiotherapy course", category: "Ongoing" },
  { id: "C1776764011", memberId: "mbr_010", complaint: "Migraine recurrence", dateFiled: "2026-04-17", status: "Under Jury Review", juryPanel: 8, juryVoted: 6, progress: 68, estimatedCost: 18000, treatment: "Neurology consult + meds", category: "Ongoing" },
  { id: "C1776764222", memberId: "mbr_015", complaint: "Fracture cast follow-up", dateFiled: "2026-04-12", status: "Approved", juryPanel: 8, juryVoted: 8, progress: 100, estimatedCost: 24000, treatment: "Orthopedic follow-up", category: "Planned" },
  { id: "C1776764355", memberId: "mbr_012", complaint: "Cardiac screening", dateFiled: "2026-04-11", status: "Denied", juryPanel: 8, juryVoted: 8, progress: 100, estimatedCost: 32000, treatment: "Advanced diagnostics", category: "Planned" },
  { id: "C1776764471", memberId: "mbr_008", complaint: "Post-op infection review", dateFiled: "2026-04-19", status: "Re-evaluation", juryPanel: 8, juryVoted: 4, progress: 44, estimatedCost: 56000, treatment: "Infection control protocol", category: "Emergency" },
  { id: "C1776764555", memberId: "mbr_002", complaint: "Pediatric fever admission", dateFiled: "2026-04-20", status: "Under Jury Review", juryPanel: 8, juryVoted: 3, progress: 34, estimatedCost: 22000, treatment: "Observation + tests", category: "Emergency" },
  { id: "C1776764622", memberId: "mbr_018", complaint: "Dental extraction", dateFiled: "2026-04-16", status: "Approved", juryPanel: 8, juryVoted: 8, progress: 100, estimatedCost: 9000, treatment: "Extraction procedure", category: "Planned" },
  { id: "C1776764702", memberId: "mbr_005", complaint: "Hypertension follow-up", dateFiled: "2026-04-10", status: "Denied", juryPanel: 8, juryVoted: 8, progress: 100, estimatedCost: 12000, treatment: "Lifestyle + medication review", category: "Ongoing" },
  { id: "C1776764810", memberId: "mbr_014", complaint: "Spine MRI and consult", dateFiled: "2026-04-18", status: "Re-evaluation", juryPanel: 8, juryVoted: 5, progress: 58, estimatedCost: 37000, treatment: "MRI + specialist consult", category: "Ongoing" },
  { id: "C1776764923", memberId: "mbr_016", complaint: "Diabetes management plan", dateFiled: "2026-04-13", status: "Approved", juryPanel: 8, juryVoted: 8, progress: 100, estimatedCost: 28000, treatment: "Quarterly management", category: "Ongoing" },
  { id: "C1776765019", memberId: "mbr_019", complaint: "Knee ligament tear", dateFiled: "2026-04-19", status: "Under Jury Review", juryPanel: 8, juryVoted: 2, progress: 27, estimatedCost: 89000, treatment: "Arthroscopic repair", category: "Emergency" },
  { id: "C1776765190", memberId: "mbr_011", complaint: "ENT surgery second opinion", dateFiled: "2026-04-14", status: "Denied", juryPanel: 8, juryVoted: 8, progress: 100, estimatedCost: 41000, treatment: "Surgical consultation", category: "Planned" },
  { id: "C1776765300", memberId: "mbr_013", complaint: "Asthma flare hospitalization", dateFiled: "2026-04-20", status: "Under Jury Review", juryPanel: 8, juryVoted: 4, progress: 49, estimatedCost: 26000, treatment: "Respiratory stabilization", category: "Emergency" },
  { id: "C1776765412", memberId: "mbr_001", complaint: "Eye surgery follow-up", dateFiled: "2026-04-09", status: "Re-evaluation", juryPanel: 8, juryVoted: 6, progress: 63, estimatedCost: 34000, treatment: "Retinal follow-up", category: "Planned" },
];

export const MOCK_JURY_ASSIGNMENTS = [
  { caseId: "C1776761918", jurorIds: ["mbr_001", "mbr_003", "mbr_006", "mbr_009", "mbr_011", "mbr_014", "mbr_017", "mbr_020"], juryPanel: 8, juryVoted: 5 },
  { caseId: "C1776764011", jurorIds: ["mbr_003", "mbr_005", "mbr_006", "mbr_009", "mbr_013", "mbr_016", "mbr_017", "mbr_019"], juryPanel: 8, juryVoted: 6 },
  { caseId: "C1776764471", jurorIds: ["mbr_001", "mbr_006", "mbr_009", "mbr_011", "mbr_013", "mbr_016", "mbr_019", "mbr_020"], juryPanel: 8, juryVoted: 4 },
  { caseId: "C1776764555", jurorIds: ["mbr_003", "mbr_005", "mbr_009", "mbr_014", "mbr_016", "mbr_017", "mbr_019", "mbr_020"], juryPanel: 8, juryVoted: 3 },
  { caseId: "C1776764810", jurorIds: ["mbr_001", "mbr_003", "mbr_009", "mbr_011", "mbr_014", "mbr_017", "mbr_019", "mbr_020"], juryPanel: 8, juryVoted: 5 },
  { caseId: "C1776765019", jurorIds: ["mbr_003", "mbr_005", "mbr_006", "mbr_011", "mbr_013", "mbr_016", "mbr_017", "mbr_020"], juryPanel: 8, juryVoted: 2 },
  { caseId: "C1776765300", jurorIds: ["mbr_001", "mbr_005", "mbr_006", "mbr_009", "mbr_011", "mbr_014", "mbr_019", "mbr_020"], juryPanel: 8, juryVoted: 4 },
  { caseId: "C1776765412", jurorIds: ["mbr_003", "mbr_006", "mbr_009", "mbr_011", "mbr_013", "mbr_016", "mbr_017", "mbr_019"], juryPanel: 8, juryVoted: 6 },
];

export const MOCK_POOL = {
  totalReserve: 3100000,
  stability: 72,
  activeClaims: 38,
  currency: "INR",
};

export const MOCK_ACTIVITY = [
  { message: "3 claims approved today", time: "2s ago" },
  { message: "Pool dropped by 2%", time: "17s ago" },
  { message: "Jury assigned to case #A392", time: "32s ago" },
  { message: "Reserve recovered by 1.2%", time: "1h ago" },
];

export function addMockClaim(claim) {
  MOCK_CLAIMS.unshift(claim);
}

export function incrementJuryVote(caseId) {
  const assignment = MOCK_JURY_ASSIGNMENTS.find((a) => a.caseId === caseId);
  if (!assignment) return null;
  assignment.juryVoted = Math.min(assignment.juryPanel, assignment.juryVoted + 1);
  const claim = MOCK_CLAIMS.find((c) => c.id === caseId);
  if (claim) {
    claim.juryVoted = assignment.juryVoted;
    claim.progress = Math.min(100, Math.round((assignment.juryVoted / assignment.juryPanel) * 100));
    if (claim.juryVoted >= claim.juryPanel) {
      claim.status = "Approved";
      claim.progress = 100;
    }
  }
  return assignment;
}
