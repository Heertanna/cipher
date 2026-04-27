import React from "react";
import { ACCENT } from "./OnboardingCommon.jsx";
import { motion as Motion } from "framer-motion";

const MOCK_POOL = {
  healthPercent: 72,
  status: "Stable", // Stable | Watch | Critical
  trendPct: 2.1,
  trendDirection: "up",
  totalFunds: "₹12.4M",
  activeClaims: 38,
  reserveBalance: "₹3.1M",
};

function statusColor(status) {
  if (status === "Critical") return "rgba(248,113,113,0.95)";
  if (status === "Watch") return "rgba(250,204,21,0.95)";
  return "rgba(190,242,100,0.95)";
}

export function PoolHealthCard() {
  const pct = Math.max(0, Math.min(100, MOCK_POOL.healthPercent));
  const barColor = statusColor(MOCK_POOL.status);
  const pulse = MOCK_POOL.status === "Watch" || MOCK_POOL.status === "Critical";

  return (
    <Motion.section
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        padding: "22px 22px 24px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 20% 0%, rgba(181,236,52,0.18), transparent 60%), rgba(15,23,42,0.9)",
        boxShadow: pulse ? `0 0 45px ${barColor}` : "0 20px 60px rgba(0,0,0,0.35)",
        animation: pulse ? "poolPulse 2.2s ease-in-out infinite" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(181,236,52,0.6)",
              marginBottom: 8,
            }}
          >
            Pool Health
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#f9fafb",
                letterSpacing: "-0.04em",
              }}
            >
              {pct}%
            </span>
            <span
              style={{
                fontSize: 14,
                color: "rgba(148,163,184,0.9)",
              }}
            >
              of target reserves
            </span>
            <span
              style={{
                fontSize: 14,
                color:
                  MOCK_POOL.trendDirection === "up"
                    ? "rgba(190,242,100,0.95)"
                    : "rgba(248,113,113,0.95)",
                fontWeight: 700,
              }}
            >
              {MOCK_POOL.trendDirection === "up" ? "↑" : "↓"}{" "}
              {MOCK_POOL.trendPct}%
            </span>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 12px",
            borderRadius: 999,
            border: `1px solid ${barColor}`,
            background: "rgba(15,23,42,0.95)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: barColor,
              boxShadow: `0 0 12px ${barColor}`,
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: barColor,
            }}
          >
            {MOCK_POOL.status}
          </span>
        </div>
      </div>

      {/* bar */}
      <div
        style={{
          position: "relative",
          height: 18,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(15,23,42,1), rgba(15,23,42,0.9))",
          border: "1px solid rgba(148,163,184,0.6)",
          overflow: "hidden",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(90deg, rgba(15,23,42,0.6) 1px, transparent 1px)",
            backgroundSize: "18px 100%",
            opacity: 0.6,
          }}
        />
        <Motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            position: "relative",
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${ACCENT}, ${barColor})`,
            boxShadow: `0 0 24px ${barColor}`,
          }}
        />
      </div>

      {/* stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <PoolStat label="Total pool funds" value={MOCK_POOL.totalFunds} />
        <PoolStat
          label="Active claims"
          value={String(MOCK_POOL.activeClaims)}
        />
        <PoolStat label="Reserve balance" value={MOCK_POOL.reserveBalance} />
      </div>

      <p
        style={{
          fontSize: 14,
          color: "rgba(148,163,184,0.9)",
        }}
      >
        Pool health determines contribution adjustments and when additional
        safeguards are activated.
      </p>
      <style>{`
        @keyframes poolPulse {
          0% { box-shadow: 0 0 10px ${barColor}; }
          50% { box-shadow: 0 0 36px ${barColor}; }
          100% { box-shadow: 0 0 10px ${barColor}; }
        }
      `}</style>
    </Motion.section>
  );
}

function PoolStat({ label, value }) {
  return (
    <Motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(148,163,184,0.45)",
        background: "rgba(15,23,42,0.9)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
      }}
    >
      <p
        style={{
          fontSize: 14,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.95)",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: "#f9fafb",
        }}
      >
        {value}
      </p>
    </Motion.div>
  );
}

