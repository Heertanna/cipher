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
          <img src="data:image/png;base64,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" alt="Cipher" style={{ width: 24, height: 24, display: "block" }} />
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
