import React, { useEffect, useMemo, useState } from "react";
import { animate } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const MOCK_OVERVIEW = {
  status: "Stable", // Stable | Watch | Critical
};

const LEVEL_DISPLAY = {
  newcomer: "NEWCOMER",
  contributor: "CONTRIBUTOR",
  trusted: "TRUSTED",
  expert: "EXPERT",
};

const LEVEL_BADGE = {
  newcomer: {
    background: "rgba(148,163,184,0.12)",
    color: "rgba(203,213,225,0.92)",
  },
  contributor: {
    background: "rgba(59,130,246,0.12)",
    color: "rgba(96,165,250,0.95)",
  },
  trusted: {
    background: "rgba(139,92,246,0.12)",
    color: "rgba(196,181,253,0.95)",
  },
  expert: {
    background: "rgba(181,236,52,0.12)",
    color: ACCENT,
  },
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
  const color = statusColor(status);

  const [rpData, setRpData] = useState(null);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [noSession, setNoSession] = useState(false);

  useEffect(() => {
    const { anonymousId } = getSession();
    if (!anonymousId) {
      setNoSession(true);
      return;
    }
    setNoSession(false);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/members/rp/${encodeURIComponent(anonymousId)}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Could not load reputation");
        if (!cancelled) setRpData(j);
      } catch {
        if (!cancelled) setRpData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const repPts = Number(rpData?.reputation_points ?? 0);

  useEffect(() => {
    if (rpData == null) {
      setDisplayPoints(0);
      return;
    }
    setDisplayPoints(0);
    const controls = animate(0, repPts, {
      duration: 0.8,
      onUpdate: (v) => setDisplayPoints(Math.round(v)),
    });
    return () => controls.stop();
  }, [rpData, repPts]);

  const levelKey = rpData?.rp_level || "newcomer";
  const levelStyle = LEVEL_BADGE[levelKey] || LEVEL_BADGE.newcomer;
  const levelTitle = LEVEL_DISPLAY[levelKey] || LEVEL_DISPLAY.newcomer;

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
      <div style={{ marginBottom: 20 }}>
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
          <span style={{ color, fontWeight: 700, letterSpacing: "0.08em" }}>{status}</span>
        </p>
      </div>

      <div
        style={{
          marginTop: 4,
          padding: "18px 16px 20px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15,23,42,0.55)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(148,163,184,0.6)",
          }}
        >
          YOUR REPUTATION
        </p>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "clamp(2.25rem, 7vw, 3.5rem)",
            fontWeight: 800,
            color: "#f9fafb",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {noSession ? "—" : rpData != null ? displayPoints : "—"}
        </p>
        {noSession ? (
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(148,163,184,0.75)" }}>
            Join the network to track reputation.
          </p>
        ) : rpData != null ? (
          <div style={{ marginTop: 14 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 14px",
                borderRadius: 999,
                background: levelStyle.background,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: levelStyle.color,
              }}
            >
              {levelTitle}
            </span>
          </div>
        ) : (
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(148,163,184,0.65)" }}>
            Reputation unavailable
          </p>
        )}
      </div>
    </section>
  );
}
