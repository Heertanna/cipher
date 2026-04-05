/**
 * Cipher — Juror simulation + decision engine (no external deps).
 * Final outcome uses vote distribution, weighted conviction, and confidence spread.
 */

// ─── Utils ───────────────────────────────────────────────────────────────────

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

/** Fisher–Yates shuffle (mutates copy) */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Population variance of confidence values */
function populationVariance(values) {
  if (values.length === 0) return 0;
  const m = mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length;
}

// ─── 1. Juror generator ─────────────────────────────────────────────────────

const SCENARIOS = new Set([
  "strong_yes",
  "strong_no",
  "split",
  "uncertain_yes",
  "uncertain_no",
  "random",
]);

/**
 * @param {number} count
 * @param {string} scenario strong_yes | strong_no | split | uncertain_yes | uncertain_no | random
 * @returns {{ id: string, vote: "YES"|"NO", confidence: number }[]}
 */
export function generateMockJurors(count, scenario) {
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const s = SCENARIOS.has(scenario) ? scenario : "random";
  const jurors = [];

  for (let i = 0; i < n; i++) {
    let vote = "YES";
    let confidence = 0.6;

    switch (s) {
      case "strong_yes": {
        const leanYes = i < Math.ceil(n * 0.82) + (Math.random() < 0.08 ? 1 : 0);
        vote = leanYes && Math.random() < 0.92 ? "YES" : "NO";
        confidence =
          vote === "YES"
            ? randomInRange(0.72, 0.95)
            : randomInRange(0.45, 0.72);
        break;
      }
      case "strong_no": {
        const leanNo = i < Math.ceil(n * 0.82) + (Math.random() < 0.08 ? 1 : 0);
        vote = leanNo && Math.random() < 0.92 ? "NO" : "YES";
        confidence =
          vote === "NO"
            ? randomInRange(0.72, 0.95)
            : randomInRange(0.45, 0.72);
        break;
      }
      case "split": {
        vote = Math.random() < 0.5 ? "YES" : "NO";
        confidence = randomInRange(0.45, 0.78);
        break;
      }
      case "uncertain_yes": {
        vote = Math.random() < 0.58 ? "YES" : "NO";
        confidence = randomInRange(0.28, 0.52);
        break;
      }
      case "uncertain_no": {
        vote = Math.random() < 0.58 ? "NO" : "YES";
        confidence = randomInRange(0.28, 0.52);
        break;
      }
      case "random":
      default: {
        const t = Math.random();
        if (t < 0.35) {
          vote = Math.random() < 0.72 ? "YES" : "NO";
          confidence = randomInRange(0.65, 0.92);
        } else if (t < 0.65) {
          vote = Math.random() < 0.55 ? "YES" : "NO";
          confidence = randomInRange(0.45, 0.72);
        } else {
          vote = Math.random() < 0.5 ? "YES" : "NO";
          confidence = randomInRange(0.25, 0.55);
        }
        break;
      }
    }

    jurors.push({
      id: `j-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
      vote,
      confidence: clamp01(confidence),
    });
  }

  return shuffle(jurors);
}

// ─── 2. Combine with real user ────────────────────────────────────────────────

/**
 * @param {{ vote: "YES"|"NO", confidence: number }[]} mockJurors
 * @param {"YES"|"NO"} userVote
 * @param {number} userConfidence 0–1
 */
export function combineJurors(mockJurors, userVote, userConfidence) {
  const u = String(userVote).toUpperCase() === "NO" ? "NO" : "YES";
  const c = clamp01(Number(userConfidence) || 0.5);
  return [
    ...mockJurors.map((j) => ({ ...j })),
    {
      id: "user",
      vote: u,
      confidence: c,
    },
  ];
}

// ─── 3. Metrics ─────────────────────────────────────────────────────────────

export function getMetrics(jurors) {
  const list = Array.isArray(jurors) ? jurors : [];
  let yesVotes = 0;
  let noVotes = 0;
  let weightedYes = 0;
  let weightedNo = 0;
  const confidences = [];

  for (const j of list) {
    const conf = clamp01(j.confidence);
    confidences.push(conf);
    if (j.vote === "YES") {
      yesVotes += 1;
      weightedYes += conf;
    } else {
      noVotes += 1;
      weightedNo += conf;
    }
  }

  const total = yesVotes + noVotes;
  const yesRatio = total ? yesVotes / total : 0;
  const noRatio = total ? noVotes / total : 0;
  const avgConfidence = confidences.length ? mean(confidences) : 0;
  const confidenceVariance = populationVariance(confidences);

  return {
    yesVotes,
    noVotes,
    yesRatio,
    noRatio,
    avgConfidence,
    weightedYes,
    weightedNo,
    confidenceVariance,
  };
}

// ─── 4. Confidence level ─────────────────────────────────────────────────────

export function getConfidenceLevel(avgConfidence) {
  const a = Number(avgConfidence) || 0;
  if (a > 0.7) return "High";
  if (a >= 0.5) return "Moderate";
  return "Low";
}

// ─── Tunable threshold ─────────────────────────────────────────────────────

export const VARIANCE_REEVAL_THRESHOLD = 0.05;

// ─── 5. Re-evaluation gate ───────────────────────────────────────────────────

export function shouldReevaluate(metrics) {
  const {
    yesVotes,
    noVotes,
    yesRatio,
    noRatio,
    avgConfidence,
    weightedYes,
    weightedNo,
    confidenceVariance,
  } = metrics;

  if (avgConfidence < 0.5) {
    return { reevaluate: true, reason: "Low confidence across jurors" };
  }

  if (Math.abs(yesRatio - noRatio) < 0.2) {
    return { reevaluate: true, reason: "Juror opinions are divided" };
  }

  if (yesVotes > noVotes && weightedNo > weightedYes) {
    return { reevaluate: true, reason: "Minority showed stronger conviction" };
  }
  if (noVotes > yesVotes && weightedYes > weightedNo) {
    return { reevaluate: true, reason: "Minority showed stronger conviction" };
  }

  if (confidenceVariance > VARIANCE_REEVAL_THRESHOLD) {
    return { reevaluate: true, reason: "Inconsistent confidence levels" };
  }

  const majorityRatio = Math.max(yesRatio, noRatio);
  if (majorityRatio < 0.65) {
    return { reevaluate: true, reason: "Weak majority" };
  }

  return { reevaluate: false, reason: null };
}

// ─── 6. Decision engine ───────────────────────────────────────────────────────

function finalReason(metrics, decision) {
  const level = getConfidenceLevel(metrics.avgConfidence);
  const side = decision === "APPROVE" ? "approve" : "reject";
  if (level === "High") {
    return `Clear collective signal to ${side} with strong average certainty.`;
  }
  if (level === "Moderate") {
    return `Panel leans to ${side} with moderate aggregate confidence.`;
  }
  return `Outcome favors ${side}; average certainty remains guarded.`;
}

/**
 * @returns {object} FINAL or RE_EVALUATION payload
 */
export function computeDecision(jurors) {
  const metrics = getMetrics(jurors);
  const gate = shouldReevaluate(metrics);

  if (gate.reevaluate) {
    return {
      status: "RE_EVALUATION",
      reason: gate.reason,
      metrics,
    };
  }

  const finalDecision = metrics.yesVotes > metrics.noVotes ? "APPROVE" : "REJECT";
  return {
    status: "FINAL",
    finalDecision,
    confidenceLevel: getConfidenceLevel(metrics.avgConfidence),
    reason: finalReason(metrics, finalDecision),
    metrics,
  };
}

// ─── 7. Second panel ──────────────────────────────────────────────────────────

/**
 * Regenerates a fresh panel of same size, boosts confidence slightly, returns new computeDecision result.
 */
export function runReevaluation(jurors) {
  const n = jurors.length;
  const second = generateMockJurors(n, "random").map((j) => ({
    ...j,
    id: `re-${j.id}`,
    confidence: clamp01(j.confidence * randomInRange(1.06, 1.22) + randomInRange(0.02, 0.08)),
  }));
  return computeDecision(second);
}

// ─── 8. Tests (dev / demo) ───────────────────────────────────────────────────

function logBlock(title, data) {
  console.log(`\n━━ ${title} ━━`);
  console.log(JSON.stringify(data, null, 2));
}

function runScenario(name, count, scenario, userVote, userConfidence) {
  const mock = generateMockJurors(count, scenario);
  const combined = combineJurors(mock, userVote, userConfidence);
  const metrics = getMetrics(combined);
  const decision = computeDecision(combined);

  logBlock(`${name} — jurors (${combined.length})`, combined);
  logBlock(`${name} — metrics`, metrics);
  logBlock(`${name} — decision`, decision);

  if (decision.status === "RE_EVALUATION") {
    const second = runReevaluation(combined);
    logBlock(`${name} — after simulated second panel`, second);
  }
}

export function runJurorEngineDemos() {
  console.log("\n════════ Cipher — Juror decision engine demos ════════");

  runScenario("Strong YES + user YES", 9, "strong_yes", "YES", 0.85);
  runScenario("Split panel", 10, "split", "YES", 0.55);
  runScenario("Uncertain YES (often triggers re-eval)", 10, "uncertain_yes", "NO", 0.4);
  runScenario("Strong NO + user NO", 9, "strong_no", "NO", 0.88);
  runScenario("Random baseline", 10, "random", "YES", 0.7);
}

/** Call from devtools or a dev-only import: `import { runJurorEngineDemos } from './lib/jurorDecisionEngine.js'` */
