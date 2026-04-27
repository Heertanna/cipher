import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SmartProcessing } from "./SmartProcessing.jsx";
import { FastTrackApproval } from "./FastTrackApproval.jsx";
import { PeerReviewPreparation } from "./PeerReviewPreparation.jsx";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";
import { PROTOCOL_PAGE_BACKGROUND, PROTOCOL_DASHBOARD_CARD } from "../lib/protocolPageBackground.js";
import { addMockClaim } from "../data/mockDatabase.js";
import humanBody from "../assets/human.png";

const STORAGE_KEY = "cipher_claims_demo";
const DRAFT_KEY = "cipher_claim_draft_demo";
const CLAIM_ACCENT = "#b4c814";
/** Matches `src/index.css` body — same as the rest of the app */
const FONT_BODY = '"Sora", system-ui, -apple-system, sans-serif';

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function fileToSha256Hex(file) {
  // Best-effort hashing for demo. If it fails, caller can still store metadata.
  const buf = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(hashBuf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function FieldTag({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: 14,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.62)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", step }) {
  return (
    <input
      className="claim-journey-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      step={step}
      style={{
        width: "100%",
        padding: "14px 15px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#f1f5f9",
        fontSize: 14,
        fontFamily: FONT_BODY,
        outline: "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxSizing: "border-box",
      }}
    />
  );
}

function JourneyTextArea({ value, onChange, placeholder, rows = 3, maxLength }) {
  return (
    <textarea
      className="claim-journey-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      style={{
        width: "100%",
        padding: "14px 15px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#f1f5f9",
        fontSize: 14,
        fontFamily: FONT_BODY,
        outline: "none",
        resize: "vertical",
        minHeight: 75,
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxSizing: "border-box",
      }}
    />
  );
}

