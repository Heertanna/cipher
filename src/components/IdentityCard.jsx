import React, { useEffect, useMemo, useState } from "react";
import { AvatarPreview } from "./AvatarPreview.jsx";
import { ACCENT } from "./OnboardingCommon.jsx";
import { motion as Motion } from "framer-motion";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const PLAN_LABEL = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

const LEVEL_BADGE = {
  newcomer: {
    label: "NEWCOMER",
    border: "rgba(148,163,184,0.45)",
    background: "rgba(148,163,184,0.12)",
    color: "rgba(226,232,240,0.92)",
  },
  contributor: {
    label: "CONTRIBUTOR",
    border: "rgba(59,130,246,0.55)",
    background: "rgba(59,130,246,0.14)",
    color: "rgba(59,130,246,0.95)",
  },
  trusted: {
    label: "TRUSTED",
    border: "rgba(139,92,246,0.55)",
    background: "rgba(139,92,246,0.14)",
    color: "rgba(139,92,246,0.95)",
  },
  expert: {
    label: "EXPERT",
    border: "rgba(181,236,52,0.55)",
    background: "rgba(181,236,52,0.12)",
    color: ACCENT,
  },
};

function BenefitRows({ reputationPoints }) {
  const rp = Number(reputationPoints) || 0;
  const ok = "\u2713 ";
  const lock = "\u{1F512} ";
  const rows = [
    { min: 0, unlocked: `${ok}Protocol participation`, locked: null },
    {
      min: 50,
      unlocked: `${ok}Healthcare benefits (free checkups)`,
      locked: `${lock}Healthcare benefits (50 RP needed)`,
    },
    {
      min: 150,
      unlocked: `${ok}Governance participation (propose protocol changes, vote on rules)`,
      locked: `${lock}Governance participation (150 RP needed)`,
    },
    {
      min: 300,
      unlocked: `${ok}Expert credentialing (faster processing + professional credibility)`,
      locked: `${lock}Expert credentialing (300 RP needed)`,
    },
  ];
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r) => {
        const open = rp >= r.min;
        const text = open ? r.unlocked : r.locked ?? r.unlocked;
        return (
          <li
            key={r.min}
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: open ? "rgba(226,232,240,0.9)" : "rgba(100,116,139,0.85)",
            }}
          >
            {text}
          </li>
        );
      })}
    </ul>
  );
}

export function IdentityCard({ showJuryMemberBadge = true, showReputationPanel = false } = {}) {
  const identity = useMemo(
    () => safeParse(window.localStorage.getItem("cipher_identity")),
    []
  );
  const health = useMemo(
    () => safeParse(window.localStorage.getItem("healthProfile")),
    []
  );
  const subscription = useMemo(
    () => safeParse(window.localStorage.getItem("cipher_subscription")),
    []
  );

  const tierId = subscription?.planId || "standard";
  const tierLabel = PLAN_LABEL[tierId] || "Standard";
  const isActive = subscription?.status === "active";
  const memberSince = useMemo(() => {
    const ts = subscription?.createdAt;
    if (!ts) return "Just joined";
    try {
      return new Date(ts).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      });
    } catch {
      return "Just joined";
    }
  }, [subscription?.createdAt]);

  const [rpData, setRpData] = useState(null);
  const [rpLoadError, setRpLoadError] = useState("");

  useEffect(() => {
    if (!showReputationPanel) return;
    const { anonymousId } = getSession();
    if (!anonymousId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/members/rp/${encodeURIComponent(anonymousId)}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Could not load reputation");
        if (!cancelled) {
          setRpData(j);
          setRpLoadError("");
        }
      } catch (e) {
        if (!cancelled) setRpLoadError(e?.message || "Could not load reputation");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showReputationPanel]);

  const levelKey = rpData?.rp_level || "newcomer";
  const levelStyle = LEVEL_BADGE[levelKey] || LEVEL_BADGE.newcomer;
  const repPts = Number(rpData?.reputation_points ?? 0);
  const progressPct = Math.min(100, Math.max(0, Number(rpData?.rp_progress_pct ?? 0)));

  return (
    <Motion.section
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: 28,
        padding: "22px 24px 24px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 8% 0%, rgba(181,236,52,0.12), transparent 50%), radial-gradient(circle at 92% 0%, rgba(56,189,248,0.16), transparent 50%), radial-gradient(circle at 0% 0%, rgba(181,236,52,0.06), transparent 55%), rgba(15,23,42,0.82)",
        boxShadow: "0 20px 55px rgba(0,0,0,0.32)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: 152,
        }}
      >
        <AvatarPreview
          ageRange={health?.ageRange}
          gender={health?.gender}
          maxWidth={152}
        />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(181,236,52,0.6)",
              margin: 0,
            }}
          >
            Identity
          </p>
          {showJuryMemberBadge ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid rgba(181,236,52,0.38)",
                background: "rgba(181,236,52,0.1)",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(241,245,249,0.96)",
              }}
              title="You can participate in peer jury decisions"
            >
              ⚖️ JURY MEMBER
            </span>
          ) : null}
        </div>

        <div>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.9)",
              margin: 0,
              marginBottom: 8,
            }}
          >
            Alias
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#f9fafb",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {identity?.alias || "—"}
          </p>
        </div>

        <div>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.9)",
              margin: 0,
              marginBottom: 8,
            }}
          >
            Contribution tier
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: ACCENT,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: ACCENT,
                boxShadow: "0 0 10px rgba(181,236,52,0.8)",
              }}
            />
            {tierLabel}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: isActive ? ACCENT : "rgba(248,250,252,0.35)",
              boxShadow: isActive ? "0 0 0 4px rgba(181,236,52,0.18)" : "none",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: isActive
                ? "rgba(190,242,100,0.92)"
                : "rgba(148,163,184,0.9)",
            }}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "rgba(148,163,184,0.9)",
            maxWidth: 440,
            lineHeight: 1.75,
          }}
        >
          Your profile is anonymized. Only medical and contribution data are used
          to participate in the protocol.
        </p>
        <p
          style={{
            margin: 0,
            marginTop: 4,
            fontSize: 11,
            color: "rgba(148,163,184,0.95)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Member since: <span style={{ color: "#e2e8f0" }}>{memberSince}</span>
        </p>

        {showReputationPanel ? (
          <Motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            style={{
              marginTop: 8,
              paddingTop: 18,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(181,236,52,0.65)",
              }}
            >
              Reputation points
            </p>
            {rpLoadError ? (
              <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>{rpLoadError}</p>
            ) : (
              <>
                <p
                  style={{
                    margin: 0,
                    fontSize: 34,
                    fontWeight: 800,
                    color: "#f9fafb",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {rpData ? repPts : "—"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: `1px solid ${levelStyle.border}`,
                      background: levelStyle.background,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: levelStyle.color,
                    }}
                  >
                    {levelStyle.label}
                  </span>
                  {levelKey !== "expert" && Number(rpData?.rp_next_level_points) > 0 ? (
                    <span style={{ fontSize: 11, color: "rgba(148,163,184,0.85)" }}>
                      {rpData.rp_next_level_points} RP to next level
                    </span>
                  ) : null}
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: ACCENT,
                      boxShadow: "0 0 12px rgba(181,236,52,0.35)",
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(148,163,184,0.88)", lineHeight: 1.5 }}>
                  Earned through participation, not outcomes
                </p>
                <div>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(148,163,184,0.75)",
                    }}
                  >
                    Benefits
                  </p>
                  <BenefitRows reputationPoints={repPts} />
                </div>
              </>
            )}
          </Motion.div>
        ) : null}
      </div>
    </Motion.section>
  );
}

