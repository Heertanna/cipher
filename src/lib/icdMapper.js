const KEYWORD_TO_ICD10 = {
  cataract: "H26.9",
  dengue: "A90",
  gastritis: "K29.7",
  pneumonia: "J18.9",
  conjunctivitis: "H10.9",
  "back pain": "M54.5",
  fracture: "S52.9",
  chickenpox: "B01.9",
  "respiratory infection": "J06.9",
  gastroenteritis: "K52.9",
  "normal delivery": "O80",
  "health checkup": "Z00.0",
};

export function mapToICD10(illnessDescription) {
  const normalizedDescription = String(illnessDescription ?? "").toLowerCase();
  if (!normalizedDescription.trim()) {
    return null;
  }

  for (const [keyword, icdCode] of Object.entries(KEYWORD_TO_ICD10)) {
    if (normalizedDescription.includes(keyword)) {
      return icdCode;
    }
  }

  return null;
}

export function getFlagReason(flag, guardrails) {
  if (flag === "UNKNOWN_PROCEDURE") {
    return "This condition is not on our pre-approved list and requires jury review";
  }

  if (flag === "EXCEEDS_PROCEDURE_MAX") {
    return "The claimed cost exceeds the maximum allowed for this procedure";
  }

  if (flag === "EXCEEDS_COST_THRESHOLD") {
    const healthLevel = guardrails?.healthLevel ?? "current";
    const costThreshold = guardrails?.costThreshold ?? 0;
    return `The pool is currently in ${healthLevel} mode — claims above ₹${costThreshold} require jury review`;
  }

  if (flag === "RISK_FLAG") {
    return "This procedure always requires peer jury review";
  }

  return flag;
}
