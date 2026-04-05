export function evaluatePoolHealth() {
  const RESERVE_MONTHS = 6;
  const poolSnapshot = {
    currentBalance: 7794000,
    avgMonthlyClaims: 1200000,
    totalMembers: 1000,
    avgContribution: 1299,
  };

  const minimumReserve = poolSnapshot.avgMonthlyClaims * RESERVE_MONTHS;
  const reserveRatio = poolSnapshot.currentBalance / minimumReserve;
  const roundedReserveRatio = Number(reserveRatio.toFixed(2));

  if (reserveRatio > 1.0) {
    return {
      healthLevel: "healthy",
      reserveRatio: roundedReserveRatio,
      currentBalance: poolSnapshot.currentBalance,
      minimumReserve,
      costThreshold: 100000,
      extraJuryThreshold: null,
      contributionMultiplier: 1.0,
      message: "Pool is healthy. Normal routing active.",
    };
  }

  if (reserveRatio >= 0.6) {
    return {
      healthLevel: "cautious",
      reserveRatio: roundedReserveRatio,
      currentBalance: poolSnapshot.currentBalance,
      minimumReserve,
      costThreshold: 50000,
      extraJuryThreshold: 40000,
      contributionMultiplier: 1.0,
      message:
        "Pool is in cautious mode. Claims above ₹40,000 will go through an additional jury panel.",
    };
  }

  return {
    healthLevel: "critical",
    reserveRatio: roundedReserveRatio,
    currentBalance: poolSnapshot.currentBalance,
    minimumReserve,
    costThreshold: 25000,
    extraJuryThreshold: 0,
    contributionMultiplier: 1.2,
    message:
      "Pool is in critical mode. All jury cases require a second panel. Contributions will increase by 20% next cycle.",
  };
}