function JourneySelect({ value, onChange, options }) {
  return (
    <select
      className="claim-journey-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "14px 15px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#f1f5f9",
        fontSize: 14,
        fontFamily: FONT_BODY,
        outline: "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxSizing: "border-box",
      }}
    >
      {options.map((option) => (
        <option key={option} value={option} style={{ background: "#0b1020", color: "#f1f5f9" }}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function ClaimIntake({ onBack, onDone, onViewCaseProgress }) {
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [processingClaim, setProcessingClaim] = useState(null);
  const [processingClaimId, setProcessingClaimId] = useState(null);
  const [postProcessingPath, setPostProcessingPath] = useState(null);
  const [routeDecision, setRouteDecision] = useState(null);
  const [routingError, setRoutingError] = useState("");
  const [claimRpAwarded, setClaimRpAwarded] = useState(null);

  const storedDraft = useMemo(() => {
    return safeParse(window.localStorage.getItem(DRAFT_KEY));
  }, []);

  const [whatHappened, setWhatHappened] = useState(storedDraft?.whatHappened ?? "");
  const [whatHappenedCount, setWhatHappenedCount] = useState(0);
  const [whenHappened, setWhenHappened] = useState(storedDraft?.whenHappened ?? "");
  const [timeStatus, setTimeStatus] = useState(storedDraft?.timeStatus ?? "Ongoing");
  const [issueType, setIssueType] = useState(storedDraft?.issueType ?? "Emergency");
  const [doctorConsulted, setDoctorConsulted] = useState(storedDraft?.doctorConsulted ?? "Yes");
  const [recommendedTreatment, setRecommendedTreatment] = useState(
    storedDraft?.recommendedTreatment ?? ""
  );
  const [costDetails, setCostDetails] = useState(storedDraft?.costDetails ?? "");
  const [financialContext, setFinancialContext] = useState(
    storedDraft?.financialContext ?? "Struggling"
  );
  const [impactIfUntreated, setImpactIfUntreated] = useState(
    storedDraft?.impactIfUntreated ?? ""
  );

  const [reportsMeta, setReportsMeta] = useState(storedDraft?.reportsMeta ?? []);

  useEffect(() => {
    setWhatHappenedCount((whatHappened || "").length);
  }, [whatHappened]);

  const persistDraft = useCallback(
    (patch) => {
      const payload = {
        whatHappened,
        whenHappened,
        timeStatus,
        issueType,
        doctorConsulted,
        recommendedTreatment,
        costDetails,
        financialContext,
        impactIfUntreated,
        reportsMeta,
        ...patch,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      return payload;
    },
    [
      whatHappened,
      whenHappened,
      timeStatus,
      issueType,
      doctorConsulted,
      recommendedTreatment,
      costDetails,
      financialContext,
      impactIfUntreated,
      reportsMeta,
    ]
  );

  const requiredOk = useMemo(() => {
    // For the demo flow: keep Step 1 always actionable.
    return true;
  }, []);

  const claimSummary = useMemo(
    () => ({
      whatHappened,
      whenHappened,
      timeStatus,
      issueType,
      doctorConsulted,
      recommendedTreatment,
      costDetails,
      financialContext,
      impactIfUntreated,
      reportsMeta,
    }),
    [
      whatHappened,
      whenHappened,
      timeStatus,
      issueType,
      doctorConsulted,
      recommendedTreatment,
      costDetails,
      financialContext,
      impactIfUntreated,
      reportsMeta,
    ]
  );

  const completionFields = useMemo(
    () => [
      { key: "whatHappened", label: "incident summary", value: whatHappened },
      { key: "whenHappened", label: "incident date", value: whenHappened },
      { key: "timeStatus", label: "status timeline", value: timeStatus },
      { key: "issueType", label: "issue type", value: issueType },
      { key: "doctorConsulted", label: "doctor consultation", value: doctorConsulted },
      { key: "recommendedTreatment", label: "treatment details", value: recommendedTreatment },
      { key: "costDetails", label: "cost details", value: costDetails },
      { key: "financialContext", label: "financial context", value: financialContext },
      { key: "impactIfUntreated", label: "impact details", value: impactIfUntreated },
      { key: "reportsMeta", label: "supporting documents", value: reportsMeta?.length ? "yes" : "" },
    ],
    [
      whatHappened,
      whenHappened,
      timeStatus,
      issueType,
      doctorConsulted,
      recommendedTreatment,
      costDetails,
      financialContext,
      impactIfUntreated,
      reportsMeta,
    ]
  );

  const strengthPct = useMemo(() => {
    const filled = completionFields.filter((field) => String(field.value || "").trim()).length;
    return Math.max(8, Math.round((filled / completionFields.length) * 100));
  }, [completionFields]);

  const strengthTip = useMemo(() => {
    const firstMissing = completionFields.find((field) => !String(field.value || "").trim());
    if (!firstMissing) return "Ready for review. Your claim has strong contextual detail.";
    if (strengthPct >= 80) return `Almost complete. Add ${firstMissing.label} for maximum confidence.`;
    return `⚠ Add ${firstMissing.label} to reach ${Math.min(100, strengthPct + 15)}%.`;
  }, [completionFields, strengthPct]);

  const handleReportsSelection = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) {
        setReportsMeta([]);
        persistDraft({ reportsMeta: [] });
        return;
      }
      const metas = await Promise.all(
        files.map(async (f) => {
          const base = {
            name: f.name,
            size: f.size,
            type: f.type,
          };
          try {
            const sha256 = await fileToSha256Hex(f);
            return { ...base, sha256 };
          } catch {
            return base;
          }
        })
      );
      setReportsMeta(metas);
      persistDraft({ reportsMeta: metas });
    },
    [persistDraft]
  );

  const submit = useCallback(async () => {
    const existingRaw = window.localStorage.getItem(STORAGE_KEY);
    const existing = safeParse(existingRaw) || [];
    const { anonymousId } = getSession();

    const id = `C${Math.floor(Date.now() / 1000)}`;
    const newClaim = {
      id,
      status: "Under Jury Review",
      stage: "Jury review",
      createdAt: Date.now(),
      ...claimSummary,
      reportsAttached: reportsMeta?.length > 0,
      reportsCount: reportsMeta?.length || 0,
    };

    addMockClaim({
      id,
      memberId: anonymousId || "mbr_002",
      complaint: whatHappened || "General claim",
      dateFiled: new Date().toISOString().slice(0, 10),
      status: "Under Jury Review",
      juryPanel: 8,
      juryVoted: 0,
      progress: 8,
      estimatedCost: Number(String(costDetails || "").replace(/[^\d.]/g, "")) || 0,
      treatment: recommendedTreatment || "Not specified",
      category: issueType || "General",
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([newClaim, ...existing].slice(0, 20)));
    window.localStorage.removeItem(DRAFT_KEY);
    setProcessingClaimId(id);
    setProcessingClaim({ description: whatHappened });
    setRoutingError("");
    setRouteDecision(null);
    setClaimRpAwarded(null);

    // Parse first number from free-form cost details (e.g. "INR 120000")
    const numericCost = Number(String(costDetails || "").replace(/[^\d.]/g, "")) || 0;

    try {
      const res = await fetch(`${API_URL}/submit-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          what_happened: whatHappened,
          cost_inr: numericCost,
          recommendedTreatment,
          costDetails,
          impactIfUntreated,
          reportsMeta,
          anonymous_id: anonymousId || undefined,
          anonymousId: anonymousId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not submit claim.");
      }
      setRouteDecision(data);
      setClaimRpAwarded(Number(data.rp_awarded) || 0);
      if (data.claim_id != null) {
        const backendId = String(data.claim_id);
        setProcessingClaimId(backendId);
        const rawClaims = window.localStorage.getItem(STORAGE_KEY);
        const arr = safeParse(rawClaims) || [];
        if (arr[0]?.id === id) {
          arr[0] = { ...arr[0], id: backendId };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        }
      }
    } catch (e) {
      setRoutingError(e?.message || "Could not route claim.");
      setClaimRpAwarded(0);
      try {
        const res = await fetch(`${API_URL}/claims/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            what_happened: whatHappened,
            cost_inr: numericCost,
          }),
        });
        const data = await res.json();
        if (res.ok) setRouteDecision(data);
        else
          setRouteDecision({
            path: "PATH_B",
            reason: "route_service_unavailable",
          });
      } catch {
        setRouteDecision({
          path: "PATH_B",
          reason: "route_service_unavailable",
        });
      }
    } finally {
      setProcessing(true);
    }
  }, [
    claimSummary,
    reportsMeta,
    whatHappened,
    costDetails,
    recommendedTreatment,
    impactIfUntreated,
  ]);

  const goForward = useCallback(() => {
    if (step < 3) {
      setStepDirection(1);
      setStep((prev) => prev + 1);
      return;
    }
    submit();
  }, [step, submit]);

  const goBackward = useCallback(() => {
    if (step > 1) {
      setStepDirection(-1);
      setStep((prev) => prev - 1);
      return;
    }
    onBack?.();
  }, [step, onBack]);

  if (processing) {
    return (
      <SmartProcessing
        claimData={{
          description: processingClaim?.description ?? whatHappened ?? "",
        }}
        routeDecision={routeDecision}
        onContinue={(path) => {
          if (path === "PathA") {
            setPostProcessingPath("PathA");
            setProcessing(false);
            return;
          }
          setPostProcessingPath("PathBPrep");
          setProcessing(false);
        }}
      />
    );
  }

  if (postProcessingPath === "PathA") {
    return (
      <FastTrackApproval
        description={whatHappened}
        type={issueType}
        cost={costDetails}
        claimRpAwarded={claimRpAwarded}
        onGoDashboard={() => onDone?.()}
      />
    );
  }

  if (postProcessingPath === "PathBPrep") {
    return (
      <PeerReviewPreparation
        claimId={processingClaimId}
        description={whatHappened}
        claimRpAwarded={claimRpAwarded}
        onGoDashboard={() => onDone?.()}
        onViewCaseProgress={() => {
          let storedClaims = [];
          try {
            storedClaims = JSON.parse(window.localStorage.getItem("cipher_claims_demo") || "[]");
          } catch {
            storedClaims = [];
          }
          const claim =
            storedClaims.find((c) => c.id === processingClaimId) ||
            processingClaim ||
            { id: processingClaimId, whatHappened, typeOfIssue: issueType, costDetails };
          if (typeof onViewCaseProgress === "function") onViewCaseProgress(claim);
          else onDone?.();
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        ...PROTOCOL_PAGE_BACKGROUND,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "12px 24px",
        position: "relative",
        fontFamily: FONT_BODY,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1180, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 1180,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            padding: "0 4px",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "#b4c814",
                fontFamily: "monospace",
                textTransform: "uppercase",
              }}
            >
              ONBOARDING - STEP {step} OF 3
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  style={{
                    width: step === dot ? 28 : 20,
                    height: 3,
                    borderRadius: 2,
                    background:
                      step === dot ? "#b4c814" : dot < step ? "rgba(180,200,20,0.35)" : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260, display: "flex", justifyContent: "center" }}>
            <svg width="320" height="24" viewBox="0 0 320 24" aria-hidden="true">
              <path
                d="M0,12 L40,12 L55,12 L65,2 L75,22 L85,12 L100,12 L170,12 L185,12 L195,4 L205,20 L215,12 L235,12 L320,12"
                stroke={CLAIM_ACCENT}
                strokeWidth="1.4"
                fill="none"
                style={{
                  strokeDasharray: 560,
                  strokeDashoffset: 560,
                  animation: "drawEcg 1.8s ease forwards, ecgLoop 3s linear 2s infinite",
                }}
              />
            </svg>
          </div>

          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(180,200,20,0.35)",
              background: "rgba(180,200,20,0.08)",
              color: "#d9f99d",
              display: "grid",
              placeItems: "center",
              fontSize: 14,
            }}
          >
            ♥
          </div>
        </div>

      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          height: "calc(100vh - 80px)",
          minHeight: 750,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,11,18,0.98)",
          boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
          animation: "fadeUp 500ms ease both",
        }}
      >
        <div
          className="claim-journey-grid"
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <aside
            style={{
              position: "relative",
              flex: 1,
              padding: "32px 36px",
              borderRight: "1px solid rgba(255,255,255,0.08)",
              background:
                "radial-gradient(circle at 22% 14%, rgba(180,200,20,0.16) 0%, rgba(8,11,18,0.98) 52%), rgba(8,11,18,0.92)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(180,200,20,0.32)",
                  color: "rgba(180,200,20,0.95)",
                  background: "rgba(180,200,20,0.08)",
                  fontFamily: FONT_BODY,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Submit a claim
              </div>
              <h2
                style={{
                  margin: "16px 0 0",
                  fontSize: 28,
                  lineHeight: 1.06,
                  color: "#f8fafc",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Let's understand
                <br />
                <span style={{ color: CLAIM_ACCENT }}>what happened</span>
              </h2>
              <p style={{ margin: "12px 0 0", color: "rgba(226,232,240,0.7)", fontSize: 14, lineHeight: 1.65 }}>
                We'll take it step by step. Your community is here to help.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <img
                src={humanBody}
                alt="body"
                style={{
                  height: "100%",
                  width: "auto",
                  maxHeight: 500,
                  objectFit: "contain",
                  opacity: 0.75,
                  filter: "brightness(0.4) sepia(1) hue-rotate(50deg) saturate(6) contrast(1.2)",
                  maskImage:
                    "radial-gradient(ellipse 80% 90% at 50% 50%, black 40%, transparent 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 80% 90% at 50% 50%, black 40%, transparent 100%)",
                  animation: "floatSway 5s ease-in-out infinite",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(180,200,20,0.04) 0%, transparent 80%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            <div
              style={{
                border: "1px solid rgba(180,200,20,0.2)",
                background: "rgba(180,200,20,0.08)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "rgba(231,255,160,0.9)",
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              ◇ Your information is secure and confidential
            </div>
          </aside>

          <section
            style={{
              ...PROTOCOL_DASHBOARD_CARD,
              padding: "32px 36px",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.08) transparent",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              minHeight: 0,
              boxSizing: "border-box",
            }}
          >
            <div
              key={step}
              className={`claim-step-pane ${stepDirection > 0 ? "claim-step-forward" : "claim-step-back"}`}
              style={{ flex: 1 }}
            >
              {step === 1 ? (
                <div style={{ display: "grid", gridTemplateColumns: "38px minmax(0,1fr)", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>
                    {["◎", "▦", "⊕", "♦"].map((icon, idx) => (
                      <React.Fragment key={icon}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: `1px solid ${
                              idx === 0 ? "rgba(180,200,20,0.4)" : "rgba(255,255,255,0.1)"
                            }`,
                            background: idx === 0 ? "rgba(180,200,20,0.06)" : "rgba(255,255,255,0.03)",
                            color: idx === 0 ? "#b4c814" : "rgba(255,255,255,0.4)",
                            boxShadow: idx === 0 ? "0 0 20px rgba(180,200,20,0.25)" : "none",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 14,
                            fontFamily: "monospace",
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </div>
                        {idx < 3 ? (
                          <div
                            style={{
                              width: 1,
                              height: 98,
                              borderLeft: "1px dashed rgba(255,255,255,0.1)",
                              margin: "6px 0",
                            }}
                          />
                        ) : null}
                      </React.Fragment>
                    ))}
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <FieldTag>1. What happened?</FieldTag>
                      <div style={{ position: "relative" }}>
                        <JourneyTextArea
                          value={whatHappened}
                          onChange={(v) => {
                            setWhatHappened(v);
                            setWhatHappenedCount(v.length);
                            persistDraft({ whatHappened: v });
                          }}
                          placeholder="Short description of the incident, condition, or event"
                          rows={4}
                          maxLength={500}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: 8,
                            right: 12,
                            fontSize: 11,
                            color: "rgba(255,255,255,0.2)",
                            fontFamily: "monospace",
                          }}
                        >
                          {whatHappenedCount}/500
                        </span>
                      </div>
                    </div>

                    <div>
                      <FieldTag>2. When did it happen?</FieldTag>
                      <Input
                        type="date"
                        value={whenHappened}
                        onChange={(v) => {
                          setWhenHappened(v);
                          persistDraft({ whenHappened: v });
                        }}
                      />
                    </div>

                    <div>
                      <FieldTag>3. Ongoing or completed?</FieldTag>
                      <JourneySelect
                        value={timeStatus}
                        onChange={(v) => {
                          setTimeStatus(v);
                          persistDraft({ timeStatus: v });
                        }}
                        options={["Ongoing", "Completed"]}
                      />
                    </div>

                    <div>
                      <FieldTag>4. Type of issue</FieldTag>
                      <JourneySelect
                        value={issueType}
                        onChange={(v) => {
                          setIssueType(v);
                          persistDraft({ issueType: v });
                        }}
                        options={["Emergency", "Planned", "Ongoing condition"]}
                      />
                    </div>

                    <div>
                      <FieldTag>5. Doctor consulted?</FieldTag>
                      <JourneySelect
                        value={doctorConsulted}
                        onChange={(v) => {
                          setDoctorConsulted(v);
                          persistDraft({ doctorConsulted: v });
                        }}
                        options={["Yes", "No"]}
                      />
                    </div>

                    <div>
                      <FieldTag>Upload supporting documents (optional)</FieldTag>
                      <label
                        style={{
                          border: "1px dashed rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          padding: 14,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          background: "rgba(255,255,255,0.02)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(180,200,20,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                        }}
                      >
                        <input
                          type="file"
                          multiple
                          accept="application/pdf,image/*"
                          onChange={handleReportsSelection}
                          style={{ display: "none" }}
                        />
                        <span style={{ fontSize: 24, opacity: 0.5, fontFamily: "monospace" }}>□</span>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Drag & drop files here</div>
                        <span
                          style={{
                            padding: "8px 20px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                          }}
                        >
                          CHOOSE FILES
                        </span>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>PDF, JPG, PNG up to 10MB</div>
                        {reportsMeta.length > 0 ? (
                          <div style={{ fontSize: 11, color: "#b4c814" }}>{reportsMeta.length} file(s) selected</div>
                        ) : null}
                      </label>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <FieldTag>Recommended treatment</FieldTag>
                    <JourneyTextArea
                      value={recommendedTreatment}
                      onChange={(v) => {
                        setRecommendedTreatment(v);
                        persistDraft({ recommendedTreatment: v });
                      }}
                      placeholder="What treatment has been recommended (if known)"
                      rows={4}
                    />
                  </div>
                  <div>
                    <FieldTag>Cost details</FieldTag>
                    <Input
                      value={costDetails}
                      onChange={(v) => {
                        setCostDetails(v);
                        persistDraft({ costDetails: v });
                      }}
                      placeholder="Estimated cost, currency, and notes (e.g. INR 120000)"
                    />
                  </div>
                  <div>
                    <FieldTag>Financial situation</FieldTag>
                    <JourneySelect
                      value={financialContext}
                      onChange={(v) => {
                        setFinancialContext(v);
                        persistDraft({ financialContext: v });
                      }}
                      options={["Stable", "Struggling", "Severe strain"]}
                    />
                  </div>
                  <div>
                    <FieldTag>Impact if not treated</FieldTag>
                    <JourneyTextArea
                      value={impactIfUntreated}
                      onChange={(v) => {
                        setImpactIfUntreated(v);
                        persistDraft({ impactIfUntreated: v });
                      }}
                      placeholder="What happens if this isn’t treated soon?"
                      rows={4}
                    />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      border: "1px dashed rgba(180,200,20,0.34)",
                      background: "rgba(180,200,20,0.04)",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <FieldTag>Document upload area</FieldTag>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      onChange={handleReportsSelection}
                      style={{ width: "100%", color: "rgba(255,255,255,0.86)", fontSize: 14 }}
                    />
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                      {reportsMeta?.length
                        ? `${reportsMeta.length} file(s) ready. Metadata only is stored in this demo.`
                        : "Optional: attach PDFs/images to strengthen peer review context."}
                    </p>
                  </div>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <FieldTag>Summary review</FieldTag>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        ["What happened", whatHappened || "—"],
                        ["When did it happen", whenHappened || "—"],
                        ["Status", timeStatus || "—"],
                        ["Issue type", issueType || "—"],
                        ["Doctor consulted", doctorConsulted || "—"],
                        ["Treatment", recommendedTreatment || "—"],
                        ["Cost details", costDetails || "—"],
                        ["Financial context", financialContext || "—"],
                        ["Impact if not treated", impactIfUntreated || "—"],
                      ].map(([label, value]) => (
                        <div key={label} style={{ gridColumn: label === "Impact if not treated" ? "1 / -1" : "auto" }}>
                          <div
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: 11,
                              letterSpacing: "0.11em",
                              color: "rgba(255,255,255,0.45)",
                              textTransform: "uppercase",
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 14,
                              lineHeight: 1.5,
                              color: "rgba(248,250,252,0.92)",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                marginTop: 16,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 12,
                    letterSpacing: "0.11em",
                    color: "rgba(255,255,255,0.62)",
                  }}
                >
                  CLAIM STRENGTH
                </span>
                <span style={{ color: CLAIM_ACCENT, fontSize: 13, fontWeight: 700 }}>{strengthPct}%</span>
              </div>
              <div
                style={{
                  height: 3,
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: 2,
                  margin: "8px 0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${strengthPct}%`,
                    background: "linear-gradient(90deg, rgba(180,200,20,0.5), #b4c814)",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: "rgba(180,200,20,0.65)" }}>{strengthTip}</div>
            </div>

            {step === 1 ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 16px",
                  background: "rgba(180,200,20,0.06)",
                  border: "1px solid rgba(180,200,20,0.15)",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span>◉</span>
                <span>You can proceed now. Supporting documents can be added later.</span>
              </div>
            ) : null}

            {routingError ? (
              <div style={{ marginTop: 10, fontSize: 13, color: "#fda4af" }}>{routingError}</div>
            ) : null}

            <div
              style={{
                marginTop: 16,
                paddingTop: 4,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={goBackward}
                style={{
                  minWidth: 130,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "transparent",
                  color: "rgba(236,253,245,0.9)",
                  padding: "12px 18px",
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  fontFamily: FONT_BODY,
                  cursor: "pointer",
                }}
              >
                BACK
              </button>
              <button
                type="button"
                onClick={goForward}
                disabled={!requiredOk}
                style={{
                  minWidth: 190,
                  borderRadius: 12,
                  border: "none",
                  background: CLAIM_ACCENT,
                  color: "#060810",
                  padding: "12px 20px",
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  fontWeight: 800,
                  fontFamily: FONT_BODY,
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(180,200,20,0.25)",
                }}
              >
                {step < 3 ? "NEXT →" : "SUBMIT FOR REVIEW →"}
              </button>
            </div>
          </section>
        </div>

        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "16px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            color: "rgba(226,232,240,0.56)",
            fontSize: 12,
            letterSpacing: "0.05em",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              border: "none",
              background: "none",
              color: "rgba(226,232,240,0.72)",
              cursor: "pointer",
              fontFamily: FONT_BODY,
              letterSpacing: "0.08em",
              fontSize: 12,
              padding: 0,
            }}
          >
            ← BACK TO DASHBOARD
          </button>
          <div>◈ Encrypted · ◎ Peer reviewed · ◉ 48hr response</div>
        </div>
      </div>
      </div>

      <style>{`
        .claim-journey-field:focus {
          border-color: #b4c814 !important;
          box-shadow: 0 0 0 3px rgba(180,200,20,0.07) !important;
        }
        .claim-step-pane {
          animation: fadeUp 350ms ease both;
        }
        .claim-step-forward {
          animation: stepInFromRight 350ms ease both;
        }
        .claim-step-back {
          animation: stepInFromLeft 350ms ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepInFromRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes stepInFromLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes drawEcg { to { stroke-dashoffset: 0; } }
        @keyframes ecgLoop {
          0% { stroke-dashoffset: 0; }
          80% { stroke-dashoffset: -500; }
          81% { stroke-dashoffset: 500; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.1); }
          60% { transform: scale(0.98); }
        }
        @keyframes heartPulse {
          0%,100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes floatSway {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 0.78; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.16); }
        }
        @media (max-width: 920px) {
          .claim-journey-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

