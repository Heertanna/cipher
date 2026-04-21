import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaintBackground, ACCENT } from "./OnboardingCommon.jsx";
import { generateAdmissionPacket } from "../lib/generateAdmissionPacket.js";

function fmtTime(ts) {
  if (!ts) return "Not available";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "Not available";
  }
}

export function HospitalView() {
  const navigate = useNavigate();
  const location = useLocation();
  const packet = location.state?.packet;
  const referenceCode = location.state?.referenceCode || (packet?.ref ? `#${packet.ref}` : "#EM-0000");
  const hasAlerts =
    packet?.allergies &&
    String(packet.allergies).trim() &&
    String(packet.allergies).toLowerCase() !== "not recorded";

  if (!packet) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          position: "relative",
        }}
      >
        <FaintBackground />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 620,
            borderRadius: 16,
            border: "1px solid rgba(248,113,113,0.35)",
            background: "rgba(30,41,59,0.75)",
            padding: 24,
          }}
        >
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>Invalid or expired emergency packet.</p>
          <button
            type="button"
            onClick={() => {
              navigate("/emergency-access");
              window.scrollTo(0, 0);
            }}
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              background: "transparent",
              color: "#e2e8f0",
              cursor: "pointer",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: 11,
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        padding: "72px 24px 48px",
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <FaintBackground />
      <main style={{ width: "100%", maxWidth: 960, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
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
              CIPHER PROTOCOL — HOSPITAL VERIFICATION PORTAL
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "rgba(148,163,184,0.9)" }}>
              Patient identity is protected. Medical data only.
            </p>
          </div>
          <span
            style={{
              padding: "6px 11px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.45)",
              color: "rgba(226,232,240,0.92)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Hospital view
          </span>
        </div>

        <div
          style={{
            marginTop: 22,
            background: "rgba(181,236,52,0.1)",
            border: `1px solid ${ACCENT}`,
            padding: 16,
            borderRadius: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "rgba(190,242,100,0.95)" }}>
            ✓ VERIFIED POOL MEMBER — TREATMENT PRE-AUTHORIZED
          </p>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <section style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.75)", padding: 16 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(148,163,184,0.75)", fontWeight: 800 }}>Vitals</p>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#f8fafc" }}>Blood Type: <strong>{packet.bloodType || "Not recorded"}</strong></p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#f8fafc" }}>Age Range: <strong>{packet.ageRange || "Not recorded"}</strong></p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#f8fafc" }}>Gender: <strong>{packet.gender || "Not recorded"}</strong></p>
          </section>

          <section style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.75)", padding: 16 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(148,163,184,0.75)", fontWeight: 800 }}>Alerts</p>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: hasAlerts ? "#f87171" : "#f8fafc" }}>
              Allergies: <strong>{packet.allergies || "Not recorded"}</strong>
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#f8fafc" }}>
              Known Conditions: <strong>{packet.conditions || "Not recorded"}</strong>
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#f8fafc" }}>
              Current Medications: <strong>{packet.medications || "Not recorded"}</strong>
            </p>
          </section>

          <section style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.75)", padding: 16 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(148,163,184,0.75)", fontWeight: 800 }}>Coverage</p>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#bbf7d0" }}>Status: <strong>✓ ACTIVE</strong></p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#f8fafc" }}>Pre-authorized: <strong>₹25,000</strong></p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#f8fafc" }}>Emergency Ref: <strong>{referenceCode}</strong></p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#f8fafc" }}>Valid until: <strong>{fmtTime(packet.validUntil)}</strong></p>
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(148,163,184,0.9)" }}>Note: Final claim evaluation after treatment</p>
            <button
              type="button"
              onClick={() => {
                const consent = JSON.parse(localStorage.getItem("protocolConsent") || "{}");
                const doc = generateAdmissionPacket({
                  healthProfile: packet?.healthProfile || {},
                  emergencyRef: packet?.ref || "EM-0000",
                  preAuthorized: packet?.preAuthorized || 25000,
                  timestamp: packet?.timestamp || Date.now(),
                  consent,
                });
                doc.save(`cipher-emergency-${packet?.ref || "packet"}.pdf`);
              }}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "14px 22px",
                borderRadius: 999,
                border: "1px solid rgba(181,236,52,0.45)",
                background: "#b5ec34",
                color: "#020617",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Download admission packet (PDF)
            </button>
          </section>

          <section style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.75)", padding: 16 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(148,163,184,0.75)", fontWeight: 800 }}>Important notices</p>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>
              • This patient's identity is anonymized by protocol
              <br />
              • Bill directly to Cipher Protocol using reference {referenceCode}
              <br />
              • Claims above ₹25,000 require post-treatment evaluation
            </p>
          </section>
        </div>

        <p style={{ margin: "22px 0 0", fontSize: 12, color: "rgba(148,163,184,0.88)" }}>
          This verification is cryptographically signed by Cipher Protocol. Contact: protocol@cipher.health for billing queries.
        </p>
      </main>
    </div>
  );
}
