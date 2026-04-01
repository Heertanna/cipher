import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { JuryLedgerSheet } from "./JuryLedgerSheet.jsx";
import { buildLedgerJurorsFallback } from "../lib/juryLedgerBuild.js";
import { persistVerdictToClaims } from "../lib/verdictClaimSync.js";

/** Default demo payload — replace via props or `location.state.caseResult`. */
export const DEFAULT_FINAL_VERDICT_MOCK = {
  caseId: "A392",
  finalDecision: "APPROVED",
  avgConfidence: 0.78,
  confidenceLevel: "High",
  wasReevaluated: false,
  yesRatio: 0.72,
  userVote: "APPROVED",
  userConfidence: 0.82,
  totalJurors: 10,
  allowReevaluation: false,
};

function deriveConfidenceLevel(avg) {
  if (avg > 0.7) return "High";
  if (avg >= 0.5) return "Moderate";
  return "Low";
}

/** Winning-side share (abstract; no vote counts shown). */
function winningShare(finalDecision, yesRatio) {
  const y = Math.min(1, Math.max(0, yesRatio));
  return finalDecision === "APPROVED" ? y : 1 - y;
}

function isCloseSplit(yesRatio) {
  return Math.abs(2 * yesRatio - 1) < 0.2;
}

function isStrongMajority(finalDecision, yesRatio) {
  return winningShare(finalDecision, yesRatio) > 0.65;
}

function decisionStability(finalDecision, yesRatio, avgConfidence, wasReevaluated) {
  if (wasReevaluated) return "Medium";
  if (isCloseSplit(yesRatio)) return "Low";
  const w = winningShare(finalDecision, yesRatio);
  if (w > 0.65 && avgConfidence > 0.7) return "High";
  if (avgConfidence >= 0.5) return "Medium";
  return "Low";
}

/**
 * Dynamic copy — no numeric vote breakdowns.
 */
function buildDecisionExplanation(caseResult) {
  const {
    finalDecision,
    yesRatio,
    avgConfidence,
    wasReevaluated,
  } = caseResult;

  if (wasReevaluated) {
    return "Initial responses were inconclusive. Decision finalized after secondary panel review.";
  }

  if (isCloseSplit(yesRatio)) {
    return "Juror opinions were divided. Final outcome reflects marginal consensus.";
  }

  const strong = isStrongMajority(finalDecision, yesRatio);
  const high = avgConfidence > 0.7;
  const low = avgConfidence < 0.5;
  const majority = winningShare(finalDecision, yesRatio) > 0.5;

  if (strong && high) {
    return "Jurors reached a strong consensus with high confidence.";
  }

  if (majority && low) {
    return "Decision reached with low confidence. Case showed signs of uncertainty.";
  }

  return "The collective assessment converged on a single outcome with calibrated certainty.";
}

function heroSubtext(caseResult) {
  const { finalDecision, yesRatio, wasReevaluated, avgConfidence } = caseResult;
  if (wasReevaluated) return "Decision Finalized";
  if (isCloseSplit(yesRatio)) return "Decision Finalized";
  if (isStrongMajority(finalDecision, yesRatio) && avgConfidence > 0.5) {
    return "Consensus Achieved";
  }
  return "Decision Finalized";
}

function ConfidenceVisual({ avgConfidence, levelLabel, approved }) {
  const pct = Math.round(Math.min(1, Math.max(0, avgConfidence)) * 100);
  const segments = [
    { key: "low", label: "Low", active: levelLabel === "Low" },
    { key: "mod", label: "Mod", active: levelLabel === "Moderate" },
    { key: "high", label: "High", active: levelLabel === "High" },
  ];
  const activeSeg = approved
    ? "border-[#b5ec34]/50 bg-[#b5ec34]/10 text-[#b5ec34] shadow-[0_0_20px_rgba(181,236,52,0.2)]"
    : "border-red-400/45 bg-red-500/10 text-red-300 shadow-[0_0_20px_rgba(248,113,113,0.18)]";

  return (
    <div className="space-y-4">
      <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
        <motion.div
          className={
            approved
              ? "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500/40 via-[#b5ec34]/80 to-[#b5ec34]"
              : "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-900/50 via-red-500/70 to-red-400"
          }
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          style={{
            boxShadow: approved
              ? "0 0 24px rgba(181, 236, 52, 0.45)"
              : "0 0 24px rgba(248, 113, 113, 0.4)",
          }}
        />
      </div>
      <div className="flex gap-2">
        {segments.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0.35, scale: 0.96 }}
            animate={{
              opacity: s.active ? 1 : 0.35,
              scale: s.active ? 1 : 0.96,
            }}
            transition={{ delay: 0.5 + i * 0.06 }}
            className={`flex-1 rounded-lg border py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] ${
              s.active ? activeSeg : "border-white/10 bg-white/[0.02] text-slate-500"
            }`}
          >
            {s.label}
          </motion.div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">
        Synthesized from pooled juror certainty signals
      </p>
    </div>
  );
}

