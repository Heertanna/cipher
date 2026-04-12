import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { FaintBackground } from "./OnboardingCommon.jsx";
import { API_URL } from "../config/api.js";

const AMBER = "#fbbf24";
const GREEN = "#b5ec34";

function LockCircle({ active, variant }) {
  const isGreen = variant === "green";
  const isYellow = variant === "yellow";
  const border = !active
    ? "1px solid rgba(255,255,255,0.1)"
    : isGreen
      ? "1px solid rgba(181,236,52,0.6)"
      : "1px solid rgba(251,191,36,0.6)";
  const bg = !active
    ? "rgba(15,23,42,0.6)"
    : isGreen
      ? "rgba(181,236,52,0.08)"
      : "rgba(251,191,36,0.08)";
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        color: active ? (isGreen ? GREEN : AMBER) : "rgba(148,163,184,0.35)",
        transition: "border-color 0.2s, background 0.2s, color 0.2s",
      }}
    >
      🔒
    </div>
  );
}

export function ReEvaluationFlow() {
  const { juryCaseId } = useParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState(1);
  const [dimCount, setDimCount] = useState(0);
  const [litCount, setLitCount] = useState(0);
  const [newJuryCaseId, setNewJuryCaseId] = useState(null);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/jury/case/${juryCaseId}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Could not load jury case");
        const assignRes = await fetch(`${API_URL}/jury/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claim_id: j.claim_id }),
        });
        const a = await assignRes.json();
        if (!assignRes.ok) throw new Error(a?.error || "Could not assign new panel");
        if (!cancelled) setNewJuryCaseId(Number(a.jury_case_id));
      } catch (e) {
        if (!cancelled) setAssignError(e?.message || "Assignment failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [juryCaseId]);

  useEffect(() => {
    if (stage === 1) {
      const t = setTimeout(() => setStage(2), 2000);
      return () => clearTimeout(t);
    }
    if (stage === 2) {
      setDimCount(0);
      let n = 0;
      const iv = setInterval(() => {
        n += 1;
        setDimCount(n);
        if (n >= 8) clearInterval(iv);
      }, 200);
      const t = setTimeout(() => {
        clearInterval(iv);
        setStage(3);
      }, 2000);
      return () => {
        clearInterval(iv);
        clearTimeout(t);
      };
    }
    if (stage === 3) {
      setLitCount(0);
      const iv = setInterval(() => {
        setLitCount((c) => (c >= 8 ? c : c + 1));
      }, 300);
      const t = setTimeout(() => {
        clearInterval(iv);
        setStage(4);
      }, 3000);
      return () => {
        clearInterval(iv);
        clearTimeout(t);
      };
    }
  }, [stage]);

  const grid = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 20 }}>
      {Array.from({ length: 8 }, (_, i) => {
        if (stage === 2) {
          const active = i >= dimCount;
          return <LockCircle key={i} active={active} variant="yellow" />;
        }
        if (stage === 3) {
          const active = i < litCount;
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <LockCircle active={active} variant="green" />
              {active && i === litCount - 1 ? (
                <p style={{ margin: "6px 0 0", fontSize: 9, color: "rgba(148,163,184,0.85)" }}>Reviewer secured</p>
              ) : null}
            </div>
          );
        }
        return <LockCircle key={i} active={false} variant="yellow" />;
      })}
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "#02030a",
        padding: "48px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
      }}
    >
      <FaintBackground />
      <Motion.div
        key={stage}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ position: "relative", zIndex: 1, maxWidth: 520, width: "100%", textAlign: "center" }}
      >
        {stage === 1 && (
          <>
            <Motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: 56, marginBottom: 16, color: AMBER }}
            >
              ↻
            </Motion.div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.35rem, 4vw, 1.75rem)", fontWeight: 800, color: AMBER }}>
              Insufficient Confidence Detected
            </h1>
            <p style={{ margin: "14px 0 0", fontSize: 15, color: "rgba(148,163,184,0.9)", lineHeight: 1.55 }}>
              The protocol has flagged this case for additional review
            </p>
            <p style={{ marginTop: 12, fontSize: 12, color: AMBER, letterSpacing: "0.2em" }}>CASE ESCALATED</p>
          </>
        )}

        {stage === 2 && (
          <>
            <h1 style={{ margin: 0, fontSize: "clamp(1.25rem, 3.5vw, 1.6rem)", fontWeight: 800, color: "#e2e8f0" }}>
              Releasing Current Panel
            </h1>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "rgba(148,163,184,0.88)" }}>
              Juror assignments cleared. Independence restored.
            </p>
            {grid}
          </>
        )}

        {stage === 3 && (
          <>
            <h1 style={{ margin: 0, fontSize: "clamp(1.25rem, 3.5vw, 1.6rem)", fontWeight: 800, color: GREEN }}>
              Selecting New Reviewers
            </h1>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "rgba(148,163,184,0.88)" }}>
              A fresh panel is being drawn from the verified network
            </p>
            {grid}
          </>
        )}

        {stage === 4 && (
          <>
            <h1 style={{ margin: 0, fontSize: "clamp(1.35rem, 4vw, 1.85rem)", fontWeight: 800, color: GREEN }}>
              New Panel Assembled
            </h1>
            <p style={{ margin: "14px 0 0", fontSize: 15, color: "rgba(226,232,240,0.92)", lineHeight: 1.55 }}>
              Your case has been reassigned to a fresh jury of 8 reviewers
            </p>
            <p style={{ margin: "22px 0 8px", fontSize: 14, color: "rgba(148,163,184,0.9)" }}>
              Case Reference:{" "}
              <span style={{ color: GREEN, fontWeight: 700 }}>
                #JC-
                {newJuryCaseId != null ? String(newJuryCaseId).padStart(3, "0") : "—"}
              </span>
            </p>
            {assignError ? (
              <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{assignError}</p>
            ) : null}
            <button
              type="button"
              onClick={() => navigate("/juror-dashboard")}
              style={{
                marginTop: 28,
                padding: "14px 28px",
                borderRadius: 999,
                border: `1px solid rgba(181,236,52,0.45)`,
                background: GREEN,
                color: "#020617",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Back to dashboard
            </button>
          </>
        )}
      </Motion.div>
    </div>
  );
}
