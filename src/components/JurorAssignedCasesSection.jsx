import React from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";
import { JUROR_MOCK_CASES } from "../data/jurorMockData.js";

const shell = {
  padding: "20px 20px 22px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "radial-gradient(circle at 0% 0%, rgba(181,236,52,0.08), transparent 50%), rgba(15,23,42,0.9)",
};

export function JurorAssignedCasesSection({ hideJurorModeShortcut = false } = {}) {
  const navigate = useNavigate();

  return (
    <Motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.35 }}
      style={shell}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.95)",
              margin: 0,
            }}
          >
            Cases assigned to you
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              lineHeight: 1.5,
              color: "rgba(148,163,184,0.88)",
              maxWidth: 520,
            }}
          >
            Peer reviews waiting on your evaluation. Same account — juror responsibilities.
          </p>
        </div>
        {!hideJurorModeShortcut && (
          <button
            type="button"
            onClick={() => {
              navigate("/juror-dashboard");
              window.scrollTo(0, 0);
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.45)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(226,232,240,0.92)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Juror mode
          </button>
        )}
      </div>

      <div
        className="juror-assigned-cases-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {JUROR_MOCK_CASES.map((c) => {
          const pct = Math.min(100, (c.responded / c.totalJurors) * 100);
          const emergency = c.emergency;
          return (
            <div
              key={c.id}
              style={{
                borderRadius: 14,
                border: emergency
                  ? "1px solid rgba(250,204,21,0.32)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: emergency
                  ? "linear-gradient(145deg, rgba(250,204,21,0.06), rgba(15,23,42,0.92))"
                  : "rgba(255,255,255,0.03)",
                padding: "14px 14px 16px",
                boxShadow: emergency ? "0 12px 40px rgba(250,204,21,0.06)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    color: "rgba(226,232,240,0.95)",
                  }}
                >
                  CASE #{c.id}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.1)",
                    color:
                      c.status === "In Progress"
                        ? "rgba(181,236,52,0.9)"
                        : "rgba(148,163,184,0.9)",
                  }}
                >
                  {c.status}
                </span>
              </div>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: emergency ? "rgba(250,204,21,0.9)" : "rgba(148,163,184,0.7)",
                }}
              >
                {c.type}
              </p>
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "rgba(203,213,225,0.92)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {c.description}
              </p>
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontSize: 11,
                    color: "rgba(148,163,184,0.9)",
                  }}
                >
                  <span>
                    {c.responded} / {c.totalJurors} jurors responded
                  </span>
                  <span>{c.timeLeft}</span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, rgba(181,236,52,0.25), ${ACCENT})`,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate(`/case-review/${c.id}`);
                  window.scrollTo(0, 0);
                }}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(181,236,52,0.45)",
                  background: "rgba(181,236,52,0.12)",
                  color: ACCENT,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Review case
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 520px) {
          .juror-assigned-cases-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Motion.section>
  );
}
