import React, { useMemo, useState } from "react";
import { ACCENT, FaintBackground, Label } from "./OnboardingCommon.jsx";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function monthDiff(fromMs, toMs) {
  const diffMs = Math.max(0, toMs - fromMs);
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.4375; // average month
  return diffMs / msPerMonth;
}

const PLAN_DETAILS = {
  basic: { label: "Basic", amount: 499, subtitle: "Minimal entry into the protocol" },
  standard: { label: "Standard", amount: 999, subtitle: "Balanced contribution with smoother experience" },
  premium: { label: "Premium", amount: 1799, subtitle: "Higher contribution, maximum stability" },
};

export function PaymentPage({ planId, onBack, onDone }) {
  const plan = PLAN_DETAILS[planId] ?? PLAN_DETAILS.standard;

  const [method, setMethod] = useState("autopay"); // "manual" | "autopay"
  const [autopay, setAutopay] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const subscriptionKey = "cipher_subscription";
  const [nowMs] = useState(() => Date.now());

  const [init] = useState(() => {
    const existing = safeParse(window.localStorage.getItem(subscriptionKey));
    if (!existing || existing.status !== "active") {
      return { status: "form", message: "" };
    }
    const lastPaidAt = existing.lastPaidAt ? Number(existing.lastPaidAt) : null;
    if (!lastPaidAt) return { status: "form", message: "" };

    const monthsMissed = monthDiff(lastPaidAt, nowMs);
    if (monthsMissed > 2) {
      // Persist the "auto removed" state for the demo.
      window.localStorage.setItem(
        subscriptionKey,
        JSON.stringify({
          ...existing,
          status: "removed",
          removedAt: nowMs,
        })
      );
      return {
        status: "removed",
        message: "Your membership was removed after missing payments. Pay again to re-join.",
      };
    }

    return { status: "form", message: "" };
  });

  const [status, setStatus] = useState(init.status); // form | success | removed
  const [message, setMessage] = useState(init.message);

  const formattedAmount = useMemo(() => `₹${plan.amount}`, [plan.amount]);

  const validateAutopay = () => {
    const cardDigits = autopay.cardNumber.replace(/\s+/g, "");
    const expOk = /^\d{2}\/\d{2}$/.test(autopay.expiry.trim());
    const cvcOk = autopay.cvc.trim().length >= 3;
    const numOk = /^\d{12,19}$/.test(cardDigits);
    return expOk && cvcOk && numOk && autopay.name.trim().length >= 2;
  };

  const maskCard = () => {
    const cardDigits = autopay.cardNumber.replace(/\s+/g, "");
    const last4 = cardDigits.slice(-4);
    if (!last4) return "—";
    // Simple brand detection (demo)
    const first = cardDigits[0];
    const brand = first === "4" ? "VISA" : first === "5" ? "MC" : first === "3" ? "AMEX" : "CARD";
    return `${brand} •••• ${last4}`;
  };

  const payNow = (paymentMethod) => {
    const existing = safeParse(window.localStorage.getItem(subscriptionKey));
    const payload = {
      planId,
      planAmount: plan.amount,
      status: "active",
      paymentMethod,
      autopayEnabled: paymentMethod === "autopay",
      createdAt: nowMs,
      lastPaidAt: nowMs,
      removedAt: null,
    };

    if (paymentMethod === "autopay") {
      payload.autopayCard = maskCard();
    }

    window.localStorage.setItem(subscriptionKey, JSON.stringify(existing ? { ...existing, ...payload } : payload));
    window.localStorage.setItem("cipher_joined", "true");

    setStatus("success");
    setMessage("Payment successful. You’re now joined to the network.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#02030a",
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
        }}
      >
        {/* header */}
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
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(181,236,52,0.45)",
                marginBottom: 10,
              }}
            >
              Onboarding — Payment
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
              Join Network
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
              whiteSpace: "nowrap",
            }}
          >
            ← Back
          </button>
        </div>

        {/* summary */}
        <div
          style={{
            marginBottom: 18,
            padding: "18px 18px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontWeight: 800 }}>
            Selected tier
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 900, color: "#f1f5f9", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            {plan.label} — {formattedAmount}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            {plan.subtitle}
          </p>
        </div>

        {status === "success" ? (
          <div
            style={{
              padding: "26px 18px",
              borderRadius: 16,
              border: "1px solid rgba(181,236,52,0.25)",
              background: "rgba(181,236,52,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: ACCENT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02030a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(181,236,52,0.75)", fontWeight: 900 }}>
                  Payment confirmed
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  {message}
                </p>
              </div>
            </div>

            <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={onDone}
                style={{
                  padding: "14px 40px",
                  borderRadius: 6,
                  border: "none",
                  background: ACCENT,
                  color: "#050505",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Return to Home
              </button>
            </div>
          </div>
        ) : (
          <>
            {status === "removed" && (
              <div
                style={{
                  marginBottom: 18,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(250,204,21,0.25)",
                  background: "rgba(250,204,21,0.08)",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  {message}
                </p>
              </div>
            )}

            {/* method chooser */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setMethod("manual")}
                style={{
                  padding: "14px 14px",
                  borderRadius: 14,
                  border: method === "manual" ? "1px solid rgba(181,236,52,0.65)" : "1px solid rgba(255,255,255,0.12)",
                  background: method === "manual" ? "rgba(181,236,52,0.08)" : "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <p style={{ margin: 0, fontSize: 12, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Manual monthly
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                  Pay yourself every month. Missing payments for 2+ months removes you automatically.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMethod("autopay")}
                style={{
                  padding: "14px 14px",
                  borderRadius: 14,
                  border: method === "autopay" ? "1px solid rgba(181,236,52,0.65)" : "1px solid rgba(255,255,255,0.12)",
                  background: method === "autopay" ? "rgba(181,236,52,0.08)" : "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <p style={{ margin: 0, fontSize: 12, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Autopay
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                  Enter card details once. We simulate monthly autopay and remove you after 2+ missed months.
                </p>
              </button>
            </div>

            {method === "manual" ? (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <Label>First premium</Label>
                  <div
                    style={{
                      padding: "16px 16px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.75)",
                      lineHeight: 1.6,
                      fontSize: 14,
                    }}
                  >
                    A one-time charge to activate your membership: <span style={{ color: ACCENT, fontWeight: 800 }}>{formattedAmount}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => payNow("manual")}
                    style={{
                      padding: "14px 40px",
                      borderRadius: 6,
                      border: "none",
                      background: ACCENT,
                      color: "#050505",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Pay {formattedAmount}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <Label>Card details (demo)</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <input
                      placeholder="Name on card"
                      value={autopay.name}
                      onChange={(e) => setAutopay((s) => ({ ...s, name: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <input
                      placeholder="Card number"
                      value={autopay.cardNumber}
                      onChange={(e) => setAutopay((s) => ({ ...s, cardNumber: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <input
                      placeholder="Expiry (MM/YY)"
                      value={autopay.expiry}
                      onChange={(e) => setAutopay((s) => ({ ...s, expiry: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <input
                      placeholder="CVC"
                      value={autopay.cvc}
                      onChange={(e) => setAutopay((s) => ({ ...s, cvc: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.75)",
                      lineHeight: 1.6,
                      fontSize: 14,
                    }}
                  >
                    We’ll charge the first premium now and simulate future autopay. If payments are missed for more than 2 months, you’ll be removed automatically.
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={!validateAutopay()}
                    onClick={() => payNow("autopay")}
                    style={{
                      padding: "14px 40px",
                      borderRadius: 6,
                      border: "none",
                      background: validateAutopay() ? ACCENT : "rgba(181,236,52,0.15)",
                      color: validateAutopay() ? "#050505" : "rgba(181,236,52,0.35)",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      cursor: validateAutopay() ? "pointer" : "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    Enable Autopay · Pay {formattedAmount}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

