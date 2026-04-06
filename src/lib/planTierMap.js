/**
 * Maps pricing card plan ids to backend member tiers.
 */
export function planIdToTier(planId) {
  switch (planId) {
    case "basic":
      return "contributor";
    case "standard":
      return "supporter";
    case "premium":
      return "sustainer";
    default:
      return "contributor";
  }
}
