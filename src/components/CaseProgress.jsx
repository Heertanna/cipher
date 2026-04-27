import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function CaseProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const claim = location.state?.claim || JSON.parse(localStorage.getItem("cipher_claims_demo") || "[]")[0];

  const [votes, setVotes] = useState({ approved: 3, denied: 1, pending: 4 });
  const [elapsed, setElapsed] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictDismissed, setVerdictDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVotes((prev) => {
        if (prev.pending === 0) return prev;
        const newApprove = Math.random() > 0.3;
        return {
          approved: newApprove ? prev.approved + 1 : prev.approved,
          denied: !newApprove ? prev.denied + 1 : prev.denied,
          pending: prev.pending - 1,
        };
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (votes.pending === 0 && !verdictDismissed) {
      const timer = setTimeout(() => setShowVerdict(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [votes.pending, verdictDismissed]);

  const total = votes.approved + votes.denied + votes.pending;
  const approvalPct = total > 0 ? Math.round((votes.approved / total) * 100) : 0;
  const votedCount = votes.approved + votes.denied;
  const isDecided = votes.pending === 0;
  const isApproved = isDecided && votes.approved > votes.denied;
  const isDenied = isDecided && votes.denied >= votes.approved;

  const TIMELINE = [
    { label: "Claim submitted", detail: "Your case entered the protocol", done: true, time: "Apr 18" },
    { label: "Identity anonymized", detail: "Personal data encrypted and removed", done: true, time: "Apr 18" },
    { label: "Jury assigned", detail: `${total} independent reviewers selected`, done: true, time: "Apr 19" },
    {
      label: "Review in progress",
      detail: `${votedCount} of ${total} jurors have voted`,
      done: votedCount > 0,
      active: !isDecided,
      time: "Apr 21",
    },
    {
      label: isApproved ? "Claim approved" : isDenied ? "Claim denied" : "Final decision",
      detail: isApproved
        ? "Coverage confirmed by peer consensus"
        : isDenied
          ? "Insufficient support from jury"
          : "Awaiting all votes",
      done: isDecided,
      time: isDecided ? "Today" : "Pending",
    },
  ];

  return (
    <>
      {showVerdict && !verdictDismissed && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(6,8,16,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.4s ease both",
          }}
        >
          <div
            style={{
              background: "rgba(10,14,22,0.98)",
              border: `1px solid ${isApproved ? "rgba(180,200,20,0.3)" : "rgba(255,80,80,0.3)"}`,
              borderRadius: 24,
              padding: "48px 56px",
              maxWidth: 520,
              width: "90%",
              textAlign: "center",
              animation: "popUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
              position: "relative",
              boxShadow: isApproved
                ? "0 0 80px rgba(180,200,20,0.15), 0 40px 120px rgba(0,0,0,0.6)"
                : "0 0 80px rgba(255,80,80,0.1), 0 40px 120px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                margin: "0 auto 24px",
                background: isApproved ? "rgba(180,200,20,0.12)" : "rgba(255,80,80,0.1)",
                border: `2px solid ${isApproved ? "rgba(180,200,20,0.4)" : "rgba(255,80,80,0.4)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                animation: "iconPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
                boxShadow: isApproved ? "0 0 40px rgba(180,200,20,0.3)" : "0 0 40px rgba(255,80,80,0.2)",
              }}
            >
              {isApproved ? "✓" : "✕"}
            </div>

            <div
              style={{
                fontFamily: "monospace",
                fontSize: 15,
                letterSpacing: "0.2em",
                color: isApproved ? "#b4c814" : "rgba(255,80,80,0.8)",
                marginBottom: 12,
                animation: "fadeUp 0.4s ease 0.3s both",
              }}
            >
              ⊙ JURY VERDICT
            </div>

            <div
              style={{
                fontSize: 54,
                fontWeight: 800,
                lineHeight: 1.1,
                color: isApproved ? "#b4c814" : "#ff5555",
                marginBottom: 16,
                animation: "fadeUp 0.4s ease 0.35s both",
                whiteSpace: "pre-line",
              }}
            >
              {isApproved ? "CLAIM\nAPPROVED" : "CLAIM\nDENIED"}
            </div>

            <div
              style={{
                fontSize: 20,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 28,
                lineHeight: 1.6,
                animation: "fadeUp 0.4s ease 0.4s both",
              }}
            >
              {isApproved
                ? `${votes.approved} of ${total} jurors voted to approve your claim. Coverage has been confirmed.`
                : `${votes.denied} of ${total} jurors voted to deny. You may resubmit with additional evidence.`}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 32,
                animation: "fadeUp 0.4s ease 0.45s both",
              }}
            >
              <div
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  background: "rgba(180,200,20,0.1)",
                  border: "1px solid rgba(180,200,20,0.25)",
                  fontSize: 16,
                  color: "#b4c814",
                  fontFamily: "monospace",
                }}
              >
                ✓ {votes.approved} APPROVED
              </div>
              <div
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  background: "rgba(255,80,80,0.08)",
                  border: "1px solid rgba(255,80,80,0.2)",
                  fontSize: 16,
                  color: "rgba(255,80,80,0.8)",
                  fontFamily: "monospace",
                }}
              >
                ✕ {votes.denied} DENIED
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease 0.5s both" }}>
              <button
                onClick={() => {
                  setVerdictDismissed(true);
                  setShowVerdict(false);
                }}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#b4c814",
                  border: "none",
                  borderRadius: 12,
                  color: "#000",
                  fontFamily: "inherit",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(180,200,20,0.35)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 50px rgba(180,200,20,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(180,200,20,0.35)";
                }}
              >
                VIEW FULL DETAILS →
              </button>

              {isDenied && (
                <button
                  onClick={() => navigate("/claim-intake")}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "inherit",
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                  }}
                >
                  RESUBMIT WITH MORE EVIDENCE
                </button>
              )}

              <button
                onClick={() => navigate("/protocol-dashboard")}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "monospace",
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                ← BACK TO DASHBOARD
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          minHeight: "100vh",
          background: "#060810",
          backgroundImage:
            "radial-gradient(ellipse at bottom left, rgba(180,200,20,0.1) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 60px 60px, 60px 60px",
          color: "#fff",
          padding: "32px 24px",
          fontFamily: "inherit",
        }}
      >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 4,
              }}
            >
              ⊙ CASE PROGRESS
            </div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.25)" }}>
              CASE #{claim?.id || "C1776761918"}
            </div>
          </div>
          <button
            onClick={() => navigate("/protocol-dashboard")}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            ← BACK TO DASHBOARD
          </button>
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderRadius: 14,
            marginBottom: 24,
            background: isApproved
              ? "rgba(180,200,20,0.08)"
              : isDenied
                ? "rgba(255,80,80,0.08)"
                : "rgba(255,255,255,0.03)",
            border: `1px solid ${
              isApproved ? "rgba(180,200,20,0.25)" : isDenied ? "rgba(255,80,80,0.25)" : "rgba(255,255,255,0.08)"
            }`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: isApproved
                ? "rgba(180,200,20,0.15)"
                : isDenied
                  ? "rgba(255,80,80,0.15)"
                  : "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              animation: !isDecided ? "statusPulse 2s ease-in-out infinite" : "none",
            }}
          >
            {isApproved ? "✓" : isDenied ? "✕" : "⋯"}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: isApproved ? "#b4c814" : isDenied ? "#ff5555" : "#fff" }}>
              {isApproved ? "Claim Approved" : isDenied ? "Claim Denied" : "Under Jury Review"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {isApproved
                ? "Your claim has been approved by peer consensus. Coverage confirmed."
                : isDenied
                  ? "The jury did not approve this claim. You may resubmit with more evidence."
                  : `${votes.pending} jurors yet to vote · Decision expected within 48 hours`}
            </div>
          </div>
          {!isDecided && (
            <div style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              LIVE
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#b4c814",
                  marginLeft: 6,
                  animation: "statusPulse 1s ease-in-out infinite",
                }}
              />
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 24,
              gridColumn: "span 2",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 16,
              }}
            >
              ⊙ JURY VOTES
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {Array.from({ length: total }).map((_, i) => {
                const isApprovedVote = i < votes.approved;
                const isDeniedVote = i >= votes.approved && i < votes.approved + votes.denied;
                return (
                  <div
                    key={i}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: isApprovedVote
                        ? "rgba(180,200,20,0.15)"
                        : isDeniedVote
                          ? "rgba(255,80,80,0.12)"
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        isApprovedVote
                          ? "rgba(180,200,20,0.4)"
                          : isDeniedVote
                            ? "rgba(255,80,80,0.3)"
                            : "rgba(255,255,255,0.1)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: isApprovedVote ? "#b4c814" : isDeniedVote ? "#ff5555" : "rgba(255,255,255,0.2)",
                      transition: "all 0.5s ease",
                    }}
                  >
                    {isApprovedVote ? "✓" : isDeniedVote ? "✕" : "?"}
                  </div>
                );
              })}
            </div>

            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", display: "flex" }}>
                <div style={{ width: `${(votes.approved / total) * 100}%`, background: "#b4c814", transition: "width 0.8s ease" }} />
                <div style={{ width: `${(votes.denied / total) * 100}%`, background: "rgba(255,80,80,0.7)", transition: "width 0.8s ease" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#b4c814" }}>{`${votes.approved} approve (${approvalPct}%)`}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{`${votes.pending} pending`}</span>
              <span style={{ fontSize: 13, color: "rgba(255,80,80,0.8)" }}>{`${votes.denied} deny`}</span>
            </div>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: total }).map((_, i) => {
                const voted = i < votedCount;
                const approved = i < votes.approved;
                const jurorId = `J${String(i + 1).padStart(2, "0")}`;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {jurorId}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{`Juror #${String(i + 101).toString(36).toUpperCase()}A`}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Anonymous peer reviewer</div>
                    </div>
                    <div
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontFamily: "monospace",
                        fontWeight: 600,
                        background: voted
                          ? approved
                            ? "rgba(180,200,20,0.1)"
                            : "rgba(255,80,80,0.1)"
                          : "rgba(255,255,255,0.04)",
                        color: voted ? (approved ? "#b4c814" : "#ff5555") : "rgba(255,255,255,0.25)",
                        border: `1px solid ${
                          voted
                            ? approved
                              ? "rgba(180,200,20,0.2)"
                              : "rgba(255,80,80,0.2)"
                            : "rgba(255,255,255,0.08)"
                        }`,
                      }}
                    >
                      {voted ? (approved ? "APPROVED" : "DENIED") : "PENDING"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 24,
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 16,
                }}
              >
                ◷ CASE TIMELINE
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {TIMELINE.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          flexShrink: 0,
                          marginTop: 3,
                          background: step.active ? "#b4c814" : step.done ? "rgba(180,200,20,0.5)" : "rgba(255,255,255,0.1)",
                          border: step.active ? "2px solid #b4c814" : "none",
                          animation: step.active ? "statusPulse 1.5s ease-in-out infinite" : "none",
                          boxShadow: step.active ? "0 0 8px rgba(180,200,20,0.6)" : "none",
                        }}
                      />
                      {i < TIMELINE.length - 1 && (
                        <div
                          style={{
                            width: 1,
                            flex: 1,
                            minHeight: 24,
                            background: step.done ? "rgba(180,200,20,0.2)" : "rgba(255,255,255,0.06)",
                            margin: "4px 0",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < TIMELINE.length - 1 ? 16 : 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: step.active ? "#b4c814" : step.done ? "#fff" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {step.label}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{step.detail}</div>
                      <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{step.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 14,
                }}
              >
                ⊙ CASE DETAILS
              </div>
              {[
                { label: "Complaint", value: claim?.whatHappened || "Peer review case" },
                { label: "Category", value: claim?.typeOfIssue || "Emergency" },
                { label: "Est. Cost", value: claim?.costDetails || "₹1,20,000" },
                { label: "Filed", value: "Apr 18, 2026" },
                { label: "Identity", value: "Anonymized ✓" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "monospace",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {item.label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "right" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isDecided && (
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {isDenied && (
              <button
                onClick={() => navigate("/claim-intake")}
                style={{
                  padding: "14px 28px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
              >
                RESUBMIT WITH MORE EVIDENCE
              </button>
            )}
            <button
              onClick={() => navigate("/protocol-dashboard")}
              style={{
                padding: "14px 28px",
                background: "#b4c814",
                border: "none",
                borderRadius: 10,
                color: "#000",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.1em",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(180,200,20,0.25)",
              }}
            >
              BACK TO DASHBOARD →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes statusPulse {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popUp {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes iconPop {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </div>
    </>
  );
}