export function FinalVerdictPage({
  caseResult: caseResultProp,
  onReturnDashboard,
  onViewOtherCases,
  onRequestReevaluation,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const caseResult = useMemo(() => {
    const raw = caseResultProp ?? location.state?.caseResult ?? DEFAULT_FINAL_VERDICT_MOCK;
    const avgConfidence = raw.avgConfidence;
    return {
      ...DEFAULT_FINAL_VERDICT_MOCK,
      ...raw,
      confidenceLevel: raw.confidenceLevel ?? deriveConfidenceLevel(avgConfidence),
    };
  }, [caseResultProp, location.state?.caseResult]);

  const ledgerJurors = useMemo(() => {
    if (caseResult.ledgerJurors?.length) return caseResult.ledgerJurors;
    return buildLedgerJurorsFallback(caseResult);
  }, [caseResult]);

  useEffect(() => {
    persistVerdictToClaims(caseResult);
  }, [caseResult]);

  const {
    caseId,
    finalDecision,
    avgConfidence,
    confidenceLevel,
    wasReevaluated,
    yesRatio,
    userVote,
    userConfidence,
    totalJurors,
    allowReevaluation,
  } = caseResult;

  const isApproved = finalDecision === "APPROVED";
  const accent = isApproved ? "#b5ec34" : "#f87171";
  const accentDim = isApproved ? "rgba(181,236,52,0.15)" : "rgba(248,113,113,0.12)";

  const explanation = buildDecisionExplanation(caseResult);
  const sub = heroSubtext(caseResult);
  const aligned = userVote === finalDecision;
  const stability = decisionStability(
    finalDecision,
    yesRatio,
    avgConfidence,
    wasReevaluated
  );

  const userPct = Math.round(Math.min(1, Math.max(0, userConfidence)) * 100);
  const avgPct = Math.round(Math.min(1, Math.max(0, avgConfidence)) * 100);

  const handleReturn =
    onReturnDashboard ?? (() => navigate("/juror-dashboard", { replace: true }));
  const handleOthers =
    onViewOtherCases ?? (() => navigate("/juror-dashboard", { replace: true }));

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#030306] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(181,236,52,0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(248,113,113,0.06), transparent 50%), #030306",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.04%22/%3E%3C/svg%3E')]" />

      <main className="relative z-10 mx-auto flex max-w-2xl flex-col px-5 pb-16 pt-14 sm:pt-20">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
            Cipher · Verdict
          </p>

          <div className="relative mx-auto inline-block">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-10 blur-3xl"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              style={{
                background: isApproved
                  ? "radial-gradient(circle, rgba(181,236,52,0.35) 0%, transparent 65%)"
                  : "radial-gradient(circle, rgba(248,113,113,0.3) 0%, transparent 65%)",
              }}
            />
            <motion.h1
              className="relative text-5xl font-black uppercase tracking-tight sm:text-6xl"
              style={{ color: accent, textShadow: `0 0 60px ${accentDim}` }}
              initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {finalDecision}
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-4 text-sm font-medium tracking-wide text-slate-400"
          >
            {sub}
          </motion.p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            System confidence
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <span className="text-lg font-semibold text-slate-100">{confidenceLevel}</span>
            <span className="font-mono text-sm text-slate-500">{avgPct}%</span>
          </div>
          <div className="mt-5">
            <ConfidenceVisual
              avgConfidence={avgConfidence}
              levelLabel={confidenceLevel}
              approved={isApproved}
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Decision synthesis
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-300">{explanation}</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5 }}
          className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Your alignment
          </p>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-200">
            {aligned
              ? "Your judgment aligned with the final decision."
              : "Your judgment differed from the final outcome."}
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Your confidence:{" "}
            <span className="font-mono text-slate-200">{userPct}%</span>
            <span className="text-slate-600"> · </span>
            <span className="text-slate-500">Panel average: {avgPct}%</span>
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5 }}
          className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Record
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt className="text-slate-500">Case</dt>
              <dd className="font-mono text-slate-200">#{caseId}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt className="text-slate-500">Panel size</dt>
              <dd className="text-slate-200">{totalJurors} jurors</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt className="text-slate-500">Secondary review</dt>
              <dd className="text-slate-200">{wasReevaluated ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between gap-4 pt-1">
              <dt className="text-slate-500">Decision stability</dt>
              <dd className="text-slate-200">{stability}</dd>
            </div>
          </dl>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <button
            type="button"
            onClick={() => setLedgerOpen(true)}
            className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/95 shadow-[0_0_22px_rgba(34,211,238,0.15)] transition hover:border-cyan-400/50 hover:bg-cyan-500/16 hover:shadow-[0_0_30px_rgba(34,211,238,0.22)] active:scale-[0.98]"
          >
            Jury Ledger
          </button>
          <button
            type="button"
            onClick={handleReturn}
            className="rounded-full border border-[#b5ec34]/50 bg-[#b5ec34] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#050505] shadow-[0_0_28px_rgba(181,236,52,0.25)] transition hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(181,236,52,0.35)] active:scale-[0.98]"
          >
            Return to Dashboard
          </button>
          <button
            type="button"
            onClick={handleOthers}
            className="rounded-full border border-white/20 bg-white/[0.05] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200 transition hover:border-white/35 hover:bg-white/[0.09] active:scale-[0.98]"
          >
            View Other Cases
          </button>
          {allowReevaluation ? (
            <button
              type="button"
              onClick={() => onRequestReevaluation?.()}
              className="rounded-full border border-amber-500/35 bg-amber-500/10 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-200/95 transition hover:border-amber-400/50 hover:bg-amber-500/15 active:scale-[0.98]"
            >
              Request Re-evaluation
            </button>
          ) : null}
        </motion.div>
      </main>

      <JuryLedgerSheet
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        caseId={caseId}
        jurors={ledgerJurors}
      />
    </div>
  );
}

export default FinalVerdictPage;
