import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";
import {
  getJurorCaseById,
  getJuryEvaluationPacket,
  getFinalVerdictCaseResult,
} from "../data/jurorMockData.js";
import { JuryEvaluationFlow } from "./JuryEvaluationFlow.jsx";

export function CaseReview() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const c = getJurorCaseById(caseId);
  const packet = useMemo(
    () => (c ? getJuryEvaluationPacket(caseId) : null),
    [c, caseId]
  );
  const [evaluationOpen, setEvaluationOpen] = useState(false);

  if (evaluationOpen && packet) {
    return (
      <JuryEvaluationFlow
        packet={packet}
        onLeave={() => setEvaluationOpen(false)}
        onViewFinalVerdict={(submission) => {
          setEvaluationOpen(false);
          navigate("/final-verdict", {
            state: {
              caseResult: getFinalVerdictCaseResult(submission, packet),
              juryEvaluationRecorded: true,
              notifyOnDecision: Boolean(submission?.notifyOnDecision),
            },
          });
        }}
        onComplete={(submission) => {
          setEvaluationOpen(false);
          navigate("/juror-dashboard", {
            state: {
              juryEvaluationRecorded: true,
              caseId: submission?.caseId ?? packet.caseId,
              notifyOnDecision: Boolean(submission?.notifyOnDecision),
            },
          });
        }}
        onViewCaseProgress={(submission) => {
          setEvaluationOpen(false);
          navigate("/juror-dashboard", {
            state: {
              juryEvaluationRecorded: true,
              caseId: submission?.caseId ?? packet.caseId,
              viewCaseProgress: true,
              notifyOnDecision: Boolean(submission?.notifyOnDecision),
            },
          });
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "#02030a",
        padding: "80px 24px 48px",
        display: "flex",
        justifyContent: "center",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <FaintBackground />

      <Motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 640,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/juror-dashboard")}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              border: "1px solid rgba(148,163,184,0.55)",
              background: "rgba(15,23,42,0.45)",
              color: "rgba(226,232,240,0.96)",
            }}
          >
            ← Juror dashboard
          </button>
        </div>

        <div
          style={{
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.1)",
            background:
              "radial-gradient(circle at 0% 0%, rgba(181,236,52,0.08), transparent 50%), rgba(15,23,42,0.92)",
            padding: "28px 26px 26px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
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
            Case review
          </p>
          <h1
            style={{
              margin: "12px 0 8px",
              fontSize: "clamp(1.5rem, 3vw, 1.85rem)",
              fontWeight: 800,
              color: "#f9fafb",
              letterSpacing: "-0.02em",
            }}
          >
            {c ? `Case #${c.id}` : "Case not found"}
          </h1>
          {c && (
            <p style={{ margin: 0, fontSize: 13, color: "rgba(148,163,184,0.9)" }}>
              {c.type} · {c.status}
            </p>
          )}

          <div
            style={{
              marginTop: 22,
              padding: "18px 16px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(148,163,184,0.85)",
              }}
            >
              Case description
            </p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "rgba(226,232,240,0.95)" }}>
              {c
                ? c.detail || c.description
                : "No packet is loaded for this identifier. Return to the juror dashboard and open a case from your assigned list."}
            </p>
          </div>

          <button
            type="button"
            disabled={!c}
            onClick={() => setEvaluationOpen(true)}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "16px 22px",
              borderRadius: 999,
              border: `1px solid ${c ? "rgba(181,236,52,0.55)" : "rgba(148,163,184,0.3)"}`,
              background: c ? ACCENT : "rgba(30,41,59,0.6)",
              color: c ? "#020617" : "rgba(148,163,184,0.6)",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: c ? "pointer" : "not-allowed",
              boxShadow: c ? "0 0 28px rgba(181,236,52,0.22)" : "none",
            }}
          >
            Start Evaluation
          </button>
        </div>
      </Motion.main>
    </div>
  );
}
