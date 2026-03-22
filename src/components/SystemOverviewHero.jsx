import React, { useMemo } from "react";
import { motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const MOCK_OVERVIEW = {
  healthPercent: 72,
  status: "Stable", // Stable | Watch | Critical
};

function statusColor(status) {
  if (status === "Critical") return "rgba(248,113,113,0.95)";
  if (status === "Watch") return "rgba(250,204,21,0.95)";
  return "rgba(190,242,100,0.95)";
}

export function SystemOverviewHero() {
  const identity = useMemo(
    () => safeParse(window.localStorage.getItem("cipher_identity")),
    []
  );
  const alias = identity?.alias || "Member";
  const status = MOCK_OVERVIEW.status;
  const pct = MOCK_OVERVIEW.healthPercent;
  const color = statusColor(status);

  return (
    <section
      style={{
        padding: "24px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 8% 10%, rgba(181,236,52,0.18), transparent 55%), radial-gradient(circle at 90% 5%, rgba(59,130,246,0.2), transparent 50%), rgba(15,23,42,0.85)",
        boxShadow: "0 22px 70px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(148,163,184,0.9)",
            marginBottom: 8,
          }}
        >
          System overview
        </p>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 4.2vw, 3rem)",
            letterSpacing: "-0.03em",
            color: "#f9fafb",
            fontWeight: 800,
          }}
        >
          Hello, {alias}
        </h2>
        <p style={{ margin: "8px 0 0", color: "rgba(148,163,184,0.95)" }}>
          System status:{" "}
          <span style={{ color, fontWeight: 700, letterSpacing: "0.08em" }}>
            {status}
          </span>
        </p>
      </div>

      <div
        style={{
          padding: "16px",
          borderRadius: 14,
          border: `1px solid ${color}`,
          background: "rgba(15,23,42,0.82)",
          boxShadow:
            status === "Stable"
              ? "0 0 35px rgba(181,236,52,0.2)"
              : "0 0 40px rgba(248,113,113,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(226,232,240,0.92)",
            }}
          >
            Pool Health
          </p>
          <p style={{ margin: 0, color: ACCENT, fontWeight: 800, fontSize: 24 }}>
            {pct}%
          </p>
        </div>

        <div
          style={{
            height: 12,
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.55)",
            overflow: "hidden",
            background: "rgba(15,23,42,0.95)",
          }}
        >
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${ACCENT}, ${color})`,
              boxShadow: `0 0 25px ${color}`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

