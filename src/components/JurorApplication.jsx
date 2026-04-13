import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { FaintBackground, ACCENT } from "./OnboardingCommon.jsx";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";

const BG = "#02030a";
const transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

const CREDENTIAL_TYPES = [
  { title: "Medical Doctors", detail: "MBBS, MD, MS, BDS, BAMS, BHMS" },
  { title: "Pharmacists", detail: "B.Pharm, M.Pharm" },
  { title: "Nurses", detail: "BSN, GNM, ANM" },
  { title: "Allied Health", detail: "Physiotherapy, MPH, Occupational Therapy" },
];

const Q1_OPTS = [
  { key: "yes", label: "Yes" },
  { key: "maybe", label: "Maybe" },
  { key: "no", label: "No" },
];
const Q2_OPTS = [
  { key: "appropriate", label: "Appropriate" },
  { key: "uncertain", label: "Uncertain" },
  { key: "notAppropriate", label: "Not appropriate" },
];
const Q3_OPTS = [
  { key: "reasonable", label: "Reasonable" },
  { key: "slightlyHigh", label: "Slightly high" },
  { key: "unclear", label: "Unclear" },
];

const VERIFY_SPIN = [
  "Extracting document details…",
  "Cross-referencing credential database…",
  "Validating registration number…",
  "Checking institutional records…",
];

function OptionCards({ options, selected, onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                ? "1px solid rgba(181,236,52,0.65)"
                : "1px solid rgba(255,255,255,0.1)",
              background: active ? "rgba(181,236,52,0.1)" : "rgba(255,255,255,0.03)",
              color: "#f1f5f9",
              fontSize: 16,
              fontWeight: 650,
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
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(14px)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.85)",
        }}
      >
        {title}
      </p>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(226,232,240,0.94)" }}>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.65)",
  color: "#f1f5f9",
  fontSize: 15,
  outline: "none",
};

