import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useLiveJuryProgress } from "../data/useLiveData.js";

const STORAGE_KEY = "cipher_claims_demo";

const GLASS_CARD = {
  background:
    "linear-gradient(135deg, rgba(181,236,52,0.06) 0%, rgba(10,16,28,0.8) 40%, rgba(10,16,28,0.9) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(181,236,52,0.1)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(181,236,52,0.05)",
};

const LIVE_CASES_SECTION_GLASS = {
  background:
    "linear-gradient(145deg, rgba(181,236,52,0.05) 0%, rgba(10,16,28,0.85) 30%, rgba(10,16,28,0.9) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(181,236,52,0.1)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(181,236,52,0.05)",
};

const STATIC_CASES = [
  {
    id: "A392",
    title: "Knee injury triage",
    stage: "Symptoms",
    status: "Under review",
    progress: 28,
    jurorCount: 8,
    description:
      "Acute knee injury after road accident. Imaging and reports uploaded. Pre-check is validating completeness.",
  },
  {
    id: "B118",
    title: "Migraine case review",
    stage: "Diagnosis",
    status: "Under review",
    progress: 53,
    jurorCount: 8,
    description:
      "Chronic migraine management plan. Medication history shared. Jury review is assessing risk, eligibility, and documentation consistency.",
  },
  {
    id: "C172",
    title: "Reimbursement decision",
    stage: "Decision",
    status: "Under review",
    progress: 84,
    jurorCount: 8,
    description:
      "Post-surgery physiotherapy reimbursement request. Decision stage is preparing payout recommendation and final notes.",
  },
];

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadDynamicJuryCases() {
  const claimsRaw = window.localStorage.getItem(STORAGE_KEY);
  const claims = safeParse(claimsRaw) || [];
  const juryClaims = claims.filter(
    (c) => c && (c.stage === "Jury review" || c.status === "Under Jury Review")
  );

  return juryClaims.slice(0, 2).map((c) => ({
    id: c.id,
    title: "Peer review case",
    stage: c.stageDetail || "Review in progress",
    status: c.status || "Under Jury Review",
    // ClaimsCard uses stage-based progress, but the spectate cards want a number.
    progress: c.stage === "Jury review" ? 50 : c.progress || 40,
    jurorCount: c.jurorCount || 8,
    description:
      c.anonymizedDescription ||
      c.anonymizedText ||
      "An anonymized medical case is being evaluated by a jury.",
  }));
}

function useIsMobile(breakpointPx = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const apply = () => setIsMobile(Boolean(mql.matches));
    apply();
    if (mql.addEventListener) mql.addEventListener("change", apply);
    else mql.addListener(apply);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", apply);
      else mql.removeListener(apply);
    };
  }, [breakpointPx]);

  return isMobile;
}

