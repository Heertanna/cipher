import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";
import { StepItem } from "./StepItem.jsx";

const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms));

function toUiPath(path) {
  return path === "PATH_A" ? "PathA" : "PathB";
}

export function SmartProcessing({ claimData, routeDecision, onContinue }) {
  const path = routeDecision?.path ? toUiPath(routeDecision.path) : "PathB";

  const steps = useMemo(
    () => [
      "Checking treatment validity...",
      "Checking cost range...",
      "Assessing urgency...",
      "Evaluating evidence...",
    ],
    []
  );

  const outcomes = useMemo(() => {
    if (path === "PathA") return ["pass", "pass", "pass", "pass"];
    return ["flag", "flag", "pass", "pass"];
  }, [path]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [stepStates, setStepStates] = useState(() => [
    "loading",
    "idle",
    "idle",
    "idle",
  ]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let i = 0; i < steps.length; i++) {
        if (cancelled) return;

        setActiveIndex(i);
        setStepStates((prev) =>
          prev.map((s, idx) => {
            if (idx < i) return outcomes[idx]; // completed
            if (idx === i) return "loading";
            return "idle";
          })
        );

        await sleep(900);
        if (cancelled) return;

        setStepStates((prev) => prev.map((s, idx) => (idx === i ? outcomes[i] : s)));
        await sleep(260);
      }

      if (cancelled) return;
      setDone(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [outcomes, steps.length]);

  const title =
    path === "PathA"
      ? "✓ Eligible for fast-track approval"
      : "⚠ Requires peer review → Routing to jury";

  const explanation =
    path === "PathA"
      ? "Procedure matched approved list. Moving to automatic processing."
      : `No approved procedure match (${routeDecision?.reason || "procedure_not_recognized"}). Routing to jury review.`;

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2200,
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `}</style>

      <Motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: 740,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.86))",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
          padding: 22,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: ACCENT,
          }}
        >
          Running Protocol Checks
        </p>

        <p
          style={{
            margin: "10px 0 16px",
            fontSize: 14,
            color: "rgba(148,163,184,0.95)",
            lineHeight: 1.6,
          }}
        >
          Evaluating claim using system rules...
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {steps.map((label, idx) => (
            <Motion.div
              key={label}
              initial={false}
              animate={{ opacity: idx <= activeIndex || done ? 1 : 0.62 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <StepItem
                label={label}
                state={stepStates[idx]}
                active={idx === activeIndex && !done}
              />
            </Motion.div>
          ))}
        </div>

        <AnimatePresence>
          {done && (
            <Motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                marginTop: 18,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                padding: 16,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 950,
                  color: path === "PathA" ? ACCENT : "rgba(250,204,21,0.95)",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "rgba(148,163,184,0.95)",
                  lineHeight: 1.6,
                }}
              >
                {explanation}
              </p>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => onContinue?.(path)}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: ACCENT,
                    color: "#050505",
                    fontSize: 12,
                    fontWeight: 950,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Next
                </button>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.div>
    </Motion.div>
  );
}

