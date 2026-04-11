import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { FaintBackground } from "./OnboardingCommon.jsx";
import { API_URL } from "../config/api.js";

const ACCENT = "#b5ec34";

function formatDecisionRecorded(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `Decision recorded: ${datePart} at ${timePart}`;
}

export function VerdictScreen() {
  const { juryCaseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(location.state?.verdict ?? null);
  const [loading, setLoading] = useState(!location.state?.verdict);
  const [error, setError] = useState("");
  const [ledgerOpen, setLedgerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError("");
      try {
        const res = await fetch(`${API_URL}/jury/case/${juryCaseId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Could not load verdict");
        if (!cancelled) setData((prev) => ({ ...(prev || {}), ...json }));
      } catch (e) {
        if (!cancelled) setError(e?.message || "Could not load verdict");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (juryCaseId) load();
    return () => {
      cancelled = true;
    };
  }, [juryCaseId]);

  const decision = data?.final_decision;
  const votesRequired = Number(data?.votes_required ?? 8);
  const approveCount = Number(data?.approve_count ?? 0);
  const confidenceAvg = data?.confidence_avg != null ? Number(data.confidence_avg) : null;
  const confidencePct =
    confidenceAvg != null ? Math.round(confidenceAvg * 100) : 0;

  const caseRefLabel = useMemo(() => {
    const id = Number(data?.jury_case_id ?? juryCaseId);
    if (!Number.isFinite(id)) return null;
    return `Case Reference: #JC-${String(id).padStart(3, "0")}`;
  }, [data?.jury_case_id, juryCaseId]);

  const recordedLine = formatDecisionRecorded(data?.decided_at);

  const titleConfig =
    decision === "approved"
      ? { text: "Claim Approved", color: ACCENT, glow: "rgba(181,236,52,0.45)", icon: "✓" }
      : decision === "denied"
        ? {
            text: "Claim Not Supported",
            color: "#f87171",
            glow: "rgba(248,113,113,0.4)",
            icon: "✗",
          }
        : decision === "re_evaluation"
          ? {
              text: "Sent for Re-evaluation",
              color: "#fbbf24",
              glow: "rgba(251,191,36,0.38)",
              icon: "↻",
            }
          : { text: "Verdict", color: "#e2e8f0", glow: "rgba(148,163,184,0.2)", icon: "" };

  const consensusLabel =
    decision === "re_evaluation" || (confidenceAvg != null && confidenceAvg < 0.6)
      ? "Escalated due to low confidence"
      : "Majority consensus reached";

  const voteRows = Array.isArray(data?.votes) ? data.votes : [];

  return (
    <div
      className="verdict-page-root"
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "#02030a",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowY: "auto",
      }}
    >
      <style>{`
        .verdict-page-root {
          padding: 60px 48px 56px;
        }
        @media (max-width: 640px) {
          .verdict-page-root {
            padding: 48px 20px 44px;
          }
        }
        .verdict-top-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 640px) {
          .verdict-top-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .verdict-ledger-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 640px) {
          .verdict-ledger-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <FaintBackground />

      <Motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {loading && !data ? (
          <p style={{ color: "rgba(148,163,184,0.9)", fontSize: 15 }}>Loading verdict…</p>
        ) : null}
        {error ? (
          <p style={{ color: "#f87171", fontSize: 15, marginBottom: 16 }}>{error}</p>
        ) : null}

        {data ? (
          <>
            <div className="verdict-top-grid">
              <div style={{ minWidth: 0 }}>
                {caseRefLabel ? (
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      color: "rgba(148,163,184,0.88)",
                    }}
                  >
                    {caseRefLabel}
                  </p>
                ) : null}

                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: ACCENT,
                  }}
                >
                  PROTOCOL DECISION
                </p>

                <div
                  style={{
                    position: "relative",
                    marginBottom: 20,
                    paddingBottom: 4,
                  }}
                >
                  <Motion.div
                    aria-hidden
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "min(100%, 440px)",
                      height: 140,
                      borderRadius: "50%",
                      background: `radial-gradient(ellipse at center, ${titleConfig.glow} 0%, transparent 72%)`,
                      filter: "blur(32px)",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                  <h1
                    style={{
                      position: "relative",
                      zIndex: 1,
                      margin: 0,
                      fontSize: "clamp(2rem, 5vw, 3rem)",
                      fontWeight: 800,
                      color: titleConfig.color,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.15,
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.35em",
                    }}
                  >
                    {titleConfig.icon ? (
                      <span style={{ fontSize: "0.9em", opacity: 0.95 }} aria-hidden>
                        {titleConfig.icon}
                      </span>
                    ) : null}
                    <span>{titleConfig.text}</span>
                  </h1>
                </div>

                {recordedLine ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "rgba(148,163,184,0.78)",
                    }}
                  >
                    {recordedLine}
                  </p>
                ) : null}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background:
                      "radial-gradient(circle at 100% 0%, rgba(181,236,52,0.07), transparent 50%), rgba(15,23,42,0.88)",
                    padding: "28px 26px 26px",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                    height: "100%",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 20px",
                      fontSize: 16,
                      lineHeight: 1.65,
                      color: "rgba(226,232,240,0.96)",
                    }}
                  >
                    {approveCount} of {votesRequired} reviewers supported this claim
                  </p>

                  <div style={{ marginBottom: 18 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "rgba(148,163,184,0.85)",
                        }}
                      >
                        Average confidence
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: ACCENT }}>
                        {confidencePct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 12,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <Motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${confidencePct}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          height: "100%",
                          borderRadius: 999,
                          background: ACCENT,
                          boxShadow: "0 0 14px rgba(181,236,52,0.45)",
                        }}
                      />
                    </div>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "rgba(148,163,184,0.92)",
                      lineHeight: 1.6,
                    }}
                  >
                    {consensusLabel}
                  </p>
                </div>
              </div>
            </div>

            <div
              role="separator"
              style={{
                marginTop: 44,
                marginBottom: 28,
                border: "none",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                width: "100%",
              }}
            />

            <div style={{ width: "100%" }}>
              <button
                type="button"
                onClick={() => setLedgerOpen((o) => !o)}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(226,232,240,0.92)",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {ledgerOpen ? "HIDE DECISION LEDGER" : "VIEW DECISION LEDGER"}
              </button>

              <AnimatePresence initial={false}>
                {ledgerOpen ? (
                  <Motion.div
                    key="ledger"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        marginTop: 18,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(2,6,23,0.65)",
                        padding: "24px 22px 22px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: ACCENT,
                        }}
                      >
                        DECISION LEDGER
                      </p>
                      <p
                        style={{
                          margin: "10px 0 22px",
                          fontSize: 12,
                          color: "rgba(148,163,184,0.75)",
                          lineHeight: 1.55,
                        }}
                      >
                        All evaluations are anonymized and immutable
                      </p>
                      <div className="verdict-ledger-grid">
                        {voteRows.length === 0 ? (
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              color: "rgba(148,163,184,0.7)",
                              gridColumn: "1 / -1",
                            }}
                          >
                            No vote records yet.
                          </p>
                        ) : (
                          voteRows.map((row, idx) => {
                            const supported = row.vote === "approved";
                            const conf =
                              row.confidence != null
                                ? Math.round(Number(row.confidence) * 100)
                                : "—";
                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: "16px 16px 14px",
                                  borderRadius: 12,
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  background: "rgba(15,23,42,0.5)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10,
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 10,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      letterSpacing: "0.08em",
                                      color: "rgba(226,232,240,0.9)",
                                    }}
                                  >
                                    Reviewer #{idx + 1}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      letterSpacing: "0.12em",
                                      textTransform: "uppercase",
                                      padding: "4px 10px",
                                      borderRadius: 999,
                                      border: `1px solid ${
                                        supported
                                          ? "rgba(181,236,52,0.45)"
                                          : "rgba(248,113,113,0.4)"
                                      }`,
                                      color: supported ? ACCENT : "#f87171",
                                      background: supported
                                        ? "rgba(181,236,52,0.08)"
                                        : "rgba(248,113,113,0.08)",
                                    }}
                                  >
                                    {supported ? "Supported" : "Did not support"}
                                  </span>
                                </div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 11,
                                    color: "rgba(148,163,184,0.9)",
                                  }}
                                >
                                  {typeof conf === "number"
                                    ? `${conf}% confidence`
                                    : conf}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                    color: "rgba(203,213,225,0.88)",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {row.reasoning || "—"}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </Motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => navigate("/juror-dashboard")}
              style={{
                marginTop: 32,
                width: "100%",
                padding: "14px 22px",
                borderRadius: 999,
                border: `1px solid rgba(181,236,52,0.45)`,
                background: ACCENT,
                color: "#020617",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 0 24px rgba(181,236,52,0.2)",
                boxSizing: "border-box",
              }}
            >
              Back to dashboard
            </button>
          </>
        ) : null}
      </Motion.main>
    </div>
  );
}
