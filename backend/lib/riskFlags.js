const ALWAYS_JURY = new Set(["Z51.1", "C80.1", "Z94.0", "Z94.1", "Z94.4"]);

export function checkRiskFlags(icd10_code) {
  return ALWAYS_JURY.has(icd10_code);
}
