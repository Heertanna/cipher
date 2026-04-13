import React from "react";
import { motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";

export function RpEarnedNotice({
  pointsEarned,
  subtitle,
  style: wrapStyle = {},
  marginTop = 16,
}) {
  const n = Number(pointsEarned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginTop,
        border: "1px solid rgba(181,236,52,0.3)",
        background: "rgba(181,236,52,0.05)",
        borderRadius: 14,
        padding: "16px 18px",
        ...wrapStyle,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: ACCENT,
        }}
      >
        +{n} reputation points earned
      </p>
      {subtitle ? (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 13,
            color: "rgba(148,163,184,0.95)",
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </Motion.div>
  );
}
