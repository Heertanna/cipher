import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
              fontSize: 9,
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
                fontSize: 10,
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
                fontSize: 11,
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
                fontSize: 10,
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
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Clinical summary
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
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
                  fontSize: 10,
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
                  fontSize: 10,
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
                fontSize: 10,
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

function LiveCaseFocusOverlay({ c, onClose, onBackHome }) {
  const progress = Math.max(0, Math.min(100, Number(c?.progress) || 38));
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
        background: "transparent",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          padding: "20px clamp(12px, 2vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(6, 8, 16, 0.9)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <img
            src="/cipher-logo.png"
            alt="Cipher"
            style={{ width: 24, height: 24, display: "block", objectFit: "contain" }}
          />
          <span
            style={{
              color: "#b5ec34",
              fontSize: 13,
              letterSpacing: "0.16em",
              fontWeight: 800,
            }}
          >
            CIPHER
          </span>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px 14px",
            color: "rgba(255,255,255,0.62)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {["Protocol", "How It Works", "Governance", "Documentation"].map((item) => (
            <button
              key={item}
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: "4px 2px",
                font: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                cursor: "pointer",
                transition: "color 160ms ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
                maxWidth: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.62)";
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onBackHome}
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "10px 22px",
            borderRadius: "20px",
            cursor: "pointer",
            fontWeight: 700,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          BACK TO HOME
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          fontSize: 12,
          color: "rgba(181,236,52,0.5)",
          cursor: "pointer",
          padding: "20px 48px",
          border: "none",
          background: "transparent",
        }}
      >
        ← BACK TO HUB
      </button>

      <div style={{ position: "relative", maxWidth: 700, margin: "40px auto", padding: "0 12px" }}>
        <div
          style={{
            position: "absolute",
            top: -20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 90,
              height: 30,
              background: "rgba(181,236,52,0.12)",
              border: "2px solid rgba(181,236,52,0.25)",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid rgba(181,236,52,0.4)",
                background: "rgba(6,8,16,0.92)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            ...GLASS_CARD,
            padding: 5,
          }}
        >
          <div
            style={{
              border: "1.5px solid rgba(181,236,52,0.1)",
              borderRadius: 6,
              background: "rgba(10,16,28,0.95)",
              minHeight: 550,
              position: "relative",
              overflow: "hidden",
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 34px, rgba(181,236,52,0.035) 34px, rgba(181,236,52,0.035) 35px)",
            }}
          >
            <div
              style={{
                background: "rgba(181,236,52,0.05)",
                padding: "18px 28px",
                borderBottom: "1px solid rgba(181,236,52,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontWeight: 700,
                  color: "rgba(181,236,52,0.7)",
                }}
              >
                CASE {c.id}
              </div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "rgba(181,236,52,0.3)",
                  textTransform: "uppercase",
                }}
              >
                CONFIDENTIAL
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                top: 140,
                right: 28,
                border: "2px solid rgba(181,236,52,0.35)",
                padding: "5px 16px",
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "#b5ec34",
                fontWeight: 700,
                transform: "rotate(-4deg)",
                textTransform: "uppercase",
                zIndex: 2,
                background: "rgba(6,8,16,0.6)",
              }}
            >
              {String(c.status || "UNDER REVIEW").toUpperCase()}
            </div>

            <div style={{ borderLeft: "2px solid rgba(181,236,52,0.08)", marginLeft: 18 }}>
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "2px solid rgba(181,236,52,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#b5ec34" }}>+</span>
                </div>
              </div>

              <div style={{ padding: "0 28px", paddingLeft: 28 }}>
                <FieldBlock label="PATIENT COMPLAINT">
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{c.title}</div>
                </FieldBlock>

                <FieldBlock label="DATE FILED">
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>18 Apr 2026</div>
                </FieldBlock>

                <FieldBlock label="CLINICAL SUMMARY">
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                    {c.description}
                  </div>
                </FieldBlock>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <FieldBlock label="STAGE">
                    <div style={{ fontSize: 15, color: "#b5ec34" }}>{c.stage}</div>
                  </FieldBlock>
                  <FieldBlock label="JURY PANEL">
                    <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>
                      {c.jurorCount} of {c.jurorCount}
                    </div>
                  </FieldBlock>
                </div>
              </div>

              <div style={{ padding: "0 28px 24px", paddingLeft: 28 }}>
                <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 1.5 }}>
                  <div
                    style={{
                      height: 3,
                      background: "#b5ec34",
                      width: `${progress}%`,
                      borderRadius: 1.5,
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 9,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    color: "rgba(255,255,255,0.15)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {Math.round(progress)}% COMPLETE
                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: 16,
                fontSize: 8,
                color: "rgba(255,255,255,0.08)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              PAGE 1 OF 1
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          ...GLASS_CARD,
          maxWidth: 700,
          margin: "24px auto",
          padding: 24,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "rgba(181,236,52,0.5)",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          CASE TIMELINE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {timelineSteps.map((step, idx) => {
            const isCompleted = step.state === "completed";
            const isCurrent = step.state === "current";
            const dotBg = isCurrent
              ? "#b5ec34"
              : isCompleted
                ? "#b5ec34"
                : "rgba(255,255,255,0.1)";
            return (
              <div key={`${step.label}-${idx}`} style={{ display: "flex", gap: 16 }}>
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
                      boxShadow: isCurrent ? "0 0 12px rgba(181,236,52,0.8)" : "none",
                      animation: isCurrent ? "timelinePulse 1.4s ease-in-out infinite" : "none",
                    }}
                  />
                  {idx < timelineSteps.length - 1 ? (
                    <span
                      style={{
                        width: 2,
                        flex: 1,
                        marginTop: 4,
                        minHeight: 22,
                        background: "rgba(181,236,52,0.1)",
                      }}
                    />
                  ) : null}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flex: 1, gap: 10 }}>
                  <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{step.label}</span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 11,
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
    </Motion.div>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 10,
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
  const navigate = useNavigate();
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
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(181,236,52,0.5)",
            }}
          >
            Live Cases
          </p>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.12em" }}>
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
              onBackHome={() => {
                navigate("/");
                window.scrollTo(0, 0);
              }}
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
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(181,236,52,0.5)",
          }}
        >
          Live Cases
        </p>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.12em" }}>
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
            onBackHome={() => {
              navigate("/");
              window.scrollTo(0, 0);
            }}
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

