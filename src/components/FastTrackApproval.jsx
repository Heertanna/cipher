import React, { useEffect, useMemo, useState } from "react";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";
import { RpEarnedNotice } from "./RpEarnedNotice.jsx";

export function FastTrackApproval({
  description,
  type,
  cost,
  onGoDashboard,
  claimRpAwarded = null,
}) {
  const verifyingMessages = useMemo(
    () => ["Verifying request...", "Validating conditions...", "Approved"],
    []
  );

  const progressSteps = useMemo(
    () => ["Request Submitted", "Evaluated", "Approved", "Allocated"],
    []
  );

  const [verifyingIndex, setVerifyingIndex] = useState(0);
  const [showMain, setShowMain] = useState(false);

  // Allocation sequential status
  const allocationStatuses = useMemo(
    () => ["Reserving funds...", "Allocating to provider...", "Allocation complete"],
    []
  );
  const [allocIndex, setAllocIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Make each step feel realistic (~5.5s per step).
    const STEP_MS = 5600;
    const t1 = window.setTimeout(
      () => !cancelled && setVerifyingIndex(1),
      STEP_MS
    );
    const t2 = window.setTimeout(
      () => !cancelled && setVerifyingIndex(2),
      STEP_MS * 2
    );
    const t3 = window.setTimeout(() => {
      if (cancelled) return;
      setShowMain(true);
      setAllocIndex(0);
      window.setTimeout(() => setAllocIndex(1), STEP_MS);
      window.setTimeout(() => setAllocIndex(2), STEP_MS * 2);
    }, STEP_MS * 3);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const activeProgressIdx =
    allocIndex === 0 ? 1 : allocIndex === 1 ? 2 : 3;

  const checkGlowPulse =
    verifyingIndex === 2 && !showMain
      ? "fasttrack-check-pulse"
      : "fasttrack-check-pulse";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes fasttrack-glowPulse {
          0% { box-shadow: 0 0 0 rgba(181,236,52,0); transform: translateY(0) scale(1); }
          35% { box-shadow: 0 0 45px rgba(181,236,52,0.18), 0 0 90px rgba(181,236,52,0.08); transform: translateY(-1px) scale(1.02); }
          70% { box-shadow: 0 0 25px rgba(181,236,52,0.12), 0 0 60px rgba(181,236,52,0.06); transform: translateY(0) scale(1); }
          100% { box-shadow: 0 0 0 rgba(181,236,52,0); transform: translateY(0) scale(1); }
        }
        .fasttrack-check-pulse {
          animation: fasttrack-glowPulse 1.1s ease-in-out infinite;
        }
        @keyframes allocFlow {
          from { transform: translateX(0%); opacity: 0; }
          10% { opacity: 1; }
          to { transform: translateX(100%); opacity: 1; }
        }
        @keyframes particleDrift {
          0% { transform: translateX(-10px); opacity: 0; }
          15% { opacity: 0.95; }
          60% { opacity: 0.95; }
          100% { transform: translateX(10px); opacity: 0; }
        }
      `}</style>

      <FaintBackground />

      <div
        style={{
          width: "100%",
          maxWidth: 860,
          position: "relative",
          zIndex: 1,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          padding: "28px 28px",
          boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
        }}
      >
        {!showMain ? (
          <div
            style={{
              minHeight: 420,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 999,
                border: "1px solid rgba(181,236,52,0.25)",
                background: "rgba(181,236,52,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: ACCENT,
                fontWeight: 950,
                fontSize: 26,
              }}
            >
              {verifyingIndex === 2 ? "✓" : "•"}
            </div>

            <div
              style={{
                textAlign: "center",
                color: "rgba(241,245,249,0.92)",
                fontWeight: 900,
                letterSpacing: "-0.01em",
                fontSize: 18,
              }}
            >
              {verifyingMessages[verifyingIndex]}
            </div>

            <div
              style={{
                width: 360,
                height: 2,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((verifyingIndex + 1) / 3) * 100}%`,
                  background: ACCENT,
                  opacity: 0.7,
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <RpEarnedNotice
              pointsEarned={claimRpAwarded}
              subtitle="for complete documentation"
              marginTop={0}
              style={{ marginBottom: 18 }}
            />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div
                className={checkGlowPulse}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: "1px solid rgba(181,236,52,0.45)",
                  background: "rgba(181,236,52,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: ACCENT,
                  fontWeight: 950,
                  boxShadow: "0 0 28px rgba(181,236,52,0.18)",
                  flex: "0 0 auto",
                }}
              >
                ✓
              </div>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(181,236,52,0.6)",
                  }}
                >
                  Fast-track approval
                </p>
                <h1
                  style={{
                    margin: "8px 0 0",
                    fontSize: "clamp(1.7rem, 3.1vw, 2.3rem)",
                    fontWeight: 950,
                    color: "#f1f5f9",
                    textTransform: "uppercase",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Fast-Track Approval
                </h1>
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.92)",
                    maxWidth: 720,
                  }}
                >
                  You’re covered. Proceed with treatment.
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "rgba(148,163,184,0.95)",
                  }}
                >
                  The system has committed resources for your care.
                </p>
              </div>
            </div>

            {/* progress */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {progressSteps.map((s, idx) => {
                  const state =
                    idx < activeProgressIdx
                      ? "done"
                      : idx === activeProgressIdx
                      ? "active"
                      : "pending";
                  const color =
                    state === "done"
                      ? "rgba(181,236,52,0.95)"
                      : state === "active"
                      ? "rgba(181,236,52,0.95)"
                      : "rgba(148,163,184,0.55)";
                  return (
                    <div
                      key={s}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border:
                          state === "active"
                            ? "1px solid rgba(181,236,52,0.45)"
                            : "1px solid rgba(255,255,255,0.08)",
                        background:
                          state === "active"
                            ? "rgba(181,236,52,0.08)"
                            : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: color,
                          boxShadow:
                            state === "active"
                              ? "0 0 18px rgba(181,236,52,0.25)"
                              : "none",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: 18,
                marginTop: 18,
              }}
            >
              {/* Your Case */}
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(181,236,52,0.18)",
                  background:
                    "linear-gradient(180deg, rgba(181,236,52,0.08), rgba(255,255,255,0.01))",
                  padding: 18,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(181,236,52,0.7)",
                  }}
                >
                  Your Case
                </p>

                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      Description
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        color: "rgba(241,245,249,0.92)",
                        lineHeight: 1.6,
                      }}
                    >
                      {description || "—"}
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ color: ACCENT, fontWeight: 950 }}>✓</span>
                      <span style={{ fontSize: 13, color: "rgba(241,245,249,0.92)" }}>
                        Support: Confirmed
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ color: ACCENT, fontWeight: 950 }}>✓</span>
                      <span style={{ fontSize: 13, color: "rgba(241,245,249,0.92)" }}>
                        Coverage: Full
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approved because */}
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.01)",
                  padding: 18,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Approved because:
                </p>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: ACCENT, fontWeight: 950 }}>✓</span>
                    <span style={{ fontSize: 13, color: "rgba(241,245,249,0.92)", lineHeight: 1.4 }}>
                      Treatment is common
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: ACCENT, fontWeight: 950 }}>✓</span>
                    <span style={{ fontSize: 13, color: "rgba(241,245,249,0.92)", lineHeight: 1.4 }}>
                      Cost is within expected range
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: ACCENT, fontWeight: 950 }}>✓</span>
                    <span style={{ fontSize: 13, color: "rgba(241,245,249,0.92)", lineHeight: 1.4 }}>
                      Evidence is sufficient
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation section */}
            <div
              style={{
                marginTop: 18,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.01)",
                padding: 18,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                Allocating Resources
              </p>

              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                {/* sequential allocation text */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(181,236,52,0.18)",
                    background: "rgba(181,236,52,0.06)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: ACCENT,
                      boxShadow:
                        allocIndex === 2
                          ? "0 0 28px rgba(181,236,52,0.25)"
                          : "0 0 18px rgba(181,236,52,0.18)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: "rgba(241,245,249,0.92)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {allocationStatuses[allocIndex]}
                  </span>
                </div>

                {/* flow visual */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    padding: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(181,236,52,0.22)",
                        background: "rgba(181,236,52,0.06)",
                        color: "rgba(181,236,52,0.95)",
                        fontSize: 12,
                        fontWeight: 950,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Pool
                    </div>

                    <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
                      {/* base line */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          right: 0,
                          height: 2,
                          transform: "translateY(-50%)",
                          background: "rgba(181,236,52,0.18)",
                        }}
                      />

                      {/* traveling flow */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          height: 2,
                          width: "35%",
                          transform: "translateY(-50%)",
                          background:
                            "linear-gradient(90deg, rgba(181,236,52,0.95), rgba(56,189,248,0.25))",
                          opacity: allocIndex > 0 ? 1 : 0.2,
                          animation:
                            allocIndex > 0 ? "allocFlow 1.1s ease-in-out infinite" : "none",
                        }}
                      />

                      {/* particles */}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: `${(i + 1) * 14}%`,
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: "rgba(181,236,52,0.95)",
                            transform: "translate(-50%, -50%)",
                            boxShadow: "0 0 24px rgba(181,236,52,0.22)",
                            opacity: allocIndex > 0 ? 1 : 0.15,
                            animation:
                              allocIndex > 0
                                ? `particleDrift 0.9s ease-in-out infinite`
                                : "none",
                            animationDelay: `${i * 120}ms`,
                          }}
                        />
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.02)",
                        color: "rgba(241,245,249,0.92)",
                        fontSize: 12,
                        fontWeight: 950,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
                      Treatment Provider
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
              <button
                type="button"
                onClick={onGoDashboard}
                style={{
                  padding: "14px 34px",
                  borderRadius: 999,
                  border: "1px solid rgba(181,236,52,0.55)",
                  background: ACCENT,
                  color: "#050505",
                  fontSize: 12,
                  fontWeight: 950,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: "0 0 28px rgba(181,236,52,0.20)",
                  whiteSpace: "nowrap",
                }}
              >
                Proceed to Treatment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

