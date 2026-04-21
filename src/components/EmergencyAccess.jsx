import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { FaintBackground, Label, TextArea, ACCENT } from "./OnboardingCommon.jsx";
import { getSession } from "../lib/session.js";

const EMERGENCY_KEY = "cipher_emergency_demo";
const STORAGE_EVENT_TTL_MS = 1000 * 60 * 60 * 48; // 48h

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
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

function fileMeta(files) {
  const list = Array.from(files || []);
  return list.map((f) => ({
    name: f.name,
    size: f.size,
    type: f.type,
  }));
}

export function EmergencyAccess({ onBack, onDone }) {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [evidenceMeta, setEvidenceMeta] = useState([]);

  const [stage, setStage] = useState("form"); // form | activating | qr
  const [activationStep, setActivationStep] = useState(0);
  const [referenceCode, setReferenceCode] = useState("");
  const [qrPayload, setQrPayload] = useState(null);
  const [qrUrl, setQrUrl] = useState("");

  const ACTIVATION_STEPS = useMemo(
    () => [
      "Retrieving your health profile...",
      "Anonymizing patient data...",
      "Pre-authorizing from emergency reserve...",
      "Generating secure hospital packet...",
      "Emergency Protocol Activated",
    ],
    [],
  );

  const isReady = useMemo(
    () => description.trim().length > 3 && hospitalName.trim().length > 2,
    [description, hospitalName]
  );

  const submit = useCallback(() => {
    const now = Date.now();
    const refNum = Math.floor(1000 + Math.random() * 9000);
    const emRef = `EM-${refNum}`;
    const hp = safeParse(window.localStorage.getItem("healthProfile")) ?? {};
    const { anonymousId } = getSession();
    const packet = {
      ref: emRef,
      bloodType: hp?.bloodType || "Not recorded",
      allergies: hp?.allergies || "Not recorded",
      conditions: hp?.conditions || "Not recorded",
      ageRange: hp?.ageRange || "Not recorded",
      gender: hp?.gender || "Not recorded",
      medications: hp?.medications || "Not recorded",
      healthProfile: hp,
      coverage: "ACTIVE",
      preAuthorized: 25000,
      currency: "INR",
      timestamp: now,
      anonymousId: anonymousId ? String(anonymousId).slice(0, 8) : "unknown",
      validUntil: now + 1000 * 60 * 60 * 4,
      hospitalName: hospitalName || "Not recorded",
    };
    const payload = {
      id: `E-${Math.floor(now / 1000)}`,
      createdAt: now,
      description,
      hospitalName,
      estimatedCost: estimatedCost || null,
      evidenceCount: evidenceMeta.length,
      evidenceMeta,
      reference: `#${emRef}`,
    };

    // Persist so dashboard can show the post-emergency state.
    window.localStorage.setItem(EMERGENCY_KEY, JSON.stringify(payload));
    setReferenceCode(`#${emRef}`);
    setQrPayload(packet);
    setActivationStep(0);
    setStage("activating");
  }, [description, estimatedCost, evidenceMeta, hospitalName]);

  useEffect(() => {
    if (stage !== "activating") return;
    if (activationStep >= ACTIVATION_STEPS.length - 1) {
      const doneTimer = window.setTimeout(() => {
        setStage("qr");
      }, 1500);
      return () => window.clearTimeout(doneTimer);
    }
    const timer = window.setTimeout(() => {
      setActivationStep((s) => s + 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [ACTIVATION_STEPS.length, activationStep, stage]);

  useEffect(() => {
    if (stage !== "qr" || !qrPayload) return;
    let cancelled = false;
    (async () => {
      try {
        const url = await QRCode.toDataURL(JSON.stringify({
          ref: qrPayload.ref,
          bloodType: qrPayload.bloodType,
          allergies: qrPayload.allergies,
          conditions: qrPayload.conditions,
          ageRange: qrPayload.ageRange,
          gender: qrPayload.gender,
          coverage: qrPayload.coverage,
          preAuthorized: qrPayload.preAuthorized,
          currency: qrPayload.currency,
          timestamp: qrPayload.timestamp,
          anonymousId: qrPayload.anonymousId,
          healthProfile: qrPayload.healthProfile || {},
        }), {
          width: 200,
          margin: 1,
          color: {
            dark: "#0b1220",
            light: "#ffffff",
          },
        });
        if (!cancelled) setQrUrl(url);
      } catch {
        if (!cancelled) setQrUrl("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrPayload, stage]);

  if (stage === "activating") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
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
            maxWidth: 760,
            position: "relative",
            zIndex: 1,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "36px 34px",
            boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(250,204,21,0.88)",
            }}
          >
            Emergency activation
          </p>
          <h1
            style={{
              margin: "14px 0 22px",
              fontSize: "clamp(1.65rem, 3vw, 2.2rem)",
              fontWeight: 900,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
            }}
          >
            Preparing secure emergency packet
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ACTIVATION_STEPS.map((step, idx) => {
              const isComplete = idx < activationStep;
              const isCurrent = idx === activationStep;
              const isFinal = idx === ACTIVATION_STEPS.length - 1;
              return (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: isComplete || isCurrent ? "rgba(241,245,249,0.96)" : "rgba(100,116,139,0.85)",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      border: `1px solid ${isFinal && isComplete ? ACCENT : "rgba(148,163,184,0.4)"}`,
                      background: isFinal && isComplete ? "rgba(181,236,52,0.14)" : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isFinal && isComplete ? (
                      <span style={{ color: ACCENT, fontSize: 13, fontWeight: 900 }}>✓</span>
                    ) : isCurrent ? (
                      <span className="em-spinner" />
                    ) : null}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: 1.45, color: isFinal && isComplete ? ACCENT : undefined }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <style>{`
            .em-spinner {
              width: 12px;
              height: 12px;
              border-radius: 999px;
              border: 2px solid rgba(148,163,184,0.3);
              border-top-color: ${ACCENT};
              animation: em-spin 0.8s linear infinite;
            }
            @keyframes em-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (stage === "qr") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "72px 24px 48px",
          position: "relative",
        }}
      >
        <FaintBackground />

        <div
          style={{
            width: "100%",
            maxWidth: 760,
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(250,204,21,0.4)",
              background: "rgba(250,204,21,0.12)",
              color: "rgba(250,204,21,0.98)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Emergency protocol active
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
            Emergency reference {referenceCode || "#EM-0000"}
          </p>

          <div
            style={{
              marginTop: 26,
              display: "inline-flex",
              padding: 16,
              borderRadius: 12,
              background: "#ffffff",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {qrUrl ? (
              <img src={qrUrl} width={200} height={200} alt="Emergency QR code" />
            ) : (
              <div style={{ width: 200, height: 200, display: "grid", placeItems: "center", color: "#0b1220" }}>
                Generating...
              </div>
            )}
          </div>

          <p
            style={{
              margin: "26px 0 0",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.7)",
            }}
          >
            PRE-AUTHORIZED AMOUNT
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 900, color: ACCENT }}>
            ₹25,000
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(148,163,184,0.8)" }}>
            From emergency reserve. Final coverage after evaluation.
          </p>

          <div
            style={{
              marginTop: 24,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(15,23,42,0.75)",
              padding: "16px 18px",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
              textAlign: "left",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.72)" }}>
                Blood Type
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: "#f8fafc", fontWeight: 700 }}>
                {qrPayload?.bloodType || "Not recorded"}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.72)" }}>
                Coverage
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: "#bbf7d0", fontWeight: 700 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: "#22c55e", marginRight: 8 }} />
                ACTIVE
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.72)" }}>
                Valid for
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: "#f8fafc", fontWeight: 700 }}>4 hours</p>
            </div>
          </div>

          <p style={{ margin: "20px 0 0", fontSize: 13, color: "rgba(148,163,184,0.8)", lineHeight: 1.7 }}>
            Show this screen to hospital staff. They scan the QR code to receive your anonymized medical profile and
            coverage verification instantly. No personal identity is exposed.
          </p>

          <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                navigate("/hospital-view", { state: { packet: qrPayload, qrUrl, referenceCode } });
                window.scrollTo(0, 0);
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                border: "1px solid rgba(181,236,52,0.5)",
                background: "rgba(181,236,52,0.12)",
                color: ACCENT,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              View hospital portal
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof onDone === "function") onDone();
                else {
                  navigate("/protocol-dashboard");
                  window.scrollTo(0, 0);
                }
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.55)",
                background: "rgba(15,23,42,0.55)",
                color: "rgba(226,232,240,0.96)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
            gap: 16,
          }}
        >
          <div />
          <button
            type="button"
            onClick={() => {
              if (typeof onBack === "function") onBack();
              else {
                navigate("/protocol-dashboard");
                window.scrollTo(0, 0);
              }
            }}
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
              margin: 0,
              fontSize: "clamp(1.8rem, 3.6vw, 2.4rem)",
              fontWeight: 950,
              color: "#f1f5f9",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
            }}
          >
            Emergency Access
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 650,
            }}
          >
            Proceed with treatment immediately. This case will be evaluated after care is completed.
          </p>
        </div>

        {/* warning */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(250,204,21,0.28)",
            background: "rgba(250,204,21,0.10)",
            padding: 16,
            marginBottom: 18,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(250,204,21,0.95)",
              fontWeight: 850,
              lineHeight: 1.5,
            }}
          >
            Emergency access allows immediate treatment without prior approval. Final coverage will be determined after evaluation.
          </p>
        </div>

        {/* minimal form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div>
            <Label>Description</Label>
            <TextArea
              value={description}
              onChange={(v) => setDescription(v)}
              placeholder="Briefly describe what’s happening and what’s needed immediately"
              rows={3}
            />
          </div>

          <div>
            <Label>Hospital name</Label>
            <Input
              value={hospitalName}
              onChange={setHospitalName}
              placeholder="e.g. St. Mary’s Hospital"
            />
          </div>

          <div>
            <Label>Estimated cost (optional)</Label>
            <Input
              value={estimatedCost}
              onChange={setEstimatedCost}
              placeholder="e.g. INR 50000 (optional)"
            />
          </div>

          <div>
            <Label>Upload evidence (optional)</Label>
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={(e) => setEvidenceMeta(fileMeta(e.target.files))}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "#f1f5f9",
                fontFamily: "inherit",
              }}
            />
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {evidenceMeta?.length ? `${evidenceMeta.length} file(s) attached.` : "No files selected."}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 26,
            paddingTop: 22,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em" }}>
            Emergency flow is fast and minimal. Evaluation happens later.
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={!isReady}
            style={{
              padding: "14px 34px",
              borderRadius: 999,
              border: "1px solid rgba(250,204,21,0.5)",
              background: isReady ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.06)",
              color: isReady ? "rgba(250,204,21,0.95)" : "rgba(250,204,21,0.35)",
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: isReady ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}
          >
            Proceed with Emergency Access
          </button>
        </div>
      </div>
    </div>
  );
}

