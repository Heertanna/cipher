import React from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";
import { IdentityCard } from "./IdentityCard.jsx";
import { ClaimsCard } from "./ClaimsCard.jsx";
import { SystemOverviewHero } from "./SystemOverviewHero.jsx";
import { SystemActivityCard } from "./SystemActivityCard.jsx";
import { LiveCasesStack } from "./LiveCasesStack.jsx";
import { SystemEnergyCore } from "./SystemEnergyCore.jsx";
export function ProtocolDashboard({ onHome, onStartClaim, onStartEmergency }) {
  const navigate = useNavigate();

  const btnBase = {
    padding: "10px 18px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    cursor: "pointer",
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#02030a",
        padding: "80px 24px 40px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <FaintBackground />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1180,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <Motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(148,163,184,0.9)",
                marginBottom: 10,
              }}
            >
              Live system view
            </p>
            <h1
              style={{
                fontSize: "clamp(2rem, 3.2vw, 2.6rem)",
                fontWeight: 800,
                color: "#f9fafb",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Cipher Dashboard
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => (typeof onStartClaim === "function" ? onStartClaim() : undefined)}
              style={{
                ...btnBase,
                background: ACCENT,
                color: "#020617",
                borderColor: "rgba(181,236,52,0.55)",
                boxShadow: "0 0 24px rgba(181,236,52,0.22)",
              }}
            >
              Request Support
            </button>

            <button
              type="button"
              onClick={() =>
                typeof onStartEmergency === "function" ? onStartEmergency() : undefined
              }
              style={{
                ...btnBase,
                background: "rgba(250,204,21,0.10)",
                color: "rgba(250,204,21,0.95)",
                borderColor: "rgba(250,204,21,0.45)",
                boxShadow: "0 0 24px rgba(250,204,21,0.12)",
                padding: "10px 18px",
                minHeight: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 900 }}>⚠️</span>
                <span style={{ fontSize: 11, fontWeight: 950, lineHeight: 1.1 }}>Emergency Access</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate("/juror-dashboard");
                window.scrollTo(0, 0);
              }}
              style={{
                ...btnBase,
                background: "rgba(15,23,42,0.55)",
                color: "rgba(226,232,240,0.96)",
                borderColor: "rgba(148,163,184,0.55)",
              }}
            >
              Become jury member
            </button>
            {onHome && (
              <button
                type="button"
                onClick={onHome}
                style={{
                  ...btnBase,
                  background: "transparent",
                  color: "rgba(226,232,240,0.96)",
                  borderColor: "rgba(148,163,184,0.65)",
                  fontWeight: 600,
                }}
              >
                Back to landing
              </button>
            )}
          </div>
        </Motion.header>

        <div
          className="protocol-top-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
            gap: 20,
          }}
        >
          <Motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <SystemOverviewHero />
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
          >
            <IdentityCard showJuryMemberBadge={false} />
          </Motion.div>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
        >
          <SystemEnergyCore />
        </Motion.div>

        <div
          className="protocol-bottom-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
            gap: 20,
          }}
        >
          <Motion.div
            id="protocol-claims-section"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.35 }}
          >
            <ClaimsCard onStartClaim={onStartClaim} />
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.35 }}
          >
            <SystemActivityCard />
          </Motion.div>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.35 }}
        >
          <LiveCasesStack />
        </Motion.div>

        <style>{`
          @media (max-width: 900px) {
            .protocol-top-grid,
            .protocol-bottom-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
