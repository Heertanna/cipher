import React, { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";

const FINAL_LABELS = {
  support: "Support",
  furtherReview: "Needs further review",
  doNotSupport: "Do not support",
};

const CONF_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
};

export function JuryPostSubmissionScreen({
  caseId,
  positionAnswer,
  confidenceKey,
  respondedCount = 7,
  totalJurors = 10,
  /** 0–100: share leaning toward Support (right side) */
  supportLeanPercent = 62,
  onViewFinalVerdict,
  onReturnDashboard,
  onViewCaseProgress,
}) {
  const [notifyOnDecision, setNotifyOnDecision] = useState(false);

  const positionShort = FINAL_LABELS[positionAnswer] ?? "—";
  const confShort = CONF_LABELS[confidenceKey] ?? confidenceKey ?? "—";

  const selfIndex = Math.max(0, respondedCount - 1);

  const jurorSlots = useMemo(() => {
    const out = [];
    for (let i = 0; i < totalJurors; i++) {
      const responded = i < respondedCount;
      const isSelf = i === selfIndex;
      out.push({ responded, isSelf, key: i });
    }
    return out;
  }, [respondedCount, totalJurors, selfIndex]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "transparent",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <FaintBackground />

      <Motion.main
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 520,
          margin: "0 auto",
          padding: "56px 24px 48px",
        }}
      >
        <Motion.div variants={item} style={{ textAlign: "center", marginBottom: 28 }}>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(1.15rem, 3.2vw, 1.45rem)",
              fontWeight: 800,
              color: "#f9fafb",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}
          >
            ✓ Your evaluation has been recorded
          </p>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 15,
              lineHeight: 1.55,
              color: "rgba(148,163,184,0.9)",
            }}
          >
            You are now part of the collective decision.
          </p>
        </Motion.div>

        <Motion.div
          variants={item}
          style={{
            ...cardStyle,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(181,236,52,0.55)",
            }}
          >
            Jury status
          </p>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 22,
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
            }}
          >
            {respondedCount} / {totalJurors} jurors have responded
          </p>
        </Motion.div>

        <Motion.div variants={item} style={{ ...cardStyle, marginBottom: 18 }}>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.75)",
            }}
          >
            Juror panel
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            {jurorSlots.map((slot) => (
              <Motion.div
                key={slot.key}
                initial={false}
                animate={{
                  scale: slot.isSelf ? 1.08 : 1,
                  opacity: slot.responded ? 1 : 0.35,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                title={slot.isSelf ? "You" : slot.responded ? "Responded" : "Pending"}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: slot.isSelf
                    ? `2px solid ${ACCENT}`
                    : "1px solid rgba(255,255,255,0.12)",
                  background: slot.responded
                    ? slot.isSelf
                      ? "rgba(181,236,52,0.22)"
                      : "rgba(181,236,52,0.12)"
                    : "rgba(30,41,59,0.6)",
                  boxShadow: slot.isSelf
                    ? "0 0 20px rgba(181,236,52,0.35)"
                    : slot.responded
                      ? "0 0 12px rgba(181,236,52,0.12)"
                      : "none",
                }}
              />
            ))}
          </div>
        </Motion.div>

        <Motion.div variants={item} style={{ ...cardStyle, marginBottom: 18 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.8)",
            }}
          >
            Current system leaning
          </p>
          <div
            style={{
              position: "relative",
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <Motion.div
              initial={{ width: 0 }}
              animate={{ width: `${supportLeanPercent}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(248,113,113,0.5) 0%, rgba(181,236,52,0.85) 100%)",
                boxShadow: "0 0 16px rgba(181,236,52,0.25)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.65)",
            }}
          >
            <span>Reject</span>
            <span>Support</span>
          </div>
        </Motion.div>

        <Motion.div variants={item} style={{ ...cardStyle, marginBottom: 18 }}>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.75)",
            }}
          >
            Your contribution
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 650,
              color: "#f9fafb",
              lineHeight: 1.5,
            }}
          >
            Your input: {positionShort} · {confShort} confidence
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 11,
              color: "rgba(148,163,184,0.55)",
            }}
          >
            Case #{caseId}
          </p>
        </Motion.div>

        <Motion.div variants={item} style={{ ...cardStyle, marginBottom: 18 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 650,
              color: "rgba(226,232,240,0.95)",
            }}
          >
            Final decision pending
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              color: "rgba(148,163,184,0.85)",
            }}
          >
            Awaiting remaining jurors
          </p>
        </Motion.div>

        <Motion.div variants={item} style={{ ...cardStyle, marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 650,
                  color: "rgba(241,245,249,0.96)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.4,
                }}
              >
                Notify me when the decision is made
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "rgba(148,163,184,0.78)",
                }}
              >
                We’ll send an in-app alert when this case reaches a final outcome.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyOnDecision}
              aria-label="Notify when decision is made"
              onClick={() => setNotifyOnDecision((v) => !v)}
              style={{
                flexShrink: 0,
                width: 52,
                height: 30,
                borderRadius: 999,
                border: `1px solid ${
                  notifyOnDecision
                    ? "rgba(181,236,52,0.55)"
                    : "rgba(148,163,184,0.35)"
                }`,
                background: notifyOnDecision
                  ? "rgba(181,236,52,0.22)"
                  : "rgba(15,23,42,0.65)",
                cursor: "pointer",
                padding: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: notifyOnDecision ? "flex-end" : "flex-start",
                transition:
                  "background 0.25s ease, border-color 0.25s ease, justify-content 0.2s ease",
                boxShadow: notifyOnDecision
                  ? "0 0 18px rgba(181,236,52,0.2)"
                  : "none",
              }}
            >
              <Motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: notifyOnDecision ? ACCENT : "rgba(148,163,184,0.45)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                }}
              />
            </button>
          </div>
        </Motion.div>

        <Motion.div
          variants={item}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() =>
              onViewFinalVerdict?.({ notifyOnDecision })
            }
            style={{
              width: "100%",
              padding: "14px 22px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
              border: "1px solid rgba(181,236,52,0.55)",
              background: ACCENT,
              color: "#020617",
              boxShadow: "0 0 28px rgba(181,236,52,0.2)",
            }}
          >
            View Final Verdict
          </button>
          <button
            type="button"
            onClick={() =>
              onReturnDashboard?.({ notifyOnDecision })
            }
            style={{
              width: "100%",
              padding: "14px 22px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              border: "1px solid rgba(148,163,184,0.4)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(226,232,240,0.92)",
            }}
          >
            Return to dashboard
          </button>
          <button
            type="button"
            onClick={() =>
              onViewCaseProgress?.({ notifyOnDecision })
            }
            style={{
              width: "100%",
              padding: "14px 22px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              border: "1px solid rgba(148,163,184,0.25)",
              background: "transparent",
              color: "rgba(148,163,184,0.88)",
            }}
          >
            View case progress
          </button>
        </Motion.div>
      </Motion.main>
    </div>
  );
}

const cardStyle = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(14px)",
  padding: "18px 18px 16px",
};
