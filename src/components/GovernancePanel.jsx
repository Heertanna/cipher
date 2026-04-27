import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";
import {
  PROTOCOL_DASHBOARD_CARD,
  PROTOCOL_PAGE_BACKGROUND,
} from "../lib/protocolPageBackground.js";

const SUPPORT = "rgba(34,197,94,0.85)";
const OPPOSE = "rgba(248,113,113,0.85)";

const DEMO_PROPOSALS = [
  {
    id: "1",
    title: "Raise confidence threshold from 0.6 to 0.75",
    proposer: "Reviewer #a3f8c2b1",
    description:
      "A stricter confidence requirement will reduce ambiguous decisions and improve case quality.",
    currentLabel: "0.6",
    proposedLabel: "0.75",
    support: 12,
    oppose: 4,
    timeLeft: "3 days",
  },
  {
    id: "2",
    title: "Add 'Dental extraction' to Path A approved procedures",
    proposer: "Reviewer #9d2e1a7f",
    description:
      "Dental extraction is a standard, low-cost procedure that meets all Path A criteria. Recommend automatic approval.",
    currentLabel: "Path B (jury required)",
    proposedLabel: "Path A (auto-approve under ₹8,000)",
    support: 8,
    oppose: 2,
    timeLeft: "5 days",
  },
  {
    id: "3",
    title: "Reduce jury size from 8 to 5 for low-cost claims",
    proposer: "Reviewer #b7c1e4d2",
    description:
      "Claims under ₹15,000 don't need 8 jurors. A panel of 5 speeds up decisions without sacrificing quality.",
    currentLabel: "8 jurors for all claims",
    proposedLabel: "5 jurors for claims under ₹15,000",
    support: 15,
    oppose: 7,
    timeLeft: "1 day",
  },
];

const PROTOCOL_PARAMETERS = [
  {
    id: "confidence",
    label: "Confidence Threshold",
    current: "0.60",
    min: 0.5,
    max: 0.8,
    numeric: true,
    displayValue: 0.6,
    rangeLabel: "0.5 (lenient) → 0.8 (strict)",
  },
  {
    id: "majority",
    label: "Majority Threshold",
    current: "60%",
    min: 50,
    max: 75,
    numeric: true,
    displayValue: 60,
    rangeLabel: "50% → 75%",
  },
  {
    id: "jury",
    label: "Jury Size",
    current: "8 reviewers",
    min: 5,
    max: 10,
    numeric: true,
    displayValue: 8,
    rangeLabel: "5 → 10",
  },
  {
    id: "window",
    label: "Decision Time Window",
    current: "48 hours",
    min: 6,
    max: 48,
    numeric: true,
    displayValue: 48,
    rangeLabel: "6 → 48 hours",
  },
  {
    id: "cost",
    label: "Cost Guardrail — Extra Review Threshold",
    current: "₹1,00,000",
    min: 0,
    max: 1,
    numeric: false,
    rangeLabel: "Claims above this get second jury in cautious pool mode",
  },
  {
    id: "reeval",
    label: "Re-evaluation Sensitivity",
    current: "Low confidence < 0.60",
    min: 0.5,
    max: 0.75,
    numeric: true,
    displayValue: 0.6,
    rangeLabel: "0.5 (lenient) → 0.75 (strict)",
  },
];

const PARAMETERS = [
  { name: "Confidence Threshold", value: 0.6, min: 0.5, max: 0.8, unit: "", decimals: 2, desc: "Min jury confidence to pass a claim" },
  { name: "Majority Threshold", value: 60, min: 50, max: 75, unit: "%", decimals: 0, desc: "Share of yes-votes needed to approve" },
  { name: "Jury Size", value: 8, min: 5, max: 10, unit: " reviewers", decimals: 0, desc: "Peers assigned to each case" },
  { name: "Decision Window", value: 48, min: 6, max: 48, unit: " hours", decimals: 0, desc: "Time jurors have to cast a vote" },
  { name: "Cost Guardrail", value: 100000, min: 50000, max: 500000, unit: "", decimals: 0, desc: "Claims above this get extra scrutiny", rupee: true },
  {
    name: "Re-evaluation Sensitivity",
    value: 0.42,
    min: 0.3,
    max: 0.75,
    unit: "",
    decimals: 2,
    desc: "How easily a case triggers re-review",
  },
];

