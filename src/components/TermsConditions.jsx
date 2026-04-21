import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACCENT, Label } from "./OnboardingCommon.jsx";

const CONSENT_ITEMS = [
  {
    key: "emergencyTreatment",
    title: "Emergency Treatment Consent",
    body:
      "I authorize Cipher Protocol to share my anonymized medical profile with verified healthcare providers in case of a medical emergency. No personal identity will be disclosed.",
  },
  {
    key: "peerJury",
    title: "Peer Jury Evaluation",
    body:
      "I accept that complex claims will be evaluated by an anonymous panel of verified medical professionals. Their decision is based on medical evidence only.",
  },
  {
    key: "poolParticipation",
    title: "Shared Pool Participation",
    body:
      "I agree to contribute to the shared pool monthly. I understand contributions fund other members' approved claims and my claims are funded collectively.",
  },
  {
    key: "dataAnonymization",
    title: "Anonymized Data Usage",
    body:
      "I consent to my anonymized health data being used to improve protocol decisions. No personally identifiable information is ever stored or shared.",
  },
];

export function TermsConditions({ onBack, onContinue }) {
  const [consents, setConsents] = useState({
    emergencyTreatment: false,
    peerJury: false,
    poolParticipation: false,
    dataAnonymization: false,
  });
  const [signatureBase64, setSignatureBase64] = useState("");
  const [signatureHash, setSignatureHash] = useState("");
  const [signedAt, setSignedAt] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef(null);
  const padWrapRef = useRef(null);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const allConsentsAccepted = useMemo(
    () => Object.values(consents).every(Boolean),
    [consents],
  );

  const hasSignature = Boolean(signatureBase64);
  const canContinue = allConsentsAccepted && hasSignature;

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = padWrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(160 * dpr);
    canvas.style.width = `${Math.floor(rect.width)}px`;
    canvas.style.height = "160px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = ACCENT;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  const getPoint = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event.changedTouches?.[0] || event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  }, []);

  const buildSignatureHash = useCallback(async (base64, ts) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(base64).slice(0, 100) + String(ts));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex.slice(0, 16);
  }, []);

  const finalizeSignature = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasInk = pixels.data.some((val, i) => i % 4 === 3 && val > 0);
    if (!hasInk) {
      setSignatureBase64("");
      setSignatureHash("");
      setSignedAt(null);
      return;
    }
    const base64 = canvas.toDataURL("image/png");
    const ts = Date.now();
    const hash = await buildSignatureHash(base64, ts);
    setSignatureBase64(base64);
    setSignatureHash(hash);
    setSignedAt(ts);
  }, [buildSignatureHash]);

  const startDraw = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);
    lastPointRef.current = point;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setIsDrawing(true);
  }, [getPoint]);

  const moveDraw = useCallback((event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }, [getPoint, isDrawing]);

  const endDraw = useCallback(async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    await finalizeSignature();
  }, [finalizeSignature, isDrawing]);

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureBase64("");
    setSignatureHash("");
    setSignedAt(null);
  }

  useEffect(() => {
    if (!canContinue) return;
    window.localStorage.setItem(
      "protocolConsent",
      JSON.stringify({
        emergencyTreatment: true,
        peerJury: true,
        poolParticipation: true,
        dataAnonymization: true,
        signedAt: signedAt ?? Date.now(),
        signatureBase64,
        signatureHash,
      }),
    );
  }, [canContinue, signatureBase64, signatureHash, signedAt]);

  function toggleConsent(key) {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function acceptAll() {
    setConsents({
      emergencyTreatment: true,
      peerJury: true,
      poolParticipation: true,
      dataAnonymization: true,
    });
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#060810",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), radial-gradient(ellipse at bottom left, rgba(180, 200, 20, 0.12) 0%, #060810 65%)",
        backgroundSize: "60px 60px, 60px 60px, 100% 100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
      }}
    >
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
        }}
      >
        {/* header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(181,236,52,0.45)",
                marginBottom: 10,
              }}
            >
              Onboarding — Terms
            </p>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 3.4vw, 2.5rem)",
                fontWeight: 800,
                color: "#f1f5f9",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              Terms & Conditions
            </h1>
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
            onMouseEnter={(e) => (e.target.style.color = ACCENT)}
            onMouseLeave={(e) => (e.target.style.color = "rgba(181,236,52,0.5)")}
          >
            ← Back
          </button>
        </div>

        {/* terms text area (read-only style) */}
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <Label>Protocol Terms (summary)</Label>
          <div
            style={{
              padding: "14px 16px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
              }}
            >
              <li>
                This interface is a design prototype. No data is sent to a backend or chain.
              </li>
              <li>
                All identity and health information is stored locally in your browser storage.
              </li>
              <li>
                Any risk scores, health states, or pool simulations shown are illustrative only and
                must not be treated as medical or financial advice.
              </li>
              <li>
                In a real deployment, full protocol terms would be governed by smart contracts and
                community-approved policies.
              </li>
            </ul>
          </div>
        </div>

        <div style={{ marginBottom: 18, display: "flex", justifyContent: "flex-start" }}>
          <button
            type="button"
            onClick={acceptAll}
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(226,232,240,0.8)",
              fontSize: 11,
              padding: "8px 16px",
              borderRadius: 999,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Accept all
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
          {CONSENT_ITEMS.map((item) => {
            const checked = Boolean(consents[item.key]);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleConsent(item.key)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 12,
                  border: checked
                    ? "1px solid rgba(181,236,52,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: checked
                    ? "rgba(181,236,52,0.04)"
                    : "rgba(255,255,255,0.02)",
                  padding: "16px 18px",
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  cursor: "pointer",
                  color: "inherit",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                    {item.title}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "rgba(148,163,184,0.9)",
                      lineHeight: 1.55,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    border: checked
                      ? "2px solid #b5ec34"
                      : "2px solid rgba(255,255,255,0.2)",
                    background: checked ? "#b5ec34" : "transparent",
                    color: checked ? "#020617" : "transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        {/* footer actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 18,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: "100%", marginBottom: 2 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(148,163,184,0.7)",
              }}
            >
              Digital Signature
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(148,163,184,0.86)", lineHeight: 1.55 }}>
              Sign below using your mouse or finger to digitally authorize this protocol agreement.
            </p>
            <div
              ref={padWrapRef}
              style={{
                marginTop: 12,
                width: "100%",
                maxWidth: 640,
                height: 160,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.03)",
                outline: "none",
                position: "relative",
                overflow: "hidden",
                cursor: "crosshair",
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startDraw(e);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  moveDraw(e);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  endDraw();
                }}
                style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
              />
              {!hasSignature && !isDrawing ? (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    color: "rgba(148,163,184,0.55)",
                    pointerEvents: "none",
                    letterSpacing: "0.04em",
                  }}
                >
                  Sign here
                </span>
              ) : null}
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={clearSignature}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "rgba(226,232,240,0.8)",
                  fontSize: 11,
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Clear
              </button>
              <span style={{ fontSize: 12, color: hasSignature ? ACCENT : "rgba(148,163,184,0.8)" }}>
                {hasSignature ? "Signature recorded" : "Please sign above"}
              </span>
            </div>
            {hasSignature && signedAt ? (
              <>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(148,163,184,0.7)" }}>
                  Signed: {new Date(signedAt).toLocaleString()}
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 10,
                    color: "rgba(148,163,184,0.55)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  Signature hash: {signatureHash || "Pending..."}
                </p>
              </>
            ) : null}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
              margin: 0,
            }}
          >
            I understand that this is a prototype and accept these terms.
          </p>
          {canContinue ? (
            <p
              style={{
                margin: 0,
                width: "100%",
                fontSize: 12,
                fontWeight: 700,
                color: ACCENT,
                letterSpacing: "0.04em",
              }}
            >
              ✓ All protocol consents accepted. Your digital signature has been applied.
            </p>
          ) : null}
          <button
            onClick={onContinue}
            disabled={!canContinue}
            style={{
              padding: "14px 32px",
              borderRadius: 6,
              border: "none",
              background: canContinue ? ACCENT : "rgba(181,236,52,0.15)",
              color: canContinue ? "#050505" : "rgba(181,236,52,0.3)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: canContinue ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            View Pricing Plans
          </button>
        </div>
      </div>
    </div>
  );
}

