import React, { useState } from "react";
import { ACCENT, FaintBackground, Label, TextArea } from "./OnboardingCommon.jsx";

export function TermsConditions({ onBack, onContinue }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#02030a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
      }}
    >
      <FaintBackground />

      <div
        style={{
          width: "100%",
          maxWidth: 820,
          position: "relative",
          zIndex: 1,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          padding: "32px 32px",
        }}
      >
        {/* header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(181,236,52,0.45)",
                marginBottom: 10,
              }}
            >
              Onboarding — Terms
            </p>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 3.4vw, 2.5rem)",
                fontWeight: 800,
                color: "#f1f5f9",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              Terms & Conditions
            </h1>
          </div>

          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "rgba(181,236,52,0.5)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "inherit",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.target.style.color = ACCENT)}
            onMouseLeave={(e) => (e.target.style.color = "rgba(181,236,52,0.5)")}
          >
            ← Back
          </button>
        </div>

        {/* terms text area (read-only style) */}
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <Label>Protocol Terms (summary)</Label>
          <div
            style={{
              padding: "14px 16px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
              }}
            >
              <li>
                This interface is a design prototype. No data is sent to a backend or chain.
              </li>
              <li>
                All identity and health information is stored locally in your browser storage.
              </li>
              <li>
                Any risk scores, health states, or pool simulations shown are illustrative only and
                must not be treated as medical or financial advice.
              </li>
              <li>
                In a real deployment, full protocol terms would be governed by smart contracts and
                community-approved policies.
              </li>
            </ul>
          </div>
        </div>

        {/* footer actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 18,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ width: 14, height: 14, cursor: "pointer" }}
            />
            <span>I understand that this is a prototype and accept these terms.</span>
          </label>
          <button
            onClick={onContinue}
            disabled={!accepted}
            style={{
              padding: "14px 32px",
              borderRadius: 6,
              border: "none",
              background: accepted ? ACCENT : "rgba(181,236,52,0.15)",
              color: accepted ? "#050505" : "rgba(181,236,52,0.3)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: accepted ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            View Pricing Plans
          </button>
        </div>
      </div>
    </div>
  );
}

