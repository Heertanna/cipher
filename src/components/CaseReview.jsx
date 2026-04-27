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
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Cipher"
            role="img"
            style={{ display: "block", flexShrink: 0 }}
          >
            {/* Top */}
            <rect x="40" y="5" width="8" height="8" fill="#b4c814" />
            <rect x="52" y="5" width="8" height="8" fill="#b4c814" />
            {/* Top right */}
            <rect x="68" y="15" width="8" height="8" fill="#b4c814" />
            <rect x="80" y="22" width="8" height="8" fill="#b4c814" />
            {/* Right */}
            <rect x="87" y="38" width="8" height="8" fill="#b4c814" />
            <rect x="87" y="52" width="8" height="8" fill="#b4c814" />
            {/* Bottom right */}
            <rect x="78" y="68" width="8" height="8" fill="#b4c814" />
            <rect x="68" y="78" width="8" height="8" fill="#b4c814" />
            {/* Bottom */}
            <rect x="52" y="87" width="8" height="8" fill="#b4c814" />
            <rect x="40" y="87" width="8" height="8" fill="#b4c814" />
            {/* Bottom left */}
            <rect x="22" y="78" width="8" height="8" fill="#b4c814" />
            <rect x="12" y="68" width="8" height="8" fill="#b4c814" />
            {/* Left */}
            <rect x="5" y="52" width="8" height="8" fill="#b4c814" />
            <rect x="5" y="38" width="8" height="8" fill="#b4c814" />
            {/* Top left */}
            <rect x="12" y="22" width="8" height="8" fill="#b4c814" />
            <rect x="22" y="12" width="8" height="8" fill="#b4c814" />
            {/* Cross details on each cluster - small squares */}
            <rect x="36" y="9" width="4" height="4" fill="#b4c814" opacity="0.6" />
            <rect x="60" y="9" width="4" height="4" fill="#b4c814" opacity="0.6" />
          </svg>
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
