import React, { useMemo } from "react";
import { ACCENT } from "./OnboardingCommon";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function truncateHash(h) {
  if (!h || h.length < 12) return h;
  return h.slice(0, 8) + "..." + h.slice(-6);
}

export function Dashboard({ onHome, onNext }) {
  const identity = useMemo(
    () => safeParse(window.localStorage.getItem("cipher_identity")),
    []
  );
  const health = useMemo(
    () => safeParse(window.localStorage.getItem("healthProfile")),
    []
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#060810",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), radial-gradient(ellipse at bottom left, rgba(180, 200, 20, 0.12) 0%, #060810 65%)",
        backgroundSize: "60px 60px, 60px 60px, 100% 100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 820,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          padding: "32px 32px",
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(181,236,52,0.45)",
            marginBottom: 12,
          }}
        >
          Dashboard
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            color: "#f1f5f9",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            marginBottom: 28,
            lineHeight: 1.05,
          }}
        >
          Protocol Identity
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                marginBottom: 8,
              }}
            >
              Alias
            </p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>
              {identity?.alias || "—"}
            </p>
          </div>

          <div
            style={{
              padding: "20px 22px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                marginBottom: 8,
              }}
            >
              Identity Hash
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontFamily: "monospace",
                letterSpacing: "0.06em",
                color: ACCENT,
              }}
            >
              {truncateHash(identity?.hash) || "—"}
            </p>
          </div>
        </div>

        <h2
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
            margin: "0 0 12px",
          }}
        >
          Health Profile
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[
            { k: "Age Range", v: health?.ageRange || "—" },
            { k: "Blood Type", v: health?.bloodType || "—" },
            { k: "Gender", v: health?.gender || "—" },
          ].map((item) => (
            <div
              key={item.k}
              style={{
                padding: "18px 20px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  marginBottom: 8,
                }}
              >
                {item.k}
              </p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>
                {item.v}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onNext ?? onHome}
          style={{
            padding: "14px 36px",
            border: "1px solid rgba(181,236,52,0.35)",
            borderRadius: 6,
            background: "transparent",
            color: "rgba(181,236,52,0.8)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

