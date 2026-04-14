import React, { useMemo } from "react";
import { AvatarPreview } from "./AvatarPreview.jsx";
import { ACCENT } from "./OnboardingCommon.jsx";
import { motion as Motion } from "framer-motion";

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

export function IdentityCard({ showJuryMemberBadge = true } = {}) {
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
              {"\u2696\uFE0F"} JURY MEMBER
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
      </div>
    </Motion.section>
  );
}