function ParameterGaugeCard({ param, index }) {
  const pct = Math.min(100, Math.max(0, Math.round(((param.value - param.min) / (param.max - param.min)) * 100)));
  const isAtMax = pct >= 95;
  const isAtMin = pct <= 5;
  const statusText = isAtMax ? "AT CEILING" : isAtMin ? "AT FLOOR" : "STABLE";
  const statusColor = isAtMax || isAtMin ? "rgba(255,180,0,0.8)" : "#b4c814";
  const statusBg = isAtMax || isAtMin ? "rgba(255,180,0,0.08)" : "rgba(180,200,20,0.08)";

  const displayVal = param.rupee
    ? `₹${param.value.toLocaleString("en-IN")}`
    : `${param.decimals > 0 ? param.value.toFixed(param.decimals) : param.value}${param.unit}`;

  function dialSVG() {
    const size = 100;
    const r = 36;
    const cx = 50;
    const cy = 54;
    const startAngle = -210;
    const endAngle = 30;
    const totalArc = endAngle - startAngle;
    const fillAngle = startAngle + totalArc * (pct / 100);

    function polarToXY(angle, radius) {
      const rad = (angle * Math.PI) / 180;
      return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    }

    function arcPath(fromAngle, toAngle, radius) {
      const s = polarToXY(fromAngle, radius);
      const e = polarToXY(toAngle, radius);
      const large = Math.abs(toAngle - fromAngle) > 180 ? 1 : 0;
      return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
    }

    const needle = polarToXY(fillAngle, r - 8);

    return (
      <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.85}`}>
        <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
        <path d={arcPath(startAngle, fillAngle, r)} fill="none" stroke="#b4c814" strokeWidth="5" strokeLinecap="round" />
        <circle cx={needle.x} cy={needle.y} r="4" fill="#b4c814" />
        <circle cx={cx} cy={cy} r="4" fill="rgba(255,255,255,0.1)" />
      </svg>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: "fadeUp 0.4s ease both",
        animationDelay: `${index * 0.08}s`,
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(180,200,20,0.1)";
        e.currentTarget.style.borderColor = "rgba(180,200,20,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          ⊙ PARAMETER
        </div>
        <div
          style={{
            padding: "2px 8px",
            borderRadius: 20,
            background: statusBg,
            border: `1px solid ${statusColor}22`,
            fontSize: 11,
            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            letterSpacing: "0.1em",
            color: statusColor,
          }}
        >
          {statusText}
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>{param.name}</div>

      <div style={{ display: "flex", justifyContent: "center" }}>{dialSVG()}</div>

      <div style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: "#b4c814", marginTop: -8 }}>{displayVal}</div>

      <div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, rgba(180,200,20,0.5), #b4c814)",
              borderRadius: 2,
              transition: "width 1s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: "rgba(255,255,255,0.25)",
          }}
        >
          <span>{param.rupee ? `₹${param.min.toLocaleString("en-IN")}` : `${param.min}${param.unit}`}</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>{pct}% of range</span>
          <span>{param.rupee ? `₹${param.max.toLocaleString("en-IN")}` : `${param.max}${param.unit}`}</span>
        </div>
      </div>

      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
        {param.desc}
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  index,
  rp,
  onVote,
  userVote,
}) {
  const total = proposal.support + proposal.oppose;
  const supportPct = total > 0 ? Math.round((proposal.support / total) * 100) : 0;
  const opposePct = total > 0 ? 100 - supportPct : 0;

  return (
    <Motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(180,200,20,0.15)";
        e.currentTarget.style.borderColor = "rgba(180,200,20,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        transition: "all 0.25s ease",
        cursor: "pointer",
        animation: "fadeUp 0.4s ease both",
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ⊙ ACTIVE PROPOSAL
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.1em",
            }}
          >
            #{proposal.id}
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{proposal.title}</div>

        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Proposed by {proposal.proposer}</div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
            CURRENT
          </span>
          <span
            style={{
              padding: "3px 10px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 20,
              fontSize: 13,
              maxWidth: "100%",
            }}
          >
            {proposal.currentLabel}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)" }} aria-hidden>
            →
          </span>
          <span style={{ fontSize: 11, color: "#b4c814", letterSpacing: "0.1em" }}>
            PROPOSED
          </span>
          <span
            style={{
              padding: "3px 10px",
              background: "rgba(180,200,20,0.12)",
              border: "1px solid rgba(180,200,20,0.3)",
              borderRadius: 20,
              fontSize: 13,
              color: "#b4c814",
              maxWidth: "100%",
            }}
          >
            {proposal.proposedLabel}
          </span>
        </div>

        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${supportPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #b4c814, rgba(180,200,20,0.6))",
              borderRadius: 2,
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "#b4c814" }}>{`${proposal.support} support (${supportPct}%)`}</span>
          <span style={{ fontSize: 14, color: "rgba(255,100,100,0.8)" }}>{`${proposal.oppose} oppose (${opposePct}%)`}</span>
        </div>

        <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
          ◷ TIME LEFT: {proposal.timeLeft}
        </div>

        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
          Trusted status required to vote (150 RP needed).{" "}
          <span style={{ color: "rgba(255,255,255,0.6)" }}>
            Your reputation: {rp != null ? `${rp} RP` : "—"}
          </span>
        </p>

      </div>
      {/* DEMO/testing: voting always enabled regardless of RP. Production: gate buttons with rp >= 150 (was: canVote). */}
      {userVote ? (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            marginTop: "auto",
            padding: "14px",
            textAlign: "center",
            color: ACCENT,
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          VOTED {userVote === "support" ? "SUPPORT" : "OPPOSE"}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            marginTop: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => onVote(proposal.id, "support")}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#c8dc18";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(180,200,20,0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#b4c814";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(180,200,20,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            style={{
              flex: 1,
              padding: "12px",
              background: "#b4c814",
              border: "none",
              borderRadius: 10,
              color: "#000",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 0 20px rgba(180,200,20,0.2)",
            }}
          >
            SUPPORT
          </button>
          <button
            type="button"
            onClick={() => onVote(proposal.id, "oppose")}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,100,100,0.3)";
              e.currentTarget.style.color = "rgba(255,100,100,0.8)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            style={{
              flex: 1,
              padding: "12px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            OPPOSE
          </button>
        </div>
      )}
    </Motion.article>
  );
}

export function GovernancePanel() {
  const navigate = useNavigate();
  const [rp, setRp] = useState(null);
  const [rpLoaded, setRpLoaded] = useState(false);
  const [votes, setVotes] = useState({});
  const [proposals, setProposals] = useState(DEMO_PROPOSALS);

  const [paramId, setParamId] = useState(PROTOCOL_PARAMETERS[0].id);
  const [proposedValue, setProposedValue] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const selectedParam = useMemo(
    () => PROTOCOL_PARAMETERS.find((p) => p.id === paramId) ?? PROTOCOL_PARAMETERS[0],
    [paramId]
  );

  useEffect(() => {
    const { anonymousId } = getSession();
    if (!anonymousId) {
      setRp(0);
      setRpLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/members/rp/${encodeURIComponent(anonymousId)}`);
        const j = await res.json();
        if (!cancelled) {
          setRp(Number(j?.reputation_points ?? 0));
        }
      } catch {
        if (!cancelled) setRp(0);
      } finally {
        if (!cancelled) setRpLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canVote = rp != null && rp >= 150; // used for top banner & proposal-form gating only; proposal cards bypass for demo
  const canPropose = rp != null && rp >= 150;

  function handleVote(proposalId, side) {
    setVotes((v) => ({ ...v, [proposalId]: side }));
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          support: side === "support" ? p.support + 1 : p.support,
          oppose: side === "oppose" ? p.oppose + 1 : p.oppose,
        };
      })
    );
  }

  function handleSubmitProposal(e) {
    e.preventDefault();
    if (reasoning.trim().length < 50) return;
    const ref = `GP-${String(Math.floor(1000 + Math.random() * 9000))}`;
    setSubmitSuccess(ref);
    setProposedValue("");
    setReasoning("");
  }

  const btnBase = {
    padding: "10px 18px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    cursor: "pointer",
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        ...PROTOCOL_PAGE_BACKGROUND,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "12px 24px 48px",
        position: "relative",
        fontFamily: '"Sora", system-ui, -apple-system, sans-serif',
      }}
    >
      <main
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1180,
          marginTop: 56,
        }}
      >
        <Motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: ACCENT,
                marginBottom: 10,
              }}
            >
              Governance
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                fontWeight: 800,
                color: "#f9fafb",
                letterSpacing: "-0.03em",
              }}
            >
              CIPHER GOVERNANCE
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 15,
                lineHeight: 1.65,
                color: "rgba(148,163,184,0.95)",
                maxWidth: 560,
              }}
            >
              Verified members shape how this system behaves. Core rules are fixed. Parameters within bounds are
              tunable.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              ...btnBase,
              background: "rgba(15,23,42,0.55)",
              color: "rgba(226,232,240,0.96)",
              borderColor: "rgba(148,163,184,0.55)",
            }}
          >
            Back
          </button>
        </Motion.header>

        {rpLoaded && !canVote && (
          <Motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "14px 18px",
              ...PROTOCOL_DASHBOARD_CARD,
              borderRadius: 14,
              marginBottom: 28,
              fontSize: 14,
              lineHeight: 1.55,
              color: "rgba(226,232,240,0.92)",
            }}
          >
            <strong style={{ color: ACCENT }}>View-only access.</strong> Newcomer and Contributor tiers can read
            proposals and parameters but cannot vote. Only <strong>Trusted</strong> (150+ RP) or{" "}
            <strong>Expert</strong> (300+ RP) members may vote.{" "}
            {rp != null && (
              <>
                Your reputation: <strong>{rp} RP</strong>.
              </>
            )}
          </Motion.div>
        )}

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)" }}>
            ⊙ ACTIVE PROPOSALS
          </h2>
          <div
            className="governance-proposals-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 24,
            }}
          >
            {proposals.map((p, i) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                index={i}
                rp={rp}
                userVote={votes[p.id]}
                onVote={handleVote}
              />
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 13,
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 6,
            }}
          >
            ⊙ PROTOCOL DNA
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>
            6 active parameters · all within governance bounds
          </div>
          <div
            className="governance-params-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {PARAMETERS.map((param, index) => (
              <ParameterGaugeCard key={param.name} param={param} index={index} />
            ))}
          </div>
        </section>

        <section>
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.85)",
            }}
          >
            Submit a proposal
          </h2>

          {canPropose ? (
            <Motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmitProposal}
              style={{
                background: "rgba(8,11,18,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                overflow: "hidden",
                display: "flex",
                marginTop: 32,
              }}
            >
              {submitSuccess ? (
                <div className="governance-submit-shell" style={{ display: "flex", width: "100%" }}>
                  <div
                    style={{
                      width: 320,
                      flexShrink: 0,
                      padding: "36px 32px",
                      borderRight: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(180,200,20,0.015)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: -60,
                        left: -60,
                        width: 240,
                        height: 240,
                        background: "radial-gradient(circle, rgba(180,200,20,0.06) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#b4c814" }}>
                      ⊙ SUBMIT A PROPOSAL
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
                      Shape the
                      <br />
                      <span style={{ color: "#b4c814" }}>protocol rules</span>
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                      Propose a change to how the system works. The community votes to accept or reject it.
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "36px 36px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      overflowY: "auto",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        padding: "14px 16px",
                        background: "rgba(180,200,20,0.06)",
                        border: "1px solid rgba(180,200,20,0.15)",
                        borderRadius: 10,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.75)",
                        lineHeight: 1.5,
                      }}
                    >
                      Your proposal has been submitted for community review.
                      <br />
                      Reference: <strong>#{submitSuccess}</strong>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setSubmitSuccess(null)}
                        style={{
                          flex: 1,
                          padding: "14px",
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          color: "rgba(255,255,255,0.65)",
                          fontFamily: "inherit",
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          cursor: "pointer",
                        }}
                      >
                        SUBMIT ANOTHER
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="governance-submit-shell" style={{ display: "flex", width: "100%" }}>
                  <div
                    style={{
                      width: 320,
                      flexShrink: 0,
                      padding: "36px 32px",
                      borderRight: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(180,200,20,0.015)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: -60,
                        left: -60,
                        width: 240,
                        height: 240,
                        background: "radial-gradient(circle, rgba(180,200,20,0.06) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />

                    <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#b4c814" }}>
                      ⊙ SUBMIT A PROPOSAL
                    </div>

                    <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
                      Shape the
                      <br />
                      <span style={{ color: "#b4c814" }}>protocol rules</span>
                    </div>

                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                      Propose a change to how the system works. The community votes to accept or reject it.
                    </div>

                    {[
                      { icon: "⊙", label: "150 RP required", sub: "Trusted members only" },
                      { icon: "◷", label: "5 day voting window", sub: "Community decides" },
                      { icon: "◎", label: "60% majority needed", sub: "To pass a proposal" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 10,
                        }}
                      >
                        <span style={{ fontFamily: "monospace", fontSize: 14, color: "#b4c814", opacity: 0.7 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.sub}</div>
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        background: "rgba(180,200,20,0.05)",
                        border: "1px solid rgba(180,200,20,0.12)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      ◇ Proposals are anonymous and encrypted
                    </div>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      padding: "36px 36px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      overflowY: "auto",
                    }}
                  >
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: "1px solid rgba(180,200,20,0.4)",
                          background: "rgba(180,200,20,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          color: "#b4c814",
                          fontFamily: "monospace",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        ⊙
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            letterSpacing: "0.15em",
                            color: "rgba(255,255,255,0.4)",
                            marginBottom: 8,
                          }}
                        >
                          1. SELECT PARAMETER
                        </div>
                        <select
                          value={paramId}
                          onChange={(e) => setParamId(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "13px 15px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            color: "#fff",
                            fontFamily: "inherit",
                            fontSize: 14,
                            outline: "none",
                          }}
                        >
                          {PROTOCOL_PARAMETERS.map((p) => (
                            <option key={p.id} value={p.id} style={{ background: "#0b1020", color: "#f8fafc" }}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.3)",
                          fontFamily: "monospace",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        ▦
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            letterSpacing: "0.15em",
                            color: "rgba(255,255,255,0.4)",
                            marginBottom: 8,
                          }}
                        >
                          2. CURRENT VALUE (READ ONLY)
                        </div>
                        <input
                          readOnly
                          value={selectedParam.current}
                          style={{
                            width: "100%",
                            padding: "13px 15px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 10,
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: "monospace",
                            fontSize: 14,
                            outline: "none",
                            cursor: "not-allowed",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.3)",
                          fontFamily: "monospace",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        ◎
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            letterSpacing: "0.15em",
                            color: "rgba(255,255,255,0.4)",
                            marginBottom: 8,
                          }}
                        >
                          3. PROPOSED VALUE
                        </div>
                        <input
                          value={proposedValue}
                          onChange={(e) => setProposedValue(e.target.value)}
                          placeholder="Enter your proposed value"
                          style={{
                            width: "100%",
                            padding: "13px 15px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            color: "#fff",
                            fontFamily: "inherit",
                            fontSize: 14,
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.3)",
                          fontFamily: "monospace",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        ◇
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            letterSpacing: "0.15em",
                            color: "rgba(255,255,255,0.4)",
                            marginBottom: 8,
                          }}
                        >
                          4. REASONING (MIN. 50 CHARACTERS)
                        </div>
                        <textarea
                          value={reasoning}
                          onChange={(e) => setReasoning(e.target.value)}
                          rows={5}
                          placeholder="Explain why this change benefits the protocol..."
                          style={{
                            width: "100%",
                            minHeight: 100,
                            padding: "13px 15px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            color: "#fff",
                            fontFamily: "inherit",
                            fontSize: 14,
                            outline: "none",
                            resize: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(180,200,20,0.06)",
                        border: "1px solid rgba(180,200,20,0.15)",
                        borderRadius: 10,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "#b4c814" }}>⊙</span>
                      <span>Your proposal goes live immediately for community voting.</span>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setParamId(PROTOCOL_PARAMETERS[0].id);
                          setProposedValue("");
                          setReasoning("");
                        }}
                        style={{
                          flex: 1,
                          padding: "14px",
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          color: "rgba(255,255,255,0.5)",
                          fontFamily: "inherit",
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          cursor: "pointer",
                        }}
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={reasoning.trim().length < 50 || !proposedValue.trim()}
                        style={{
                          flex: 2,
                          padding: "14px",
                          background: reasoning.trim().length >= 50 && proposedValue.trim() ? "#b4c814" : "rgba(148,163,184,0.25)",
                          border: "none",
                          borderRadius: 10,
                          color: reasoning.trim().length >= 50 && proposedValue.trim() ? "#000" : "rgba(255,255,255,0.5)",
                          fontFamily: "inherit",
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          cursor: reasoning.trim().length >= 50 && proposedValue.trim() ? "pointer" : "not-allowed",
                          boxShadow: reasoning.trim().length >= 50 && proposedValue.trim() ? "0 0 20px rgba(180,200,20,0.25)" : "none",
                        }}
                      >
                        SUBMIT PROPOSAL →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Motion.form>
          ) : (
            <div
              style={{
                padding: "22px 24px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                fontSize: 15,
                color: "rgba(148,163,184,0.95)",
                lineHeight: 1.55,
              }}
            >
              Governance participation requires Trusted status (150 RP).{" "}
              {rp != null && (
                <span style={{ color: "rgba(226,232,240,0.9)" }}>Your reputation: {rp} RP.</span>
              )}
            </div>
          )}
        </section>

        <style>{`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 980px) {
            .governance-proposals-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 700px) {
            .governance-params-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (min-width: 701px) and (max-width: 1080px) {
            .governance-params-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }

          @media (max-width: 980px) {
            .governance-submit-shell {
              flex-direction: column !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
