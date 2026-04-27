import React, { useState } from "react";
import { motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";

const MOCK = {
  healthPercent: 72,
  status: "Stable",
  activeClaims: 38,
  reserveBalance: "₹3.1M",
  recentChange: "+2.1%",
  interpretation: "Claim volume is slightly above average.",
  personalImpact: "Your contribution supports 8 active cases.",
  updatedAgo: "4 min ago",
};

function statusColor(status) {
  if (status === "Critical") return "rgba(248,113,113,1)";
  if (status === "Watch") return "rgba(250,204,21,1)";
  return "rgba(190,242,100,1)";
}

export function PoolAuraBlob() {
  const [hovered, setHovered] = useState(false);
  const color = statusColor(MOCK.status);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        height: 180,
      }}
    >
      <Motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          scale: hovered ? 1.05 : 1,
          boxShadow: hovered
            ? `0 0 50px ${color}`
            : "0 0 28px rgba(0,0,0,0.75)",
          filter: hovered ? "brightness(0.9)" : "brightness(1)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 40,
          background:
            "radial-gradient(circle at 20% 0%, rgba(181,236,52,0.45), transparent 60%)," +
            "radial-gradient(circle at 82% 100%, rgba(56,189,248,0.45), transparent 60%)",
          overflow: "hidden",
        }}
      >
        <Motion.div
          animate={{ opacity: hovered ? 0.65 : 0.4 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            inset: "14%",
            borderRadius: "50% 60% 45% 70%",
            background:
              "radial-gradient(circle at 30% 0%, rgba(15,23,42,0.55), transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: hovered ? 1 : 0,
          y: hovered ? 0 : 12,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#f9fafb",
          pointerEvents: "none",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            Pool health insight
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              {MOCK.healthPercent}%
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color,
              }}
            >
              {MOCK.status}
            </span>
          </div>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              opacity: 0.9,
            }}
          >
            Active claims: {MOCK.activeClaims} · Reserve: {MOCK.reserveBalance} ·
            Change: {MOCK.recentChange}
          </p>
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            opacity: 0.95,
          }}
        >
          <p style={{ margin: 0 }}>{MOCK.interpretation}</p>
          <p style={{ margin: "4px 0 0" }}>{MOCK.personalImpact}</p>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          Updated {MOCK.updatedAgo}
        </p>
      </Motion.div>

      {!hovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: "#f9fafb",
            fontSize: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            Hover to inspect
          </p>
          <p
            style={{
              margin: 0,
              alignSelf: "flex-end",
              fontSize: 20,
              fontWeight: 700,
              color: ACCENT,
            }}
          >
            {MOCK.healthPercent}%
          </p>
        </div>
      )}
    </div>
  );
}

