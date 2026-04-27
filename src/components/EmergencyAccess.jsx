import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { getSession } from "../lib/session.js";
import { PROTOCOL_PAGE_BACKGROUND } from "../lib/protocolPageBackground.js";

const FONT_BODY = '"Sora", system-ui, -apple-system, sans-serif';
/** Align with Claim Intake accent */
const EM_ACCENT = "#b4c814";

const EMERGENCY_KEY = "cipher_emergency_demo";
const STORAGE_EVENT_TTL_MS = 1000 * 60 * 60 * 48; // 48h

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
          ...PROTOCOL_PAGE_BACKGROUND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "46px 20px",
          position: "relative",
          fontFamily: FONT_BODY,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            position: "relative",
            zIndex: 1,
            borderRadius: 24,
            border: "1px solid rgba(180, 200, 20, 0.14)",
            background: "rgba(8,11,18,0.98)",
            padding: "36px 34px",
            boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(180,200,20,0.82)",
            }}
          >
            Emergency activation
          </p>
          <h1
            style={{
              margin: "14px 0 22px",
              fontSize: "clamp(1.65rem, 3vw, 2.2rem)",
              fontWeight: 800,
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
                      border: `1px solid ${isFinal && isComplete ? EM_ACCENT : "rgba(148,163,184,0.4)"}`,
                      background: isFinal && isComplete ? "rgba(180,200,20,0.14)" : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isFinal && isComplete ? (
                      <span style={{ color: EM_ACCENT, fontSize: 14, fontWeight: 900 }}>✓</span>
                    ) : isCurrent ? (
                      <span className="em-spinner" />
                    ) : null}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: 1.45, color: isFinal && isComplete ? EM_ACCENT : undefined }}>
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
              border-top-color: ${EM_ACCENT};
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
          ...PROTOCOL_PAGE_BACKGROUND,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "46px 20px 48px",
          position: "relative",
          fontFamily: FONT_BODY,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            borderRadius: 24,
            border: "1px solid rgba(180, 200, 20, 0.14)",
            background: "rgba(8,11,18,0.98)",
            padding: "32px 28px 36px",
            boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
          }}
        >
          <p
            style={{
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(180,200,20,0.32)",
              background: "rgba(180,200,20,0.08)",
              color: "rgba(180,200,20,0.95)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Emergency protocol active
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "rgba(148,163,184,0.7)" }}>
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
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.7)",
            }}
          >
            PRE-AUTHORIZED AMOUNT
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 900, color: EM_ACCENT }}>
            ₹25,000
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(148,163,184,0.8)" }}>
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
              <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.72)" }}>
                Blood Type
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: "#f8fafc", fontWeight: 700 }}>
                {qrPayload?.bloodType || "Not recorded"}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.72)" }}>
                Coverage
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: "#bbf7d0", fontWeight: 700 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: "#22c55e", marginRight: 8 }} />
                ACTIVE
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.72)" }}>
                Valid for
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: "#f8fafc", fontWeight: 700 }}>4 hours</p>
            </div>
          </div>

          <p style={{ margin: "20px 0 0", fontSize: 14, color: "rgba(148,163,184,0.8)", lineHeight: 1.7 }}>
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
                border: "1px solid rgba(180,200,20,0.45)",
                background: "rgba(180,200,20,0.1)",
                color: EM_ACCENT,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: FONT_BODY,
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
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: FONT_BODY,
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
        ...PROTOCOL_PAGE_BACKGROUND,
        display: "flex",
        justifyContent: "center",
        padding: "24px 20px 20px",
        position: "relative",
        fontFamily: FONT_BODY,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1240,
          position: "relative",
          zIndex: 1,
          animation: "fadeUp 500ms ease both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 32px",
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            background: "rgba(6,8,16,0.74)",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ color: EM_ACCENT, fontSize: 16, fontFamily: "monospace" }}>◉</span>
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.1em", color: "#f8fafc" }}>
                EMERGENCY PROTOCOL ACTIVE
              </span>
              <div
                style={{
                  padding: "3px 12px",
                  border: "1px solid rgba(180,200,20,0.4)",
                  borderRadius: 20,
                  fontSize: 11,
                  color: EM_ACCENT,
                  letterSpacing: "0.03em",
                }}
              >
                Immediate care enabled
              </div>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              No prior approval required. We&apos;ll handle the rest.
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {["◇ SECURE", "◈ ENCRYPTED", "▣ HOSPITAL-READY"].map((item) => (
              <span key={item} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "430px minmax(0, 1fr)",
            gap: 16,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(8,11,18,0.92)",
            padding: 16,
          }}
          className="emergency-redesign-grid"
        >
          <aside
            style={{
              borderRadius: 12,
              padding: "28px 24px 22px",
              border: "1px solid rgba(180,200,20,0.16)",
              background:
                "radial-gradient(circle at 25% 22%, rgba(180,200,20,0.16) 0%, rgba(8,11,18,0.98) 58%), rgba(8,11,18,0.9)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 640,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(180,200,20,0.95)",
                    fontWeight: 700,
                  }}
                >
                  Emergency access
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      style={{
                        width: dot === 0 ? 18 : 8,
                        height: 8,
                        borderRadius: 99,
                        background: dot === 0 ? EM_ACCENT : "rgba(180,200,20,0.25)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 38,
                  lineHeight: 1.05,
                  color: "#f8fafc",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                We&apos;ve received
                <br />
                your <span style={{ color: EM_ACCENT }}>emergency.</span>
              </h2>
              <p style={{ margin: "12px 0 0", color: "rgba(226,232,240,0.7)", fontSize: 14, lineHeight: 1.6 }}>
                Our network is alerted. Help is on the way.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                width: 320,
                height: 320,
                margin: "20px auto",
              }}
            >
              {[60, 100, 140, 180].map((r, i) => (
                <div
                  key={r}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: r * 2,
                    height: r * 2,
                    border: "1px dashed rgba(180,200,20,0.2)",
                    borderRadius: "50%",
                    animation: `circlePulse ${2 + i * 0.5}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}

              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 180,
                  height: 2,
                  transformOrigin: "0% 50%",
                  background: "linear-gradient(90deg, rgba(180,200,20,0.6), transparent)",
                  animation: "radarSweep 4s linear infinite",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "rgba(180,200,20,0.15)",
                  border: "2px solid rgba(180,200,20,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  boxShadow: "0 0 30px rgba(180,200,20,0.3)",
                  animation: "centerPulse 1.5s ease-in-out infinite",
                }}
              >
                ◉
              </div>

              {[
                { top: "15%", left: "70%", label: "NETWORK ALERTED" },
                { top: "45%", left: "5%", label: "RECORDING CASE" },
                { top: "75%", left: "60%", label: "PREPARING CARE" },
                { top: "80%", left: "35%", label: "CONNECTING HOSPITAL" },
              ].map((node, i) => (
                <div key={node.label} style={{ position: "absolute", top: node.top, left: node.left }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ff4444",
                      boxShadow: "0 0 8px rgba(255,68,68,0.8)",
                      animation: "nodePulse 1s ease-in-out infinite",
                      animationDelay: `${i * 0.25}s`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgba(180,200,20,0.7)",
                      letterSpacing: "0.1em",
                      marginTop: 4,
                      whiteSpace: "nowrap",
                      fontFamily: "monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ color: EM_ACCENT, fontSize: 8 }}>●</span>
                    {node.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                border: "1px solid rgba(180,200,20,0.24)",
                background: "rgba(180,200,20,0.09)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "rgba(231,255,160,0.9)",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              ◇ Emergency access allows immediate treatment without prior approval. Final coverage will be determined
              after evaluation.
            </div>
          </aside>

          <section
            style={{
              borderRadius: 12,
              border: "1px solid rgba(180,200,20,0.15)",
              background: "linear-gradient(135deg, rgba(180,200,20,0.07), rgba(8,11,18,0.94))",
              padding: "30px 28px",
              minHeight: 640,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "38px minmax(0,1fr)", gap: 16, flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16 }}>
                {["◎", "▦", "₹", "□"].map((icon, idx) => (
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
                        boxShadow: idx === 0 ? "0 0 18px rgba(180,200,20,0.35)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
                          height: 62,
                          borderLeft: "1px dashed rgba(255,255,255,0.25)",
                          margin: "6px 0",
                        }}
                      />
                    ) : null}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.72)",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    1. WHAT&apos;S HAPPENING?
                  </div>
                  <div style={{ position: "relative" }}>
                    <textarea
                      className="em-journey-field"
                      value={description}
                      maxLength={500}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe what’s happening and what’s needed immediately"
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "14px 14px 28px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontFamily: FONT_BODY,
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box",
                        minHeight: 112,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 10,
                        bottom: 8,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.42)",
                      }}
                    >
                      {description.length}/500
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.72)",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    2. WHERE ARE YOU RECEIVING CARE?
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="em-journey-field"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="e.g. St. Mary's Hospital"
                      style={{
                        width: "100%",
                        padding: "14px 44px 14px 14px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontFamily: FONT_BODY,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>⌖</span>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.72)",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    3. ESTIMATED COST (OPTIONAL)
                  </div>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(255,255,255,0.55)",
                        fontWeight: 700,
                      }}
                    >
                      ₹
                    </span>
                    <input
                      className="em-journey-field"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="50000"
                      style={{
                        width: "100%",
                        padding: "14px 14px 14px 32px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontFamily: FONT_BODY,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.72)",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    4. UPLOAD EVIDENCE (OPTIONAL)
                  </div>
                  <label
                    style={{
                      display: "block",
                      border: "1px dashed rgba(255,255,255,0.22)",
                      borderRadius: 10,
                      padding: "18px 14px",
                      background: "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      onChange={(e) => setEvidenceMeta(fileMeta(e.target.files))}
                      style={{ display: "none" }}
                    />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 8, fontFamily: "monospace", opacity: 0.65 }}>□</div>
                      <button
                        type="button"
                        style={{
                          padding: "8px 14px",
                          border: "1px solid rgba(255,255,255,0.25)",
                          borderRadius: 8,
                          background: "transparent",
                          color: "#f8fafc",
                          fontSize: 11,
                          letterSpacing: "0.1em",
                          fontWeight: 700,
                        }}
                      >
                        CHOOSE FILES
                      </button>
                      <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                        PDF, JPG, PNG up to 10MB
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: "rgba(180,200,20,0.75)" }}>
                        {evidenceMeta.length ? `${evidenceMeta.length} file(s) selected` : "No files selected"}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: "12px 16px",
                background: "rgba(180,200,20,0.06)",
                border: "1px solid rgba(180,200,20,0.15)",
                borderRadius: 10,
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                gap: 8,
              }}
            >
              <span>◉</span>
              <span>You can proceed now. More details can be added later.</span>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                  padding: 16,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "#fff",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: FONT_BODY,
                  cursor: "pointer",
                }}
              >
                ← BACK TO DASHBOARD
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!isReady}
                style={{
                  padding: 16,
                  background: isReady ? EM_ACCENT : "rgba(180,200,20,0.25)",
                  border: "none",
                  borderRadius: 10,
                  color: isReady ? "#000" : "rgba(0,0,0,0.5)",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  fontSize: 14,
                  boxShadow: isReady ? "0 0 30px rgba(180,200,20,0.4)" : "none",
                  animation: isReady ? "btnGlow 2s ease-in-out infinite" : "none",
                  cursor: isReady ? "pointer" : "not-allowed",
                  fontFamily: FONT_BODY,
                  textTransform: "uppercase",
                }}
              >
                START TREATMENT NOW →
              </button>
            </div>
          </section>
        </div>

        <div
          style={{
            marginTop: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            background: "rgba(6,8,16,0.74)",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            color: "rgba(226,232,240,0.56)",
            fontSize: 12,
            letterSpacing: "0.03em",
          }}
        >
          <div>◈ Encrypted end-to-end &nbsp;|&nbsp; ◉ Instant packet &nbsp;|&nbsp; ▣ Hospital-ready</div>
          <div>→→→ &nbsp;● Avg. response time: &lt; 10 sec</div>
        </div>
      </div>

      <style>{`
        .em-journey-field:focus {
          border-color: #b4c814 !important;
          box-shadow: 0 0 0 3px rgba(180,200,20,0.07) !important;
          outline: none !important;
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes circlePulse {
          0%,100% { opacity: 0.25; }
          50% { opacity: 0.5; }
        }
        @keyframes centerPulse {
          0%,100% { box-shadow: 0 0 20px rgba(180,200,20,0.3); }
          50% { box-shadow: 0 0 50px rgba(180,200,20,0.7); }
        }
        @keyframes nodePulse {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; box-shadow: 0 0 15px rgba(255,68,68,1); }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 20px rgba(180,200,20,0.3); }
          50% { box-shadow: 0 0 50px rgba(180,200,20,0.7); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 920px) {
          .emergency-redesign-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

