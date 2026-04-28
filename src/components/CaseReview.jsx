import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";
import {
  getJurorCaseById,
  getJuryEvaluationPacket,
  getOrCreateJuryCase,
} from "../data/jurorMockData.js";
import { JuryEvaluationFlow } from "./JuryEvaluationFlow.jsx";
import { API_URL } from "../config/api.js";
import { PROTOCOL_PAGE_BACKGROUND } from "../lib/protocolPageBackground.js";

function isNumericClaimCaseId(caseIdParam) {
  const idNum = Number(caseIdParam);
  return Number.isFinite(idNum) && idNum > 0;
}

export function CaseReview() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [realClaim, setRealClaim] = useState(null);
  const [mockJuryCaseId, setMockJuryCaseId] = useState(null);
  const [loadingClaim, setLoadingClaim] = useState(true);
  const [claimError, setClaimError] = useState("");

  const c = getJurorCaseById(caseId);
  const fallbackPacket = useMemo(
    () => (c ? getJuryEvaluationPacket(caseId) : null),
    [c, caseId],
  );

  const packet = useMemo(() => {
    if (realClaim) {
      const payload =
        realClaim.payload && typeof realClaim.payload === "object" ? realClaim.payload : {};
      const typeRaw = String(payload.typeOfIssue || payload.issueType || "General");
      const doctorRaw = String(payload.doctorConsulted || "").toLowerCase();
      return {
        caseId: String(realClaim.id),
        caseType: typeRaw || "General",
        symptoms: [String(realClaim.what_happened || "No details provided")],
        reportsTests: payload.recommendedTreatment || "See attached documents",
        treatmentRequested: payload.recommendedTreatment || realClaim.what_happened,
        doctorNote:
          doctorRaw === "yes" ? "Doctor consulted" : "No doctor consulted",
        cost: `₹${Number(realClaim.cost_inr || 0).toLocaleString("en-IN")}`,
        expectedRange: realClaim.matched_procedure?.max_cost_inr
          ? `Up to ₹${Number(realClaim.matched_procedure.max_cost_inr).toLocaleString("en-IN")}`
          : "Not specified",
        jury_case_id: realClaim.jury_case_id ?? null,
      };
    }
    if (!fallbackPacket) return null;
    return {
      ...fallbackPacket,
      jury_case_id: mockJuryCaseId ?? null,
    };
  }, [realClaim, fallbackPacket, mockJuryCaseId]);

  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [demoOutcome, setDemoOutcome] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.shiftKey && e.key === "R") {
        e.preventDefault();
        setDemoOutcome((prev) => (prev === "re_evaluation" ? null : "re_evaluation"));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingClaim(true);
      setClaimError("");
      setMockJuryCaseId(null);
      setRealClaim(null);

      if (isNumericClaimCaseId(caseId)) {
        try {
          const idNum = Number(caseId);
          const response = await fetch(`${API_URL}/claims/${idNum}`);
          if (!response.ok) {
            throw new Error("Could not load claim");
          }
          const claim = await response.json();

          const juryCaseId = await getOrCreateJuryCase(claim.id);

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
        return;
      }

      if (!getJurorCaseById(caseId)) {
        if (!cancelled) setLoadingClaim(false);
        return;
      }

      try {
        const juryCaseId = await getOrCreateJuryCase(1);
        if (!cancelled) setMockJuryCaseId(juryCaseId);
      } catch (e) {
        if (!cancelled) {
          setClaimError(e?.message || "Could not start jury case");
          setMockJuryCaseId(null);
        }
      } finally {
        if (!cancelled) setLoadingClaim(false);
      }
    }

    load();
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
            packet?.jury_case_id ?? realClaim?.jury_case_id ?? mockJuryCaseId ?? null;

          if (!juryCaseId) {
            console.error("No jury_case_id found - cannot submit vote");
            setEvaluationOpen(false);
            navigate("/juror-dashboard");
            return;
          }

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
                demo_outcome: demoOutcome,
              }),
            });
            const data = await response.json();
            console.log("Vote response:", data);
            if (!response.ok) {
              throw new Error(data?.error || "Could not submit vote");
            }
            setMockJuryCaseId(null);
            setEvaluationOpen(false);
            navigate(`/verdict/${juryCaseId}`, {
              state: { verdict: data },
            });
          } catch (e) {
            console.error("Vote failed:", e?.message);
            setEvaluationOpen(false);
            navigate("/juror-dashboard", {
              state: {
                juryEvaluationRecorded: false,
                message: e?.message || "Could not submit vote",
              },
            });
          }
        }}
      />
    );
  }

  const canStartEvaluation =
    Boolean(packet) &&
    !loadingClaim &&
    packet.jury_case_id != null &&
    Number(packet.jury_case_id) > 0;

  const displayCaseId = realClaim ? String(realClaim.id) : c ? String(c.id) : String(caseId || "A392");
  const displayStatus = String(realClaim?.jury_status || c?.status || "Under review");
  const displayComplaint = realClaim
    ? String(packet?.caseType || "General medical case")
    : String(c?.title || "Case under review");
  const displaySummary = realClaim
    ? String(realClaim.what_happened || "No packet details available")
    : c
      ? String(c.detail || c.description || "No packet details available")
      : "No packet is loaded for this identifier. Return to the juror dashboard and open a case from your assigned list.";
  const displayDate = realClaim?.created_at
    ? new Date(realClaim.created_at).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "18 Apr 2026";
  const displayStage = realClaim
    ? String(realClaim.jury_status || "Review in progress")
    : String(c?.stage || "Review in progress");
  const displayJurors = c?.jurorCount || 8;
  const displayProgress = realClaim
    ? 38
    : Number.isFinite(Number(c?.progress))
      ? Math.max(0, Math.min(100, Number(c.progress)))
      : 38;
  const timelineEvents = [
    { label: "Claim submitted", date: displayDate, state: "done" },
    { label: "Documents verified", date: "19 Apr 2026", state: "done" },
    { label: "Jury assigned (8 jurors)", date: "20 Apr 2026", state: "done" },
    { label: "Review in progress", date: "Current", state: "current" },
  ];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        ...PROTOCOL_PAGE_BACKGROUND,
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          padding: "20px clamp(12px, 2vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(6, 8, 16, 0.9)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "none",
            border: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <img src="data:image/png;base64,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wtNUnZq+1j8N8QHn8svLi//mAgC40CEBAHAxYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIASJcTpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAgP8Pv0UzTT7HSvQAAAAASUVORK5CYII=" alt="Cipher" style={{ width: 24, height: 24, display: "block" }} />
          <span
            style={{
              color: ACCENT,
              fontSize: 14,
              letterSpacing: "0.16em",
              fontWeight: 800,
            }}
          >
            CIPHER
          </span>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px 14px",
            color: "rgba(255,255,255,0.62)",
            fontSize: 14,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {["Protocol", "How It Works", "Governance"].map((item) => (
            <button
              key={item}
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: "4px 2px",
                font: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                cursor: "pointer",
                transition: "color 160ms ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
                maxWidth: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.62)";
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            navigate("/");
            window.scrollTo(0, 0);
          }}
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "10px 22px",
            borderRadius: "20px",
            cursor: "pointer",
            fontWeight: 700,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          BACK TO HOME
        </button>
      </div>

      <div
        style={{
          width: "100%",
          padding: "24px 16px 56px",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 0 10px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              navigate("/protocol-dashboard");
              window.scrollTo(0, 0);
            }}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              fontSize: 14,
              color: "rgba(181,236,52,0.5)",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            ← BACK TO HUB
          </button>
        </div>

        <div
          className="case-review-layout"
          style={{
            width: "100%",
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 0.9fr)",
            gap: 20,
            alignItems: "start",
            padding: "10px 0 0",
          }}
        >
        <Motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            padding: 20,
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: -16,
                left: "50%",
                transform: "translateX(-50%)",
                width: 100,
                height: 32,
                borderRadius: "8px 8px 0 0",
                border: "2px solid rgba(181,236,52,0.25)",
                background: "rgba(181,236,52,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid rgba(181,236,52,0.4)",
                  background: "rgba(6,8,16,0.9)",
                }}
              />
            </div>

            <div
              style={{
                border: "2px solid rgba(181,236,52,0.12)",
                borderRadius: 8,
                padding: 5,
                background: "rgba(181,236,52,0.03)",
              }}
            >
              <div
                style={{
                  border: "1px solid rgba(181,236,52,0.08)",
                  borderRadius: 6,
                  background: "rgba(10,16,28,0.9)",
                  backgroundImage:
                    "repeating-linear-gradient(transparent, transparent 32px, rgba(181,236,52,0.03) 32px, rgba(181,236,52,0.03) 33px)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    background: "rgba(181,236,52,0.05)",
                    padding: "16px 24px",
                    borderBottom: "1px solid rgba(181,236,52,0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontWeight: 700,
                      color: "rgba(181,236,52,0.7)",
                    }}
                  >
                    CASE #{displayCaseId}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 14,
                        letterSpacing: "0.12em",
                        color: "rgba(181,236,52,0.35)",
                        textTransform: "uppercase",
                      }}
                    >
                      CONFIDENTIAL
                    </span>
                    <span
                      style={{
                        border: "2px solid rgba(181,236,52,0.35)",
                        padding: "4px 12px",
                        fontSize: 14,
                        letterSpacing: "0.12em",
                        color: "#b5ec34",
                        transform: "rotate(-2deg)",
                        textTransform: "uppercase",
                        lineHeight: 1,
                      }}
                    >
                      {displayStatus}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "24px 22px 30px" }}>
                  {loadingClaim ? (
                    <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(148,163,184,0.9)" }}>
                      Loading live case data...
                    </p>
                  ) : null}
                  {claimError ? (
                    <p style={{ margin: "0 0 16px", fontSize: 14, color: "#fda4af" }}>
                      {claimError}. Showing fallback mock packet.
                    </p>
                  ) : null}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: "2px solid rgba(181,236,52,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: "#b5ec34",
                          lineHeight: 1,
                        }}
                      >
                        +
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 6,
                        fontSize: 14,
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.2)",
                        textTransform: "uppercase",
                      }}
                    >
                      PATIENT COMPLAINT
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{displayComplaint}</div>
                  </div>

                  <div
                    style={{
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 6,
                        fontSize: 14,
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.2)",
                        textTransform: "uppercase",
                      }}
                    >
                      DATE FILED
                    </div>
                    <div style={{ fontSize: 14, color: "#fff" }}>{displayDate}</div>
                  </div>

                  <div
                    style={{
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 6,
                        fontSize: 14,
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.2)",
                        textTransform: "uppercase",
                      }}
                    >
                      CLINICAL SUMMARY
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                      {displaySummary}
                    </div>
                  </div>

                  <div
                    style={{
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 6,
                        fontSize: 14,
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.2)",
                        textTransform: "uppercase",
                      }}
                    >
                      STAGE
                    </div>
                    <div style={{ fontSize: 14, color: "#b5ec34" }}>{displayStage}</div>
                  </div>

                  <div
                    style={{
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 6,
                        fontSize: 14,
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.2)",
                        textTransform: "uppercase",
                      }}
                    >
                      JURY PANEL
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                      {displayJurors} of {displayJurors}
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <div
                      style={{
                        height: 2,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 1,
                        position: "relative",
                        overflow: "visible",
                      }}
                    >
                      <div
                        style={{
                          height: 2,
                          background: "#b5ec34",
                          width: `${displayProgress}%`,
                          borderRadius: 1,
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            right: -2.5,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#b5ec34",
                            boxShadow: "0 0 10px rgba(181,236,52,0.9)",
                            animation: "caseReviewPulse 1.6s ease-in-out infinite",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 14,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        color: "rgba(255,255,255,0.15)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {Math.round(displayProgress)}% COMPLETE
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canStartEvaluation}
                    onClick={() => setEvaluationOpen(true)}
                    style={{
                      marginTop: 24,
                      width: "100%",
                      padding: "12px 22px",
                      borderRadius: "20px",
                      border: `1px solid ${canStartEvaluation ? "rgba(181,236,52,0.55)" : "rgba(148,163,184,0.3)"}`,
                      background: canStartEvaluation ? ACCENT : "rgba(30,41,59,0.6)",
                      color: canStartEvaluation ? "#020617" : "rgba(148,163,184,0.6)",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: canStartEvaluation ? "pointer" : "not-allowed",
                      boxShadow: canStartEvaluation ? "0 0 28px rgba(181,236,52,0.22)" : "none",
                    }}
                  >
                    Start Evaluation
                  </button>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 14,
                    fontSize: 14,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.1)",
                    textTransform: "uppercase",
                    pointerEvents: "none",
                  }}
                >
                  PAGE 1 OF 1
                </div>
              </div>
            </div>
          </div>
        </Motion.main>

        <div
          style={{
            margin: 0,
            padding: 24,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.15em",
              color: "rgba(181,236,52,0.5)",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            Case Timeline
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {timelineEvents.map((event, idx) => {
              const isCurrent = event.state === "current";
              const isDone = event.state === "done";
              const dotColor = isCurrent
                ? "#b5ec34"
                : isDone
                  ? "rgba(181,236,52,0.85)"
                  : "rgba(148,163,184,0.45)";
              return (
                <div key={`${event.label}-${event.date}`} style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 14,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: dotColor,
                        boxShadow: isCurrent ? "0 0 10px rgba(181,236,52,0.8)" : "none",
                        animation: isCurrent ? "caseReviewPulse 1.4s ease-in-out infinite" : "none",
                      }}
                    />
                    {idx < timelineEvents.length - 1 ? (
                      <span
                        style={{
                          width: 1,
                          flex: 1,
                          marginTop: 4,
                          background: "rgba(255,255,255,0.15)",
                          minHeight: 24,
                        }}
                      />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 14, color: "rgba(226,232,240,0.92)" }}>{event.label}</span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "rgba(148,163,184,0.75)",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        <style>{`
          @media (max-width: 1100px) {
            .case-review-layout {
              grid-template-columns: 1fr !important;
            }
          }
          @keyframes caseReviewPulse {
            0%, 100% { opacity: 0.75; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </div>
  );
}
