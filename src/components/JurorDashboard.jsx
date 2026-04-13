import React from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";
import { IdentityCard } from "./IdentityCard.jsx";
import { SystemOverviewHero } from "./SystemOverviewHero.jsx";
import { SystemEnergyCore } from "./SystemEnergyCore.jsx";
import { JurorAssignedCasesSection } from "./JurorAssignedCasesSection.jsx";
import { ClaimsCard } from "./ClaimsCard.jsx";
import { SystemActivityCard } from "./SystemActivityCard.jsx";
import { BecomeReviewerCard } from "./BecomeReviewerCard.jsx";

/**
 * Same layout and styling as ProtocolDashboard (live system view + hero grid + energy core).
 * Actions route back to the main protocol flow or shared entry points.
 */
export function JurorDashboard() {
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
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
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
              onClick={() => {
                navigate("/claim-intake");
                window.scrollTo(0, 0);
              }}
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
              onClick={() => {
                navigate("/emergency-access");
                window.scrollTo(0, 0);
              }}
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
                navigate("/protocol-dashboard");
                window.scrollTo(0, 0);
              }}
              style={{
                ...btnBase,
                background: "rgba(15,23,42,0.55)",
                color: "rgba(226,232,240,0.96)",
                borderColor: "rgba(148,163,184,0.55)",
              }}
            >
              Care dashboard
            </button>

            <button
              type="button"
              onClick={() => {
                navigate("/");
                window.scrollTo(0, 0);
              }}
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
          </div>
        </Motion.header>

        <div
          className="juror-protocol-top-grid"
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
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <BecomeReviewerCard />
            <SystemOverviewHero />
            <Motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.32 }}
              style={{
                padding: "20px 22px 22px",
                borderRadius: 20,
                border: "1px solid rgba(181,236,52,0.28)",
                background:
                  "linear-gradient(135deg, rgba(181,236,52,0.08), transparent 42%), rgba(15,23,42,0.88)",
                boxShadow: "0 0 0 1px rgba(181,236,52,0.06) inset, 0 16px 48px rgba(0,0,0,0.28)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: ACCENT,
                }}
              >
                New updates
              </p>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f9fafb",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.45,
                }}
              >
                You have a new case to review
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "rgba(148,163,184,0.92)",
                }}
              >
                Open the review flow when you are ready — your response helps the pool reach a fair
                decision.
              </p>
              <button
                type="button"
                onClick={() => {
                  navigate("/case-review/A392");
                  window.scrollTo(0, 0);
                }}
                style={{
                  marginTop: 16,
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(181,236,52,0.5)",
                  background: "rgba(181,236,52,0.12)",
                  color: ACCENT,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Open review
              </button>
            </Motion.section>
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
          >
            <IdentityCard showReputationPanel />
          </Motion.div>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
        >
          <SystemEnergyCore />
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <JurorAssignedCasesSection hideJurorModeShortcut />
        </Motion.div>

        <div
          className="juror-bottom-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
            gap: 20,
          }}
        >
          <Motion.div
            id="juror-claims-section"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.35 }}
          >
            <ClaimsCard
              onStartClaim={() => {
                navigate("/claim-intake");
                window.scrollTo(0, 0);
              }}
            />
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            <SystemActivityCard />
          </Motion.div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .juror-protocol-top-grid,
            .juror-bottom-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
