import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";
import { PROTOCOL_PAGE_BACKGROUND } from "../lib/protocolPageBackground.js";

const TOTAL_STEPS = 5;

const EVIDENCE_OPTIONS = [
  { key: "yes", label: "Yes" },
  { key: "maybe", label: "Maybe" },
  { key: "no", label: "No" },
];

const TREATMENT_OPTIONS = [
  { key: "appropriate", label: "Appropriate" },
  { key: "uncertain", label: "Uncertain" },
  { key: "notAppropriate", label: "Not appropriate" },
];

const COST_OPTIONS = [
  { key: "within", label: "Within range" },
  { key: "slightlyHigh", label: "Slightly high" },
  { key: "unclear", label: "Unclear" },
];

const FINAL_OPTIONS = [
  { key: "support", label: "Support this case" },
  { key: "furtherReview", label: "Needs further review" },
  { key: "doNotSupport", label: "Do not support" },
];

function labelFrom(options, key) {
  return options.find((o) => o.key === key)?.label ?? "—";
}

const glassPanel = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(14px)",
};

const transition = { duration: 0.38, ease: [0.22, 1, 0.36, 1] };

function OptionCards({ options, selected, onSelect }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            style={{
              textAlign: "left",
              padding: "18px 20px",
              borderRadius: 14,
              border: active
                ? `1px solid rgba(181,236,52,0.65)`
                : "1px solid rgba(255,255,255,0.1)",
              background: active
                ? "rgba(181,236,52,0.1)"
                : "rgba(255,255,255,0.03)",
              color: "#f1f5f9",
              fontSize: 16,
              fontWeight: 650,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              boxShadow: active ? "0 0 32px rgba(181,236,52,0.12)" : "none",
              transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ContextBlock({ title, children }) {
  return (
    <div style={{ ...glassPanel, padding: "16px 18px" }}>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.85)",
        }}
      >
        {title}
      </p>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(226,232,240,0.94)" }}>
        {children}
      </div>
    </div>
  );
}