function LiveCaseDocumentCard({ c, index, onClick }) {
  const isPending = String(c.status || "").toLowerCase().includes("pending");
  const stampColor = isPending ? "rgba(255,200,50,0.8)" : "#b5ec34";
  const stampLabel = isPending ? "PENDING" : "REVIEW";
  const stampRotate = index % 2 === 0 ? "rotate(-2deg)" : "rotate(1deg)";
  const progressWidth = `${Math.max(0, Math.min(100, Number(c.progress) || 0))}%`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="livecase-glass-interactive"
      style={{
        ...GLASS_CARD,
        width: "100%",
        textAlign: "left",
        overflow: "visible",
        position: "relative",
        padding: 4,
        cursor: "pointer",
        minHeight: 480,
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -16,
          left: "50%",
          transform: "translateX(-50%)",
          width: 80,
          height: 28,
          background: "rgba(181,236,52,0.15)",
          border: "2px solid rgba(181,236,52,0.25)",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid rgba(181,236,52,0.4)",
            background: "rgba(6,8,16,0.9)",
          }}
        />
      </div>

      <div
        style={{
          border: "1px solid rgba(181,236,52,0.08)",
          borderRadius: 4,
          background: "rgba(10,16,28,0.9)",
          minHeight: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "rgba(181,236,52,0.06)",
            padding: "12px 20px",
            borderBottom: "1px solid rgba(181,236,52,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(181,236,52,0.7)",
              letterSpacing: "0.04em",
            }}
          >
            CASE {c.id}
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.12em",
              color: "rgba(181,236,52,0.3)",
              textTransform: "uppercase",
            }}
          >
            CONFIDENTIAL
          </span>
        </div>

        <div
          style={{
            padding: "24px 22px",
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 32px, rgba(181,236,52,0.04) 32px, rgba(181,236,52,0.04) 33px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid rgba(181,236,52,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#b5ec34",
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase",
              }}
            >
              FILED: 18 APR 2026
            </span>
            <span
              style={{
                border: "2px solid rgba(181,236,52,0.35)",
                padding: "4px 12px",
                fontSize: 14,
                letterSpacing: "0.12em",
                color: stampColor,
                transform: stampRotate,
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {stampLabel}
            </span>
          </div>

          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: 10,
              marginBottom: 20,
              marginTop: 10,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Patient complaint
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{c.title}</div>
          </div>

          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: 10,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Clinical summary
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              {c.description}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                Stage
              </div>
              <div style={{ fontSize: 14, color: "#b5ec34" }}>{c.stage}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                Jury panel
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                {c.jurorCount} of {c.jurorCount}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div
              style={{
                height: 2,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 1,
                position: "relative",
                overflow: "visible",
              }}
            >
              <div
                style={{
                  height: 2,
                  background: "#b5ec34",
                  width: progressWidth,
                  borderRadius: 1,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    right: -2.5,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#b5ec34",
                    boxShadow: "0 0 10px rgba(181,236,52,0.9)",
                    animation: "liveCasePulse 1.6s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "rgba(255,255,255,0.15)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {Math.round(Number(c.progress) || 0)}% COMPLETE
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function LiveCaseFocusOverlay({ c, onClose }) {
  const liveAssignment = useLiveJuryProgress(c?.id);
  const livePanel = Number(liveAssignment?.juryPanel || c?.jurorCount || 8);
  const liveVoted = Math.min(livePanel, Number(liveAssignment?.juryVoted || c?.juryVoted || 0));
  const progress =
    livePanel > 0
      ? Math.max(0, Math.min(100, Math.round((liveVoted / livePanel) * 100)))
      : Math.max(0, Math.min(100, Number(c?.progress) || 38));
  const timelineSteps = [
    { label: "Claim submitted", date: "18 Apr 2026", state: "completed" },
    { label: "Documents verified", date: "18 Apr 2026", state: "completed" },
    { label: "Jury assigned (8 jurors)", date: "19 Apr 2026", state: "completed" },
    { label: "Review in progress", date: "Now", state: "current" },
    { label: "Decision pending", date: "", state: "pending" },
  ];

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <Motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...GLASS_CARD,
          width: "100%",
          maxWidth: 860,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 24,
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.35)",
            color: "rgba(255,255,255,0.92)",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
          }}
          aria-label="Close case details"
        >
          ×
        </button>
        <div style={{ position: "relative", paddingTop: 18 }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 90,
              height: 28,
              background: "rgba(181,236,52,0.14)",
              border: "2px solid rgba(181,236,52,0.25)",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid rgba(181,236,52,0.4)",
                background: "rgba(6,8,16,0.95)",
              }}
            />
          </div>

          <div
            style={{
              border: "1.5px solid rgba(181,236,52,0.12)",
              borderRadius: 8,
              background: "rgba(10,16,28,0.95)",
              minHeight: 540,
              overflow: "hidden",
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 34px, rgba(181,236,52,0.035) 34px, rgba(181,236,52,0.035) 35px)",
            }}
          >
            <div
              style={{
                background: "rgba(181,236,52,0.06)",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(181,236,52,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(181,236,52,0.75)",
                  letterSpacing: "0.04em",
                }}
              >
                CASE {c.id}
              </span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.14em",
                  color: "rgba(181,236,52,0.35)",
                  textTransform: "uppercase",
                }}
              >
                CONFIDENTIAL
              </span>
            </div>

            <div style={{ padding: "18px 20px 20px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <span
                  style={{
                    border: "2px solid rgba(181,236,52,0.35)",
                    padding: "4px 12px",
                    fontSize: 14,
                    letterSpacing: "0.12em",
                    color: "#b5ec34",
                    transform: "rotate(-2deg)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {String(c.status || "UNDER REVIEW").toUpperCase()}
                </span>
              </div>

              <FieldBlock label="PATIENT COMPLAINT">
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{c.title}</div>
              </FieldBlock>
              <FieldBlock label="DATE FILED">
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>18 Apr 2026</div>
              </FieldBlock>
              <FieldBlock label="CLINICAL SUMMARY">
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                  {c.description}
                </div>
              </FieldBlock>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <FieldBlock label="STAGE">
                  <div style={{ fontSize: 15, color: "#b5ec34" }}>{c.stage}</div>
                </FieldBlock>
                <FieldBlock label="JURY PANEL">
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)" }}>
                    {liveVoted} of {livePanel}
                  </div>
                </FieldBlock>
              </div>

              <div style={{ marginTop: 10, marginBottom: 20 }}>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                  <div
                    style={{
                      height: 4,
                      background: "#b5ec34",
                      width: `${progress}%`,
                      borderRadius: 2,
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {Math.round(progress)}% complete
                </div>
              </div>

              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.15em",
                  color: "rgba(181,236,52,0.5)",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                CASE TIMELINE
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {timelineSteps.map((step, idx) => {
                  const isCompleted = step.state === "completed";
                  const isCurrent = step.state === "current";
                  const dotBg = isCurrent || isCompleted ? "#b5ec34" : "rgba(255,255,255,0.15)";
                  return (
                    <div key={`${step.label}-${idx}`} style={{ display: "flex", gap: 14 }}>
                      <div
                        style={{
                          width: 12,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: dotBg,
                            boxShadow: isCurrent ? "0 0 12px rgba(181,236,52,0.75)" : "none",
                          }}
                        />
                        {idx < timelineSteps.length - 1 ? (
                          <span
                            style={{
                              width: 2,
                              flex: 1,
                              marginTop: 4,
                              minHeight: 18,
                              background: "rgba(181,236,52,0.12)",
                            }}
                          />
                        ) : null}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", flex: 1, gap: 10 }}>
                        <span style={{ color: "rgba(255,255,255,0.88)", fontSize: 14 }}>{step.label}</span>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 14,
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {step.date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Motion.div>
    </Motion.div>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 14,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{children}</div>
    </div>
  );
}

export function LiveCasesStack() {
  const isMobile = useIsMobile(900);

  const dynamicCases = useMemo(() => loadDynamicJuryCases(), []);
  const allCases = useMemo(() => [...dynamicCases, ...STATIC_CASES], [dynamicCases]);

  const [selectedId, setSelectedId] = useState(() => {
    const focusId = window.localStorage.getItem("cipher_focus_case_id");
    if (!focusId) return null;
    const exists = allCases.some((c) => c.id === focusId);
    return exists ? focusId : null;
  });

  const selected = useMemo(
    () => (selectedId ? allCases.find((c) => c.id === selectedId) : null),
    [selectedId, allCases]
  );

  useEffect(() => {
    window.localStorage.removeItem("cipher_focus_case_id");
  }, []);

  const deckHeight = 300;

  if (isMobile) {
    return (
      <section
        style={{
          ...LIVE_CASES_SECTION_GLASS,
          padding: 28,
          marginTop: 14,
          overflow: "visible",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(181,236,52,0.5)",
            }}
          >
            Live Cases
          </p>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14, letterSpacing: "0.12em" }}>
            SPECTATE
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {allCases.map((c, index) => (
            <LiveCaseDocumentCard
              key={c.id}
              c={c}
              index={index}
              onClick={() => setSelectedId(c.id)}
            />
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <LiveCaseFocusOverlay
              c={selected}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </section>
    );
  }

  return (
    <section
      style={{
        ...LIVE_CASES_SECTION_GLASS,
        padding: 28,
        marginTop: 14,
        overflow: "visible",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(181,236,52,0.5)",
          }}
        >
          Live Cases
        </p>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14, letterSpacing: "0.12em" }}>
          SPECTATE
        </span>
      </div>

      {/* Desktop: three cards side-by-side */}
      <Motion.div
        initial={false}
        animate={{
          opacity: selectedId ? 0.12 : 1,
          filter: selectedId ? "blur(1px)" : "none",
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{
          minHeight: deckHeight,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          alignItems: "stretch",
          padding: 0,
          pointerEvents: selectedId ? "none" : "auto",
        }}
      >
        {allCases.map((c, index) => (
          <div key={c.id} style={{ height: "100%" }}>
            <LiveCaseDocumentCard
              c={c}
              index={index}
              onClick={() => setSelectedId(c.id)}
            />
          </div>
        ))}
      </Motion.div>

      {/* focus overlay */}
      <AnimatePresence>
        {selected && (
          <LiveCaseFocusOverlay
            c={selected}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
      <style>{`
        @keyframes liveCasePulse {
          0%, 100% { opacity: 0.75; transform: translateY(-50%) scale(1); }
          50% { opacity: 1; transform: translateY(-50%) scale(1.25); }
        }
        @keyframes timelinePulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.35); }
        }
        .livecase-glass-interactive:hover {
          border-color: rgba(181,236,52,0.2);
          box-shadow: 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(181,236,52,0.08);
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  );
}

