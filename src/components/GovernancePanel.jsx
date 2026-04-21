import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";

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

function ReadOnlyRangeSlider({ param }) {
  if (!param.numeric) {
    return (
      <p style={{ margin: 0, fontSize: 12, color: "rgba(148,163,184,0.85)", maxWidth: 280 }}>
        {param.rangeLabel}
      </p>
    );
  }
  const raw = param.displayValue ?? 0;
  const t = Math.min(1, Math.max(0, (raw - param.min) / (param.max - param.min)));
  return (
    <div style={{ width: "100%", maxWidth: 280 }}>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          position: "relative",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${t * 100}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, rgba(148,163,184,0.35), ${ACCENT})`,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `calc(${t * 100}% - 6px)`,
            top: -2,
            width: 12,
            height: 12,
            borderRadius: 999,
            background: ACCENT,
            boxShadow: `0 0 12px ${ACCENT}`,
          }}
        />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(148,163,184,0.75)" }}>{param.rangeLabel}</p>
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
      style={{
        padding: "22px 24px 24px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.02)",
        marginBottom: 20,
      }}
    >
      <h3
        style={{
          margin: "0 0 10px",
          fontSize: "clamp(1.05rem, 2.2vw, 1.25rem)",
          fontWeight: 800,
          color: "#f9fafb",
          letterSpacing: "-0.02em",
          lineHeight: 1.35,
        }}
      >
        {proposal.title}
      </h3>
      <p style={{ margin: "0 0 8px", fontSize: 12, color: "rgba(148,163,184,0.9)" }}>
        Proposed by <span style={{ color: "rgba(226,232,240,0.95)" }}>{proposal.proposer}</span>
      </p>
      <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.6, color: "rgba(203,213,225,0.92)" }}>
        {proposal.description}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(148,163,184,0.8)" }}>
          CURRENT
        </span>
        <span
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(148,163,184,0.12)",
            color: "rgba(226,232,240,0.95)",
            fontSize: 13,
            fontWeight: 600,
            maxWidth: "100%",
          }}
        >
          {proposal.currentLabel}
        </span>
        <span style={{ color: "rgba(148,163,184,0.6)", fontSize: 18 }} aria-hidden>
          →
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: ACCENT }}>
          PROPOSED
        </span>
        <span
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(181,236,52,0.12)",
            color: ACCENT,
            fontSize: 13,
            fontWeight: 700,
            maxWidth: "100%",
          }}
        >
          {proposal.proposedLabel}
        </span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            height: 10,
            borderRadius: 999,
            overflow: "hidden",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${supportPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: SUPPORT, height: "100%" }}
          />
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${opposePct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: OPPOSE, height: "100%" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 12,
            color: "rgba(148,163,184,0.9)",
          }}
        >
          <span
            style={{ color: SUPPORT }}
          >{`${proposal.support} support (${supportPct}%)`}</span>
          <span
            style={{ color: OPPOSE }}
          >{`${proposal.oppose} oppose (${opposePct}%)`}</span>
        </div>
      </div>

      <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(148,163,184,0.85)" }}>
        <span style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Time left:</span>{" "}
        {proposal.timeLeft}
      </p>

      <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(148,163,184,0.9)", lineHeight: 1.5 }}>
        Trusted status required to vote (150 RP needed).{" "}
        <span style={{ color: "rgba(226,232,240,0.85)" }}>
          Your reputation: {rp != null ? `${rp} RP` : "—"}
        </span>
      </p>

      {/* DEMO/testing: voting always enabled regardless of RP. Production: gate buttons with rp >= 150 (was: canVote). */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        {userVote ? (
          <p style={{ margin: 0, fontSize: 13, color: ACCENT, fontWeight: 600 }}>
            You voted {userVote === "support" ? "SUPPORT" : "OPPOSE"} on this proposal.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onVote(proposal.id, "support")}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: `1px solid ${SUPPORT}`,
                background: "rgba(34,197,94,0.12)",
                color: SUPPORT,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                cursor: "pointer",
              }}
            >
              SUPPORT
            </button>
            <button
              type="button"
              onClick={() => onVote(proposal.id, "oppose")}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: `1px solid ${OPPOSE}`,
                background: "rgba(248,113,113,0.1)",
                color: OPPOSE,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                cursor: "pointer",
              }}
            >
              OPPOSE
            </button>
          </>
        )}
      </div>
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
    fontSize: 11,
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
        position: "relative",
        minHeight: "100vh",
        background: "transparent",
        padding: "80px 24px 48px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <FaintBackground />
      <main
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 820,
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
                fontSize: 11,
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
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.65)",
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
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.85)",
            }}
          >
            Active proposals
          </h2>
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
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.85)",
            }}
          >
            Current system parameters
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PROTOCOL_PARAMETERS.map((param, i) => (
              <Motion.div
                key={param.id}
                className="governance-param-row"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.35 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 20,
                  alignItems: "center",
                  padding: "18px 20px",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "rgba(148,163,184,0.8)" }}>
                    CURRENT PROTOCOL SETTING
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{param.label}</p>
                  <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600, color: ACCENT }}>{param.current}</p>
                </div>
                <ReadOnlyRangeSlider param={param} />
              </Motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: 12,
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
                padding: "24px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {submitSuccess ? (
                <div>
                  <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: ACCENT, lineHeight: 1.6 }}>
                    Your proposal has been submitted for community review.
                    <br />
                    Reference: <strong>#{submitSuccess}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(null)}
                    style={{
                      ...btnBase,
                      background: "rgba(15,23,42,0.55)",
                      color: "rgba(226,232,240,0.96)",
                      borderColor: "rgba(148,163,184,0.55)",
                    }}
                  >
                    Submit another proposal
                  </button>
                </div>
              ) : (
                <>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.95)" }}>
                    Parameter
                  </label>
                  <select
                    value={paramId}
                    onChange={(e) => setParamId(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: 420,
                      marginBottom: 18,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(15,23,42,0.9)",
                      color: "#f9fafb",
                      fontSize: 14,
                    }}
                  >
                    {PROTOCOL_PARAMETERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.95)" }}>
                    Current value (read only)
                  </label>
                  <input
                    readOnly
                    value={selectedParam.current}
                    style={{
                      width: "100%",
                      maxWidth: 420,
                      marginBottom: 18,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(226,232,240,0.85)",
                      fontSize: 14,
                    }}
                  />

                  <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.95)" }}>
                    Proposed value
                  </label>
                  <input
                    value={proposedValue}
                    onChange={(e) => setProposedValue(e.target.value)}
                    placeholder="Enter your proposed value"
                    style={{
                      width: "100%",
                      maxWidth: 420,
                      marginBottom: 18,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(15,23,42,0.9)",
                      color: "#f9fafb",
                      fontSize: 14,
                    }}
                  />

                  <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.95)" }}>
                    Reasoning (min. 50 characters)
                  </label>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    rows={5}
                    placeholder="Explain why this change benefits the protocol..."
                    style={{
                      width: "100%",
                      marginBottom: 18,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(15,23,42,0.9)",
                      color: "#f9fafb",
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: 120,
                    }}
                  />

                  <button
                    type="submit"
                    disabled={reasoning.trim().length < 50 || !proposedValue.trim()}
                    style={{
                      ...btnBase,
                      background: reasoning.trim().length >= 50 && proposedValue.trim() ? ACCENT : "rgba(148,163,184,0.25)",
                      color: reasoning.trim().length >= 50 && proposedValue.trim() ? "#020617" : "rgba(148,163,184,0.9)",
                      borderColor: "rgba(181,236,52,0.55)",
                      cursor: reasoning.trim().length >= 50 && proposedValue.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    SUBMIT PROPOSAL
                  </button>
                </>
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
          @media (max-width: 700px) {
            .governance-param-row {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