export function JuryEvaluationFlow({ packet, onComplete, onLeave }) {
  const [step, setStep] = useState(1);
  const [evidenceChoice, setEvidenceChoice] = useState(null);
  const [evidenceReason, setEvidenceReason] = useState("");
  const [treatmentChoice, setTreatmentChoice] = useState(null);
  const [treatmentReason, setTreatmentReason] = useState("");
  const [costChoice, setCostChoice] = useState(null);
  const [costReason, setCostReason] = useState("");
  const [finalChoice, setFinalChoice] = useState(null);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [savingEvidenceStep, setSavingEvidenceStep] = useState(false);

  const closeReportsModal = useCallback(() => setReportsModalOpen(false), []);

  useEffect(() => {
    if (step !== 2) setReportsModalOpen(false);
  }, [step]);

  useEffect(() => {
    if (!reportsModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeReportsModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reportsModalOpen, closeReportsModal]);

  useEffect(() => {
    if (!reportsModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reportsModalOpen]);

  const canAdvance = useMemo(() => {
    if (step === 1) return true;
    if (step === 2)
      return Boolean(evidenceChoice && evidenceReason.trim().length > 0);
    if (step === 3)
      return Boolean(treatmentChoice && treatmentReason.trim().length > 0);
    if (step === 4) return Boolean(costChoice && costReason.trim().length > 0);
    if (step === 5) return Boolean(finalChoice);
    return false;
  }, [
    step,
    evidenceChoice,
    evidenceReason,
    treatmentChoice,
    treatmentReason,
    costChoice,
    costReason,
    finalChoice,
  ]);

  const goNext = useCallback(() => {
    if (!canAdvance) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [canAdvance, step]);

  useEffect(() => {
    if (step !== 2) setSavingEvidenceStep(false);
  }, [step]);

  const goBack = useCallback(() => {
    if (step <= 1) return;
    setStep((s) => s - 1);
  }, [step]);

  const submitFinal = useCallback(() => {
    if (!finalChoice) return;
    onComplete?.({
      caseId: packet.caseId,
      evidence: { choice: evidenceChoice, reasoning: evidenceReason.trim() },
      treatment: { choice: treatmentChoice, reasoning: treatmentReason.trim() },
      cost: { choice: costChoice, reasoning: costReason.trim() },
      position: finalChoice,
    });
  }, [
    onComplete,
    packet.caseId,
    evidenceChoice,
    evidenceReason,
    treatmentChoice,
    treatmentReason,
    costChoice,
    costReason,
    finalChoice,
  ]);

  const primaryFooterLabel = useMemo(() => {
    if (step === 2 && savingEvidenceStep) return "Saving your evaluation...";
    if (step === 2) return "Continue to Diagnosis";
    if (step === TOTAL_STEPS) return "Record your position";
    return "Next";
  }, [step, savingEvidenceStep]);

  const onFooterPrimary = useCallback(() => {
    if (step === TOTAL_STEPS) {
      submitFinal();
      return;
    }
    if (step === 2) {
      if (!canAdvance || savingEvidenceStep) return;
      setSavingEvidenceStep(true);
      window.setTimeout(() => {
        setStep(3);
        setSavingEvidenceStep(false);
      }, 520);
      return;
    }
    goNext();
  }, [
    step,
    canAdvance,
    savingEvidenceStep,
    submitFinal,
    goNext,
  ]);

  const cannotProgressFooter =
    step === TOTAL_STEPS ? !finalChoice : !canAdvance;

  const evidenceCtaReady =
    step === 2 && canAdvance && !savingEvidenceStep;

  const evidenceSaving = step === 2 && savingEvidenceStep;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        ...PROTOCOL_PAGE_BACKGROUND,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 24px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(2,3,10,0.94)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          onClick={onLeave}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            border: "1px solid rgba(148,163,184,0.4)",
            background: "rgba(15,23,42,0.5)",
            color: "rgba(203,213,225,0.95)",
          }}
        >
          Leave evaluation
        </button>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.75)",
            }}
          >
            Step {step} of {TOTAL_STEPS}
          </p>
          <div
            style={{
              marginTop: 8,
              height: 3,
              borderRadius: 999,
              width: 140,
              marginLeft: "auto",
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(step / TOTAL_STEPS) * 100}%`,
                borderRadius: 999,
                background: ACCENT,
                boxShadow: "0 0 12px rgba(181,236,52,0.45)",
                transition: "width 0.35s ease",
              }}
            />
          </div>
        </div>
      </header>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "24px 24px",
          paddingBottom: step === 1 ? 48 : 120,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 640 }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Motion.div
                key="s1"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={transition}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(181,236,52,0.5)",
                  }}
                >
                  ⚖️ Juror role active
                </p>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                    fontWeight: 800,
                    color: "#f9fafb",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                  }}
                >
                  Review this case
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(16px, 2.1vw, 18px)",
                    lineHeight: 1.62,
                    color: "rgba(148,163,184,0.95)",
                  }}
                >
                  Start by understanding the situation. You’ll evaluate
                  evidence, treatment, and cost step by step.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    role="presentation"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      columnGap: 12,
                      rowGap: 8,
                      fontSize: "clamp(14px, 1.9vw, 16px)",
                      fontWeight: 500,
                      letterSpacing: "0.03em",
                      color: "rgba(148,163,184,0.82)",
                    }}
                  >
                    {["Evidence", "Treatment", "Cost", "Decision"].map(
                      (label, i) => (
                        <React.Fragment key={label}>
                          {i > 0 ? (
                            <span
                              style={{
                                opacity: 0.32,
                                fontWeight: 400,
                                userSelect: "none",
                              }}
                              aria-hidden
                            >
                              →
                            </span>
                          ) : null}
                          <span>{label}</span>
                        </React.Fragment>
                      )
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.55,
                      fontWeight: 400,
                      fontStyle: "italic",
                      color: "rgba(148,163,184,0.48)",
                    }}
                  >
                    Focus on fairness, not certainty.
                  </p>
                  {packet.caseType === "Emergency" ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.5,
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        color: "rgba(250,204,21,0.42)",
                      }}
                    >
                      Emergency case — timely review matters
                    </p>
                  ) : null}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <ContextBlock title="Case ID">
                    <span style={{ fontWeight: 700, color: "#f9fafb" }}>
                      #{packet.caseId}
                    </span>
                  </ContextBlock>
                  <ContextBlock title="Type">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 700,
                        color: "#f9fafb",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: ACCENT,
                          boxShadow: "0 0 10px rgba(181,236,52,0.6)",
                        }}
                      />
                      {packet.caseType}
                    </span>
                  </ContextBlock>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={goNext}
                    style={{
                      padding: "14px 28px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      border: "1px solid rgba(181,236,52,0.55)",
                      background: ACCENT,
                      color: "#020617",
                      boxShadow: "0 0 28px rgba(181,236,52,0.2)",
                    }}
                  >
                    View Medical Context
                  </button>
                </div>
              </Motion.div>
            )}

            {step === 2 && (
              <Motion.div
                key="s2"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={transition}
                style={{ display: "flex", flexDirection: "column", gap: 22 }}
              >
                <ContextBlock title="Symptoms">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {packet.symptoms.map((s, i) => (
                      <li key={i} style={{ marginBottom: 8 }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </ContextBlock>
                <ContextBlock title="Reports / tests">
                  <p style={{ margin: 0 }}>{packet.reportsTests}</p>
                </ContextBlock>

                <div style={{ marginTop: -6 }}>
                  <button
                    type="button"
                    onClick={() => setReportsModalOpen(true)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      border: "1px solid rgba(148,163,184,0.35)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(203,213,225,0.88)",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                  >
                    View original reports (anonymized)
                  </button>
                </div>

                <h2
                  style={{
                    margin: "8px 0 0",
                    fontSize: "clamp(1.25rem, 3.2vw, 1.5rem)",
                    fontWeight: 750,
                    color: "#f9fafb",
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Is the available evidence sufficient to understand this case?
                </h2>

                <OptionCards
                  options={EVIDENCE_OPTIONS}
                  selected={evidenceChoice}
                  onSelect={setEvidenceChoice}
                />

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(226,232,240,0.9)",
                      marginBottom: 10,
                    }}
                    htmlFor="jury-evidence-reason"
                  >
                    Explain your reasoning
                  </label>
                  <textarea
                    id="jury-evidence-reason"
                    value={evidenceReason}
                    onChange={(e) => setEvidenceReason(e.target.value)}
                    rows={4}
                    placeholder="What did you weigh, and why?"
                    style={{
                      width: "100%",
                      resize: "vertical",
                      minHeight: 108,
                      padding: "14px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(15,23,42,0.55)",
                      color: "#f1f5f9",
                      fontSize: 15,
                      lineHeight: 1.55,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "rgba(148,163,184,0.88)",
                    }}
                  >
                    This helps ensure decisions are based on reliable information.
                  </p>
                </div>
              </Motion.div>
            )}

            {step === 3 && (
              <Motion.div
                key="s3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={transition}
                style={{ display: "flex", flexDirection: "column", gap: 22 }}
              >
                <ContextBlock title="Treatment requested">
                  <p style={{ margin: 0 }}>{packet.treatmentRequested}</p>
                </ContextBlock>
                <ContextBlock title="Doctor’s note">
                  <p style={{ margin: 0 }}>{packet.doctorNote}</p>
                </ContextBlock>

                <h2
                  style={{
                    margin: "8px 0 0",
                    fontSize: "clamp(1.25rem, 3.2vw, 1.5rem)",
                    fontWeight: 750,
                    color: "#f9fafb",
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Is the proposed treatment appropriate for this condition?
                </h2>

                <OptionCards
                  options={TREATMENT_OPTIONS}
                  selected={treatmentChoice}
                  onSelect={setTreatmentChoice}
                />

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(226,232,240,0.9)",
                      marginBottom: 10,
                    }}
                    htmlFor="jury-treatment-reason"
                  >
                    Explain your assessment
                  </label>
                  <textarea
                    id="jury-treatment-reason"
                    value={treatmentReason}
                    onChange={(e) => setTreatmentReason(e.target.value)}
                    rows={4}
                    placeholder="Connect what you read to what you conclude."
                    style={{
                      width: "100%",
                      resize: "vertical",
                      minHeight: 108,
                      padding: "14px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(15,23,42,0.55)",
                      color: "#f1f5f9",
                      fontSize: 15,
                      lineHeight: 1.55,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "rgba(148,163,184,0.88)",
                    }}
                  >
                    This helps validate whether the requested care aligns with
                    medical expectations.
                  </p>
                </div>
              </Motion.div>
            )}

            {step === 4 && (
              <Motion.div
                key="s4"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={transition}
                style={{ display: "flex", flexDirection: "column", gap: 22 }}
              >
                <ContextBlock title="Cost">
                  <p style={{ margin: 0, fontWeight: 700, color: "#f9fafb" }}>
                    {packet.cost}
                  </p>
                </ContextBlock>
                <ContextBlock title="Expected range">
                  <p style={{ margin: 0 }}>{packet.expectedRange}</p>
                </ContextBlock>

                <h2
                  style={{
                    margin: "8px 0 0",
                    fontSize: "clamp(1.25rem, 3.2vw, 1.5rem)",
                    fontWeight: 750,
                    color: "#f9fafb",
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Does the cost seem reasonable for this treatment?
                </h2>

                <OptionCards
                  options={COST_OPTIONS}
                  selected={costChoice}
                  onSelect={setCostChoice}
                />

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(226,232,240,0.9)",
                      marginBottom: 10,
                    }}
                    htmlFor="jury-cost-reason"
                  >
                    What influenced your judgment?
                  </label>
                  <textarea
                    id="jury-cost-reason"
                    value={costReason}
                    onChange={(e) => setCostReason(e.target.value)}
                    rows={4}
                    placeholder="Range, comparables, urgency—whatever shaped your view."
                    style={{
                      width: "100%",
                      resize: "vertical",
                      minHeight: 108,
                      padding: "14px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(15,23,42,0.55)",
                      color: "#f1f5f9",
                      fontSize: 15,
                      lineHeight: 1.55,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "rgba(148,163,184,0.88)",
                    }}
                  >
                    This ensures fair use of shared resources.
                  </p>
                </div>
              </Motion.div>
            )}

            {step === 5 && (
              <Motion.div
                key="s5"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={transition}
                style={{ display: "flex", flexDirection: "column", gap: 22 }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(181,236,52,0.55)",
                  }}
                >
                  Before you decide
                </p>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.2rem, 3vw, 1.45rem)",
                    fontWeight: 750,
                    color: "#e2e8f0",
                    lineHeight: 1.4,
                  }}
                >
                  Here is how you have reasoned so far. If it still reflects your
                  view, choose your position for the pool.
                </h2>

                <div style={{ ...glassPanel, padding: "18px 20px" }}>
                  <SummaryRow
                    label="Evidence"
                    value={labelFrom(EVIDENCE_OPTIONS, evidenceChoice)}
                  />
                  <SummaryRow
                    label="Treatment"
                    value={labelFrom(TREATMENT_OPTIONS, treatmentChoice)}
                  />
                  <SummaryRow
                    label="Cost"
                    value={labelFrom(COST_OPTIONS, costChoice)}
                  />
                </div>

                <h2
                  style={{
                    margin: "8px 0 0",
                    fontSize: "clamp(1.25rem, 3.2vw, 1.5rem)",
                    fontWeight: 750,
                    color: "#f9fafb",
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Based on your evaluation, what is your position?
                </h2>

                <OptionCards
                  options={FINAL_OPTIONS}
                  selected={finalChoice}
                  onSelect={setFinalChoice}
                />
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {step > 1 ? (
        <footer
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: "16px 24px 24px",
            background:
              "linear-gradient(to top, rgba(2,3,10,0.98) 60%, transparent)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          {step === 2 ? (
            <p
              style={{
                margin: 0,
                marginBottom: 2,
                fontSize: 14,
                lineHeight: 1.45,
                textAlign: "right",
                color: "rgba(148,163,184,0.52)",
                letterSpacing: "0.02em",
              }}
            >
              You&apos;ll evaluate treatment suitability in the next step.
            </p>
          ) : null}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={savingEvidenceStep}
              style={{
                padding: "14px 20px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: savingEvidenceStep ? "not-allowed" : "pointer",
                opacity: savingEvidenceStep ? 0.45 : 1,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "transparent",
                color: "rgba(203,213,225,0.92)",
              }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={cannotProgressFooter}
              aria-busy={evidenceSaving || undefined}
              onClick={onFooterPrimary}
              style={{
                padding: "13px 26px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: cannotProgressFooter
                  ? "not-allowed"
                  : evidenceSaving
                    ? "wait"
                    : "pointer",
                border: `1px solid ${
                  cannotProgressFooter
                    ? "rgba(148,163,184,0.25)"
                    : "rgba(181,236,52,0.55)"
                }`,
                background: cannotProgressFooter
                  ? "rgba(30,41,59,0.5)"
                  : ACCENT,
                color: cannotProgressFooter
                  ? "rgba(148,163,184,0.5)"
                  : "#020617",
                boxShadow: cannotProgressFooter
                  ? "none"
                  : evidenceSaving
                    ? "0 0 36px rgba(181,236,52,0.35)"
                    : evidenceCtaReady
                      ? "0 0 32px rgba(181,236,52,0.32), 0 0 12px rgba(181,236,52,0.18)"
                      : "0 0 28px rgba(181,236,52,0.2)",
                marginLeft: "auto",
                transition:
                  "box-shadow 0.35s ease, border-color 0.25s ease, opacity 0.25s ease",
                opacity:
                  cannotProgressFooter ? 1 : evidenceSaving ? 0.94 : 1,
              }}
            >
              {primaryFooterLabel}
            </button>
          </div>
        </footer>
      ) : null}

      <AnimatePresence>
        {reportsModalOpen ? (
          <AnonymizedReportsSidePanel
            key="reports-panel"
            onClose={closeReportsModal}
            caseFileRef={packet.anonymizedReport?.caseFileRef}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const ANONYMIZED_PDF_PATH = "reports/manipalhospitals.pdf";

function anonymizedPdfUrl() {
  const base = import.meta.env.BASE_URL || "/";
  const path = base.endsWith("/") ? base : `${base}/`;
  return `${path}${ANONYMIZED_PDF_PATH}`;
}

function AnonymizedReportsSidePanel({ onClose, caseFileRef }) {
  const pdfSrc = anonymizedPdfUrl();

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(2,3,10,0.72)",
          backdropFilter: "blur(8px)",
        }}
      />
      <Motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="anonymized-report-title"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(560px, 96vw)",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.99) 100%)",
          boxShadow: "-16px 0 48px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              id="anonymized-report-title"
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.95)",
              }}
            >
              Anonymized report view
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                lineHeight: 1.45,
                color: "rgba(148,163,184,0.85)",
              }}
            >
              Personally identifiable information has been removed.
            </p>
            {caseFileRef ? (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: "rgba(148,163,184,0.65)",
                }}
              >
                Case file reference:{" "}
                <span style={{ color: "rgba(226,232,240,0.88)" }}>
                  {caseFileRef}
                </span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(226,232,240,0.85)",
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <iframe
            title="Anonymized hospital report (PDF)"
            src={pdfSrc}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>

        <p
          style={{
            flexShrink: 0,
            margin: 0,
            padding: "10px 16px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            fontStyle: "italic",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(148,163,184,0.48)",
          }}
        >
          This summary is generated from the reports shown here.
        </p>
      </Motion.div>
    </Motion.div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.8)",
        }}
      >
        {label}
      </span>
      <span
        style={{ fontSize: 16, fontWeight: 650, color: "#f9fafb" }}
      >
        {value}
      </span>
    </div>
  );
}
