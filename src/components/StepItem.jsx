import React from "react";
import { motion as Motion } from "framer-motion";

function Spinner() {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        border: "2px solid rgba(255,255,255,0.18)",
        borderTopColor: "rgba(181,236,52,0.95)",
        animation: "spin 0.95s linear infinite",
      }}
    />
  );
}

export function StepItem({ label, state, active }) {
  // state: "loading" | "pass" | "flag" | "idle"
  const isLoading = state === "loading";
  const isPass = state === "pass";
  const isFlag = state === "flag";
  const isIdle = state === "idle";

  const icon = isPass ? "✓" : isFlag ? "⚠" : null;

  const accent =
    isPass
      ? "rgba(181,236,52,0.95)"
      : isFlag
      ? "rgba(250,204,21,0.95)"
      : "rgba(148,163,184,0.8)";

  const bg =
    isPass
      ? "rgba(181,236,52,0.12)"
      : isFlag
      ? "rgba(250,204,21,0.12)"
      : "rgba(148,163,184,0.08)";

  const border =
    isPass
      ? "1px solid rgba(181,236,52,0.35)"
      : isFlag
      ? "1px solid rgba(250,204,21,0.35)"
      : "1px solid rgba(255,255,255,0.10)";

  return (
    <Motion.div
      initial={false}
      animate={{
        opacity: isIdle ? 0.58 : 1,
        scale: active ? 1.02 : 1,
        borderColor: active ? "rgba(181,236,52,0.55)" : "rgba(255,255,255,0.10)",
      }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      style={{
        borderRadius: 14,
        padding: "12px 14px",
        border: border,
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: bg,
          border: border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent,
          flex: "0 0 auto",
        }}
      >
        {isLoading ? <Spinner /> : icon}
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 850,
            letterSpacing: "0.01em",
            color: isIdle ? "rgba(148,163,184,0.85)" : "rgba(241,245,249,0.95)",
          }}
        >
          {label}
        </p>
      </div>
    </Motion.div>
  );
}

