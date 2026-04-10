import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";
import {
  getJurorCaseById,
  getJuryEvaluationPacket,
  getOrCreateJuryCase,
} from "../data/jurorMockData.js";
import { JuryEvaluationFlow } from "./JuryEvaluationFlow.jsx";
import { API_URL } from "../config/api.js";

export function CaseReview() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [realClaim, setRealClaim] = useState(null);
  const [loadingClaim, setLoadingClaim] = useState(true);
  const [claimError, setClaimError] = useState("");

  const c = getJurorCaseById(caseId);
  const fallbackPacket = useMemo(
    () => (c ? getJuryEvaluationPacket(caseId) : null),
    [c, caseId],
  );
  const packet = useMemo(() => {
    if (!realClaim) return fallbackPacket;
    const payload = realClaim.payload && typeof realClaim.payload === "object" ? realClaim.payload : {};
    const typeRaw = String(payload.typeOfIssue || payload.issueType || "General");
    const doctorRaw = String(payload.doctorConsulted || "").toLowerCase();
    const juryCaseId = realClaim.jury_case_id ?? null;
    return {
      caseId: String(realClaim.id),
      caseType: typeRaw || "General",
      symptoms: [String(realClaim.what_happened || "No details provided")],
      reportsTests:
        payload.recommendedTreatment ||
        "See attached documents",
      treatmentRequested:
        payload.recommendedTreatment || realClaim.what_happened,
      doctorNote:
        doctorRaw === "yes" ? "Doctor consulted" : "No doctor consulted",
      cost: `₹${Number(realClaim.cost_inr || 0).toLocaleString("en-IN")}`,
      expectedRange: realClaim.matched_procedure?.max_cost_inr
        ? `Up to ₹${Number(realClaim.matched_procedure.max_cost_inr).toLocaleString("en-IN")}`
        : "Not specified",
      jury_case_id: juryCaseId,
    };
  }, [realClaim, fallbackPacket]);
  const [evaluationOpen, setEvaluationOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadClaim() {
      setLoadingClaim(true);
      setClaimError("");
      try {
        const idNum = Number(caseId);
        if (!Number.isFinite(idNum) || idNum <= 0) {
          setRealClaim(null);
          return;
        }
        const response = await fetch(`${API_URL}/claims/${idNum}`);
        if (!response.ok) {
          throw new Error("Could not load claim");
        }
        const claim = await response.json();
        const juryCaseId = await getOrCreateJuryCase(claim.id, claim.jury_case_id);
        if (!cancelled) {
          setRealClaim({ ...claim, jury_case_id: juryCaseId });
        }
      } catch (e) {
        if (!cancelled) {
          setClaimError(e?.message || "Could not load claim");
          setRealClaim(null);
        }
      } finally {
        if (!cancelled) setLoadingClaim(false);
      }
    }
    loadClaim();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (evaluationOpen && packet) {
    return (
      <JuryEvaluationFlow
        packet={packet}
        onLeave={() => setEvaluationOpen(false)}
        onComplete={async (result) => {
          const vote = result?.position === "support" ? "approved" : "denied";
          const confidenceMap = { yes: 0.9, maybe: 0.6, no: 0.3 };
          const confidence = confidenceMap[result?.evidence?.choice] ?? 0.6;
          const reasoning = `Evidence: ${result?.evidence?.reasoning || ""} | Treatment: ${
            result?.treatment?.reasoning || ""
          } | Cost: ${result?.cost?.reasoning || ""}`;
          const jurorAnonymousId =
            window.localStorage.getItem("anonymousId") ||
            window.sessionStorage.getItem("anonymousId") ||
            "";
          const juryCaseId =
            packet?.jury_case_id ??
            realClaim?.jury_case_id ??
            null;

          if (!juryCaseId) {
            console.error("No jury_case_id found for this case - cannot submit vote");
            setEvaluationOpen(false);
            navigate("/juror-dashboard", {
              state: {
                juryEvaluationRecorded: false,
                message: "Could not submit vote: no jury case found.",
              },
            });
            return;
          }

          let decision = "waiting";
          try {
            console.log("Submitting vote:", { juryCaseId, jurorAnonymousId, vote, confidence });
            const response = await fetch(`${API_URL}/jury/${juryCaseId}/vote`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                juror_anonymous_id: jurorAnonymousId,
                vote,
                confidence,
                reasoning,
              }),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data?.error || "Could not submit vote");
            }
            decision = data?.final_decision || "waiting";
            const message =
              data?.final_decision != null
                ? `Final decision: ${data.final_decision}`
                : "Your vote has been recorded.";
            setEvaluationOpen(false);
            navigate("/juror-dashboard", {
              state: {
                juryEvaluationRecorded: true,
                caseId: packet.caseId,
                decision,
                message,
              },
            });
          } catch (e) {
            setEvaluationOpen(false);
            navigate("/juror-dashboard", {
              state: {
                juryEvaluationRecorded: false,
                caseId: packet.caseId,
                decision,
                message: e?.message || "Could not submit vote",
              },
            });
          }
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
            {realClaim ? `Case #${realClaim.id}` : c ? `Case #${c.id}` : "Case not found"}
          </h1>
          {loadingClaim ? (
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(148,163,184,0.9)" }}>
              Loading live case data...
            </p>
          ) : null}
          {claimError ? (
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#fda4af" }}>
              {claimError}. Showing fallback mock packet.
            </p>
          ) : null}
          {(c || realClaim) && (
            <p style={{ margin: 0, fontSize: 13, color: "rgba(148,163,184,0.9)" }}>
              {realClaim
                ? `${packet?.caseType || "General"} · ${realClaim.jury_status || "In Progress"}`
                : `${c.type} · ${c.status}`}
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
              {realClaim
                ? String(realClaim.what_happened || "No packet details available")
                : c
                ? c.detail || c.description
                : "No packet is loaded for this identifier. Return to the juror dashboard and open a case from your assigned list."}
            </p>
          </div>

          <button
            type="button"
            disabled={!packet}
            onClick={() => setEvaluationOpen(true)}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "16px 22px",
              borderRadius: 999,
              border: `1px solid ${packet ? "rgba(181,236,52,0.55)" : "rgba(148,163,184,0.3)"}`,
              background: packet ? ACCENT : "rgba(30,41,59,0.6)",
              color: packet ? "#020617" : "rgba(148,163,184,0.6)",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: packet ? "pointer" : "not-allowed",
              boxShadow: packet ? "0 0 28px rgba(181,236,52,0.22)" : "none",
            }}
          >
            Start Evaluation
          </button>
        </div>
      </Motion.main>
    </div>
  );
}
