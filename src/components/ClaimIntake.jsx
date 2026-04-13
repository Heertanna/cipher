import React, { useCallback, useMemo, useState } from "react";
import { FaintBackground, Label, Select, TextArea, ACCENT } from "./OnboardingCommon.jsx";
import { SmartProcessing } from "./SmartProcessing.jsx";
import { FastTrackApproval } from "./FastTrackApproval.jsx";
import { PeerReviewPreparation } from "./PeerReviewPreparation.jsx";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";

const STORAGE_KEY = "cipher_claims_demo";
const DRAFT_KEY = "cipher_claim_draft_demo";

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

function Input({ value, onChange, placeholder, type = "text", step }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      step={step}
      style={{
        width: "100%",
        padding: "14px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "#f1f5f9",
        fontSize: 15,
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(181,236,52,0.5)";
        e.target.style.boxShadow =
          "0 0 0 2px rgba(181,236,52,0.1), 0 0 20px rgba(181,236,52,0.06)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

export function ClaimIntake({ onBack, onDone }) {
  const [step, setStep] = useState(1);
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

  const submit = useCallback(async () => {
    const existingRaw = window.localStorage.getItem(STORAGE_KEY);
    const existing = safeParse(existingRaw) || [];

    const id = `C${Math.floor(Date.now() / 1000)}`;
    const newClaim = {
      id,
      status: "Pending",
      stage: "Pre-check",
      createdAt: Date.now(),
      ...claimSummary,
      reportsAttached: reportsMeta?.length > 0,
      reportsCount: reportsMeta?.length || 0,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([newClaim, ...existing].slice(0, 20)));
    window.localStorage.removeItem(DRAFT_KEY);
    setProcessingClaimId(id);
    setProcessingClaim({ description: whatHappened });
    setRoutingError("");
    setRouteDecision(null);
    setClaimRpAwarded(null);

    // Parse first number from free-form cost details (e.g. "INR 120000")
    const numericCost = Number(String(costDetails || "").replace(/[^\d.]/g, "")) || 0;
    const { anonymousId } = getSession();

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
        onViewCaseProgress={() => onDone?.()}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
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
          boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
        }}
      >
        {/* top row: step indicator + back */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(181,236,52,0.45)",
                marginBottom: 10,
              }}
            >
              Onboarding — Step {step} of 3
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 60,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(step / 3) * 100}%`,
                    height: "100%",
                    background: ACCENT,
                    opacity: 0.65,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Submit a claim
              </span>
            </div>
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
          >
            ← Back
          </button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 3.6vw, 2.2rem)",
              fontWeight: 800,
              color: "#f1f5f9",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              marginBottom: 10,
              lineHeight: 1.05,
            }}
          >
            Submit a Claim
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.4)",
              maxWidth: 620,
              margin: 0,
            }}
          >
            Basic intake to start protocol review. You can edit details later.
          </p>
        </div>

        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>What happened</Label>
              <TextArea
                value={whatHappened}
                onChange={(v) => {
                  setWhatHappened(v);
                  persistDraft({ whatHappened: v });
                }}
                placeholder="Short description of the incident, condition, or event"
                rows={3}
              />
            </div>

            <div>
              <Label>When did it happen</Label>
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
              <Label>Ongoing or completed</Label>
              <Select
                value={timeStatus}
                onChange={(v) => {
                  setTimeStatus(v);
                  persistDraft({ timeStatus: v });
                }}
                options={["Ongoing", "Completed"]}
                placeholder={null}
              />
            </div>

            <div>
              <Label>Type of issue</Label>
              <Select
                value={issueType}
                onChange={(v) => {
                  setIssueType(v);
                  persistDraft({ issueType: v });
                }}
                options={["Emergency", "Planned", "Ongoing condition"]}
                placeholder={null}
              />
            </div>

            <div>
              <Label>Doctor consulted</Label>
              <Select
                value={doctorConsulted}
                onChange={(v) => {
                  setDoctorConsulted(v);
                  persistDraft({ doctorConsulted: v });
                }}
                options={["Yes", "No"]}
                placeholder={null}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Recommended treatment</Label>
              <TextArea
                value={recommendedTreatment}
                onChange={(v) => {
                  setRecommendedTreatment(v);
                  persistDraft({ recommendedTreatment: v });
                }}
                placeholder="What treatment has been recommended (if known)"
                rows={2}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Cost details</Label>
              <Input
                value={costDetails}
                onChange={(v) => {
                  setCostDetails(v);
                  persistDraft({ costDetails: v });
                }}
                placeholder="Estimated cost, currency, and any notes (e.g. INR 120000)"
              />
            </div>

            <div>
              <Label>Financial situation</Label>
              <Select
                value={financialContext}
                onChange={(v) => {
                  setFinancialContext(v);
                  persistDraft({ financialContext: v });
                }}
                options={["Stable", "Struggling", "Severe strain"]}
                placeholder={null}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Impact if not treated</Label>
              <TextArea
                value={impactIfUntreated}
                onChange={(v) => {
                  setImpactIfUntreated(v);
                  persistDraft({ impactIfUntreated: v });
                }}
                placeholder="What happens if this isn’t treated soon?"
                rows={3}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Medical reports (optional)</Label>
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) {
                      setReportsMeta([]);
                      persistDraft({ reportsMeta: [] });
                      return;
                    }

                    // Compute lightweight metadata (hashes best-effort).
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
                  }}
                  style={{
                    width: "100%",
                    color: "#f1f5f9",
                    fontFamily: "inherit",
                  }}
                />
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  {reportsMeta?.length
                    ? `${reportsMeta.length} report(s) attached (metadata saved in this demo).`
                    : "Optional: attach PDFs/images. This demo stores only lightweight metadata."}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 14,
                }}
              >
                Review (basic)
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  ["What happened", whatHappened || "—"],
                  ["When", whenHappened || "—"],
                  ["Ongoing/Completed", timeStatus],
                  ["Issue type", issueType],
                  ["Doctor consulted", doctorConsulted],
                  ["Financial situation", financialContext],
                  ["Recommended treatment", recommendedTreatment || "—"],
                  ["Cost details", costDetails || "—"],
                  ["Impact if not treated", impactIfUntreated || "—"],
                  [
                    "Medical reports",
                    reportsMeta?.length
                      ? `${reportsMeta.length} attached`
                      : "No reports attached",
                  ],
                ].map(([k, v]) => (
                  <div key={k} style={{ gridColumn: k === "Impact if not treated" ? "1 / -1" : undefined }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {k}
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        color: "rgba(241,245,249,0.92)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              border: "1px solid rgba(181,236,52,0.2)",
              background: "radial-gradient(circle at 10% 0%, rgba(181,236,52,0.14), transparent 55%), rgba(255,255,255,0.02)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: ACCENT,
              }}
            >
              Submitted
            </p>
            <h2
              style={{
                margin: "10px 0 8px",
                fontSize: 22,
                fontWeight: 900,
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
              }}
            >
              Your claim is now in Pre-check.
            </h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
              You can return to the dashboard to see the updated stage.
            </p>
          </div>
        )}

        {/* footer actions */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.02em",
            }}
          >
            {step === 1
              ? "Basic info is enough to start review."
              : step === 2
              ? "Confirm to submit for protocol processing."
              : "Back to dashboard to continue."}
          </p>
          {routingError ? (
            <p style={{ margin: 0, fontSize: 12, color: "#fda4af", letterSpacing: "0.01em" }}>
              {routingError}
            </p>
          ) : null}

          {step === 1 && (
            <button
              onClick={() => {
                submit();
              }}
              style={{
                padding: "14px 40px",
                border: "none",
                borderRadius: 6,
                background: ACCENT,
                color: "#050505",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "opacity 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              Next
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => submit()}
              style={{
                padding: "14px 40px",
                border: "none",
                borderRadius: 6,
                background: ACCENT,
                color: "#050505",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "opacity 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              submit
            </button>
          )}

          {step === 3 && (
            <button
              onClick={onDone}
              style={{
                padding: "14px 40px",
                border: "none",
                borderRadius: 6,
                background: ACCENT,
                color: "#050505",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "opacity 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              Return to dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