export function JurorApplication() {
  const navigate = useNavigate();
  const [mainStep, setMainStep] = useState(1);
  const [credentialName, setCredentialName] = useState("");
  const [institution, setInstitution] = useState("");
  const [year, setYear] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [docLabel, setDocLabel] = useState("");

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyIdx, setVerifyIdx] = useState(0);

  const [evidence, setEvidence] = useState(null);
  const [treatment, setTreatment] = useState(null);
  const [cost, setCost] = useState(null);
  const [applyError, setApplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!verifyOpen || verifyIdx < 1) return;
    if (verifyIdx >= 5) {
      const t = setTimeout(() => {
        setVerifyOpen(false);
        setVerifyIdx(0);
        setMainStep(4);
      }, 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVerifyIdx((i) => i + 1), 1200);
    return () => clearTimeout(t);
  }, [verifyOpen, verifyIdx]);

  function startVerification() {
    if (!credentialName.trim() || !institution.trim() || !registrationNumber.trim()) {
      setApplyError("Please complete all required fields.");
      return;
    }
    const y = Number(year);
    if (!Number.isFinite(y) || y < 1950 || y > new Date().getFullYear() + 1) {
      setApplyError("Enter a valid year of completion.");
      return;
    }
    setApplyError("");
    setVerifyIdx(1);
    setVerifyOpen(true);
  }

  async function submitTrial() {
    setApplyError("");
    const { anonymousId } = getSession();
    if (!anonymousId) {
      setApplyError("No active session. Create your identity in Join Network first.");
      return;
    }
    if (!evidence || !treatment || !cost) {
      setApplyError("Answer all three questions to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/juror/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: anonymousId,
          credential_name: credentialName.trim(),
          institution: institution.trim(),
          year: Number(year),
          registration_number: registrationNumber.trim(),
          trial_answers: { evidence, treatment, cost },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Application failed");
      window.localStorage.setItem("cipher_is_juror", "true");
      setReference(String(data.reference || ""));
      setMainStep(5);
    } catch (e) {
      setApplyError(e?.message || "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(148,163,184,0.9)",
    marginBottom: 8,
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: BG,
        padding: "56px 22px 48px",
        boxSizing: "border-box",
      }}
    >
      <FaintBackground />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto" }}>
        <AnimatePresence mode="wait">
          {mainStep === 1 && (
            <Motion.div
              key="s1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={transition}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: ACCENT,
                  margin: "0 0 12px",
                }}
              >
                Reviewer onboarding
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(1.35rem, 3.6vw, 1.65rem)",
                  fontWeight: 800,
                  color: "#f9fafb",
                  letterSpacing: "0.06em",
                  lineHeight: 1.25,
                  textTransform: "uppercase",
                }}
              >
                Join the reviewer network
              </h1>
              <p
                style={{
                  margin: "16px 0 28px",
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: "rgba(148,163,184,0.95)",
                }}
              >
                Cipher&apos;s peer jury is reserved for verified medical professionals. Your role is
                purely medical evaluation — the protocol handles all financial decisions automatically.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 12,
                  marginBottom: 28,
                }}
              >
                {CREDENTIAL_TYPES.map((c) => (
                  <div
                    key={c.title}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{c.title}</p>
                    <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.5, color: "rgba(148,163,184,0.9)" }}>
                      {c.detail}
                    </p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setMainStep(2)}
                style={{
                  width: "100%",
                  padding: "16px 22px",
                  borderRadius: 999,
                  border: "1px solid rgba(181,236,52,0.5)",
                  background: ACCENT,
                  color: "#020617",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Apply now
              </button>
            </Motion.div>
          )}

          {mainStep === 2 && (
            <Motion.div
              key="s2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={transition}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "clamp(1.25rem, 3.5vw, 1.5rem)",
                  fontWeight: 800,
                  color: "#f9fafb",
                }}
              >
                Credential details
              </h2>
              <p style={{ margin: "0 0 22px", fontSize: 14, color: "rgba(148,163,184,0.9)" }}>
                All fields are required except document upload (optional for this demo).
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={labelStyle}>Full name of qualification</label>
                  <input
                    value={credentialName}
                    onChange={(e) => setCredentialName(e.target.value)}
                    placeholder='e.g. "MBBS", "MD Cardiology"'
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Institution / University</label>
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Institution name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Year of completion</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2019"
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Registration / License number</label>
                  <input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. MH-2019-48392"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Upload credential document</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setDocLabel(e.target.files?.[0]?.name || "")}
                    style={{ fontSize: 13, color: "rgba(226,232,240,0.85)" }}
                  />
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(148,163,184,0.8)" }}>
                    Upload degree certificate or license{docLabel ? ` — ${docLabel}` : ""}
                  </p>
                </div>
              </div>
              {applyError ? (
                <p style={{ margin: "16px 0 0", color: "#f87171", fontSize: 14 }}>{applyError}</p>
              ) : null}
              <button
                type="button"
                onClick={startVerification}
                style={{
                  marginTop: 26,
                  width: "100%",
                  padding: "16px 22px",
                  borderRadius: 999,
                  border: "1px solid rgba(181,236,52,0.5)",
                  background: ACCENT,
                  color: "#020617",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Submit for verification
              </button>
            </Motion.div>
          )}

          {mainStep === 4 && (
            <Motion.div
              key="s4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={transition}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: ACCENT,
                  margin: 0,
                }}
              >
                Trial evaluation
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.2rem, 3.5vw, 1.5rem)",
                  fontWeight: 800,
                  color: "#f9fafb",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                One last step
              </h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(148,163,184,0.95)" }}>
                Complete a sample case review to confirm you understand the evaluation process. This is how
                every case will look.
              </p>

              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(15,23,42,0.75)",
                  padding: "20px 20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(181,236,52,0.75)",
                  }}
                >
                  Case details
                </p>
                <ContextBlock title="Description">
                  <p style={{ margin: 0 }}>
                    Patient presents with recurring upper respiratory infection. Doctor recommends a standard
                    antibiotic course.
                  </p>
                </ContextBlock>
                <ContextBlock title="Symptoms">
                  <p style={{ margin: 0 }}>Sore throat, mild fever (37.8°C), nasal congestion</p>
                </ContextBlock>
                <ContextBlock title="Recommended treatment">
                  <p style={{ margin: 0 }}>Amoxicillin 500mg, 5-day course</p>
                </ContextBlock>
                <ContextBlock title="Estimated cost">
                  <p style={{ margin: 0, fontWeight: 700, color: "#f9fafb" }}>
                    {"\u20B9"}2,400
                  </p>
                </ContextBlock>
              </div>

              <div>
                <h3
                  style={{
                    margin: "0 0 14px",
                    fontSize: "clamp(1.05rem, 2.8vw, 1.2rem)",
                    fontWeight: 750,
                    color: "#f1f5f9",
                    lineHeight: 1.35,
                  }}
                >
                  Q1: Is the medical evidence sufficient to evaluate this case?
                </h3>
                <OptionCards options={Q1_OPTS} selected={evidence} onSelect={setEvidence} />
              </div>
              <div>
                <h3
                  style={{
                    margin: "0 0 14px",
                    fontSize: "clamp(1.05rem, 2.8vw, 1.2rem)",
                    fontWeight: 750,
                    color: "#f1f5f9",
                    lineHeight: 1.35,
                  }}
                >
                  Q2: Is the proposed treatment appropriate for this condition?
                </h3>
                <OptionCards options={Q2_OPTS} selected={treatment} onSelect={setTreatment} />
              </div>
              <div>
                <h3
                  style={{
                    margin: "0 0 14px",
                    fontSize: "clamp(1.05rem, 2.8vw, 1.2rem)",
                    fontWeight: 750,
                    color: "#f1f5f9",
                    lineHeight: 1.35,
                  }}
                >
                  Q3: Does the cost seem reasonable for this treatment?
                </h3>
                <OptionCards options={Q3_OPTS} selected={cost} onSelect={setCost} />
              </div>

              {applyError ? (
                <p style={{ margin: 0, color: "#f87171", fontSize: 14 }}>{applyError}</p>
              ) : null}
              <button
                type="button"
                disabled={submitting}
                onClick={submitTrial}
                style={{
                  padding: "16px 22px",
                  borderRadius: 999,
                  border: "1px solid rgba(181,236,52,0.5)",
                  background: submitting ? "rgba(181,236,52,0.35)" : ACCENT,
                  color: "#020617",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: submitting ? "wait" : "pointer",
                }}
              >
                Submit evaluation
              </button>
            </Motion.div>
          )}

          {mainStep === 5 && (
            <Motion.div
              key="s5"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: "center", paddingTop: 12 }}
            >
              <Motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 22 }}
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 24px",
                  borderRadius: "50%",
                  background: "rgba(181,236,52,0.15)",
                  border: `2px solid ${ACCENT}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  color: ACCENT,
                }}
              >
                {"\u2713"}
              </Motion.div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.6rem, 4.5vw, 2rem)",
                  fontWeight: 800,
                  color: "#f9fafb",
                  letterSpacing: "-0.03em",
                }}
              >
                You&apos;re in
              </h2>
              <p
                style={{
                  margin: "16px auto 0",
                  maxWidth: 420,
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: "rgba(148,163,184,0.95)",
                }}
              >
                Your credentials are verified and your trial evaluation has been recorded. Welcome to the
                Cipher reviewer network.
              </p>
              <p
                style={{
                  margin: "28px 0 8px",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: ACCENT,
                }}
              >
                REVIEWER ID: #{reference}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
                <button
                  type="button"
                  onClick={() => navigate("/juror-dashboard")}
                  style={{
                    padding: "14px 22px",
                    borderRadius: 999,
                    border: "1px solid rgba(181,236,52,0.5)",
                    background: ACCENT,
                    color: "#020617",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Go to dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/case-review/A392")}
                  style={{
                    padding: "14px 22px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "rgba(226,232,240,0.95)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Learn how reviewing works
                </button>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {verifyOpen ? (
          <Motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(2,3,10,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <Motion.div
              layout
              style={{
                maxWidth: 400,
                width: "100%",
                padding: "36px 32px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(15,23,42,0.95)",
                textAlign: "center",
              }}
            >
              <AnimatePresence mode="wait">
                {verifyIdx >= 1 && verifyIdx <= 4 ? (
                  <Motion.div
                    key={verifyIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      style={{
                        display: "block",
                        width: 40,
                        height: 40,
                        margin: "0 auto 20px",
                        borderRadius: "50%",
                        border: "3px solid rgba(181,236,52,0.2)",
                        borderTopColor: ACCENT,
                        boxSizing: "border-box",
                      }}
                    />
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 650, color: "#e2e8f0", lineHeight: 1.5 }}>
                      {VERIFY_SPIN[verifyIdx - 1]}
                    </p>
                  </Motion.div>
                ) : null}
                {verifyIdx === 5 ? (
                  <Motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <p style={{ margin: "0 0 8px", fontSize: 44, color: ACCENT, fontWeight: 800 }}>
                      {"\u2713"}
                    </p>
                    <p style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#f9fafb" }}>
                      Verification Complete
                    </p>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(148,163,184,0.95)" }}>
                      Your credentials have been successfully verified.
                    </p>
                  </Motion.div>
                ) : null}
              </AnimatePresence>
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
