import React, { useCallback, useState } from "react";
import { ACCENT, FaintBackground } from "./OnboardingCommon.jsx";
import { PricingCards } from "./PricingCards.jsx";
import { setTier } from "../lib/api.js";
import { getSession } from "../lib/session.js";
import { planIdToTier } from "../lib/planTierMap.js";

export function PricingPlans({
  onBack,
  onFinish,
  selectedPlanId = "standard",
  onSelectPlan,
}) {
  const [tierSubmitting, setTierSubmitting] = useState(false);
  const [tierError, setTierError] = useState("");
  const submitTierForPlan = useCallback(
    async (planId) => {
      setTierError("");
      setTierSubmitting(true);
      try {
        const { anonymousId } = getSession();
        if (!anonymousId) {
          throw new Error(
            "Your session expired. Please return to the start and sign up again.",
          );
        }
        await setTier(anonymousId, planIdToTier(planId));
        onFinish?.();
      } catch (e) {
        setTierError(e?.message || "Could not save your plan. Please try again.");
      } finally {
        setTierSubmitting(false);
      }
    },
    [onFinish],
  );
  const handleCardMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = rect.width ? (e.clientX - rect.left) / rect.width : 0.5;
    const y = rect.height ? (e.clientY - rect.top) / rect.height : 0.2;
    card.style.setProperty("--mx", String(Math.max(0, Math.min(1, x))));
    card.style.setProperty("--my", String(Math.max(0, Math.min(1, y))));
  }, []);

  const handleCardLeave = useCallback((e) => {
    const card = e.currentTarget;
    card.style.setProperty("--mx", "0.5");
    card.style.setProperty("--my", "0.2");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#02030a",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "96px 24px 72px",
        position: "relative",
      }}
    >
      <FaintBackground />

      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.85)",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "999px",
                background: ACCENT,
                boxShadow: "0 0 12px rgba(181,236,52,0.75)",
              }}
            />
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.75)",
              }}
            >
              Pricing
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "#f9fafb",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Plans and Contributions
          </h1>
          <p
            style={{
              marginTop: 10,
              fontSize: 14,
              color: "rgba(148,163,184,0.9)",
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
            }}
          >
            Choose a contribution tier that matches how you want to participate
            in the care pool — from minimal entry to high-stability system
            supporter.
          </p>
        </div>

        {/* small controls row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(148,163,184,0.9)",
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
            onMouseLeave={(e) => (e.target.style.color = "rgba(148,163,184,0.9)")}
          >
            ← Back to terms
          </button>

          <div
            style={{
              display: "inline-flex",
              padding: 3,
              borderRadius: 999,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            <button
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                border: "none",
                background: "rgba(15,23,42,0.95)",
                color: "rgba(226,232,240,0.95)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "default",
              }}
            >
              Monthly
            </button>
            <button
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: "rgba(148,163,184,0.9)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "default",
              }}
            >
              Annual (soon)
            </button>
          </div>
        </div>

        {/* animated pricing cards */}
        <PricingCards
          selectDisabled={tierSubmitting}
          onSelectPlan={(planId) => {
            onSelectPlan?.(planId);
            submitTierForPlan(planId);
          }}
        />

        {/* legacy pricing grid (hidden) */}
        <div
          style={{
            display: "none",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 24,
          }}
          className="pricing-grid"
        >
          {/* Basic */}
          <div
            style={{
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              background:
                "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.18), transparent 55%), rgba(10,12,22,0.96)",
              padding: "28px 26px 30px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 16px 45px rgba(15,23,42,0.9)",
              transform: "translateY(0)",
              transition:
                "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease",
              ["--glowColor"]: "rgba(59,130,246,0.55)",
            }}
            className="pricing-card"
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <div
              style={{
                position: "absolute",
                inset: -1,
                pointerEvents: "none",
              }}
            />
            <div className="pricing-card-anim" />
            <div className="pricing-card-sheen" />

            <div className="pricing-card-content">
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 10,
              }}
            >
              Basic — ₹499
            </p>
            <p
              style={{
                fontSize: 26,
                color: "#e5e7eb",
                margin: 0,
                marginBottom: 4,
                fontWeight: 700,
              }}
            >
              ₹499
            </p>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(148,163,184,0.85)",
                marginBottom: 14,
              }}
            >
              Basic contribution
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(209,213,219,0.7)",
                marginBottom: 20,
              }}
            >
              Basic Contribution · Minimal entry into the protocol
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.7,
              }}
            >
              <li>Full access to claims &amp; jury evaluation</li>
              <li>Equal medical decision-making</li>
              <li>Higher variability during pool stress</li>
              <li>Standard system interaction</li>
              <li>Full care access with minimal contribution</li>
            </ul>
            <button
              style={{
                marginTop: 22,
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.7)",
                background: "rgba(15,23,42,0.9)",
                color: "rgba(226,232,240,0.96)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Start with Basic
            </button>
            </div>
          </div>

          {/* Standard */}
          <div
            style={{
              borderRadius: 22,
              border: `1px solid ${ACCENT}`,
              background:
                "radial-gradient(circle at 0% 0%, rgba(255,230,150,0.18), transparent 55%), rgba(10,14,26,0.95)",
              padding: "34px 30px 36px",
              boxShadow:
                "0 0 0 1px rgba(181,236,52,0.2), 0 22px 60px rgba(0,0,0,0.9)",
              position: "relative",
              overflow: "hidden",
              transform: "translateY(0)",
              transition:
                "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease",
              ["--glowColor"]: "rgba(253,224,71,0.85)",
            }}
            className="pricing-card pricing-card-featured"
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.12,
                background: "radial-gradient(circle at 20% 0%, rgba(181,236,52,0.9), transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <div className="pricing-card-anim" />
            <div className="pricing-card-sheen" />

            <div className="pricing-card-content">
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#facc15",
                marginBottom: 10,
              }}
            >
              🟡 Standard — ₹999 ⭐
            </p>
            <p
              style={{
                fontSize: 28,
                color: "#fefce8",
                margin: 0,
                marginBottom: 4,
                fontWeight: 800,
              }}
            >
              ₹999
            </p>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(250,250,250,0.9)",
                marginBottom: 14,
              }}
            >
              Recommended tier
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 20,
              }}
            >
              Balanced Contribution · Stability with smoother experience
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.7,
              }}
            >
              <li>Full access to claims &amp; evaluation</li>
              <li>More stable monthly contribution</li>
              <li>Reduced friction in interactions</li>
              <li>Balanced system participation</li>
              <li>Optimized for stability and efficiency</li>
            </ul>
            <button
              style={{
                marginTop: 22,
                padding: "12px 22px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(90deg, rgba(250,250,210,1), rgba(181,236,52,1))",
                color: "#020617",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 14px 40px rgba(250,250,210,0.25)",
              }}
            >
              Choose Standard
            </button>
            </div>
          </div>

          {/* Premium */}
          <div
            style={{
              borderRadius: 20,
              border: "1px solid rgba(96,165,250,0.6)",
              background:
                "radial-gradient(circle at 100% 0%, rgba(96,165,250,0.22), transparent 55%), rgba(8,12,24,0.95)",
              padding: "28px 26px 30px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 16px 45px rgba(15,23,42,0.9)",
              transform: "translateY(0)",
              transition:
                "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease",
              ["--glowColor"]: "rgba(56,189,248,0.65)",
            }}
            className="pricing-card"
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.12,
                background: "radial-gradient(circle at 0% 0%, rgba(56,189,248,0.9), transparent 55%)",
                pointerEvents: "none",
              }}
            />
            <div className="pricing-card-anim" />
            <div className="pricing-card-sheen" />

            <div className="pricing-card-content">
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(147,197,253,0.9)",
                marginBottom: 10,
              }}
            >
              🔵 Premium — ₹1799
            </p>
            <p
              style={{
                fontSize: 26,
                color: "#e5f2ff",
                margin: 0,
                marginBottom: 4,
                fontWeight: 700,
              }}
            >
              ₹1799
            </p>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(191,219,254,0.95)",
                marginBottom: 14,
              }}
            >
              System supporter
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.8)",
                marginBottom: 20,
              }}
            >
              System Supporter · Higher contribution, maximum stability
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.7,
              }}
            >
              <li>Full and equal care access</li>
              <li>Lowest variability during pool stress</li>
              <li>Smoothest system experience</li>
              <li>Supports system resilience</li>
              <li>Strengthens the system for all members</li>
            </ul>
            <button
              style={{
                marginTop: 22,
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(147,197,253,0.9)",
                background: "rgba(15,23,42,0.96)",
                color: "rgba(219,234,254,0.96)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Choose Premium
            </button>
            </div>
          </div>
        </div>

        {/* bottom CTA */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            disabled={tierSubmitting}
            onClick={() => submitTierForPlan(selectedPlanId)}
            style={{
              padding: "14px 40px",
              borderRadius: 6,
              border: "none",
              background: tierSubmitting ? "rgba(181,236,52,0.15)" : ACCENT,
              color: tierSubmitting ? "rgba(181,236,52,0.3)" : "#050505",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: tierSubmitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {tierSubmitting ? "Saving…" : "Continue to Payment"}
          </button>
          {tierError ? (
            <p style={{ margin: 0, fontSize: 13, color: "#fda4af", lineHeight: 1.5, maxWidth: 420, textAlign: "right" }}>
              {tierError}
            </p>
          ) : null}
        </div>

        <style>{`
          @media (max-width: 960px) {
            .pricing-grid {
              grid-template-columns: 1fr;
            }
            .pricing-card-featured {
              order: -1;
            }
          }

          .pricing-card {
            isolation: isolate;
            --mx: 0.5;
            --my: 0.2;
          }

          .pricing-card-content {
            position: relative;
            z-index: 1;
          }

          .pricing-card-anim {
            position: absolute;
            inset: -1px;
            z-index: 0;
            border-radius: inherit;
            pointer-events: none;
            opacity: 0;
            transition: opacity 180ms ease;
            background: radial-gradient(
              circle at calc(var(--mx) * 100%) calc(var(--my) * 100%),
              var(--glowColor),
              transparent 58%
            );
            filter: blur(2px);
          }

          .pricing-card-sheen {
            position: absolute;
            inset: -2px;
            z-index: 0;
            border-radius: inherit;
            pointer-events: none;
            opacity: 0.18;
            background: linear-gradient(
              110deg,
              transparent 0%,
              rgba(255,255,255,0.16) 35%,
              rgba(255,255,255,0.06) 55%,
              transparent 78%
            );
            transform: translateX(-60%);
            animation: pricingSheen 6.5s ease-in-out infinite;
          }

          .pricing-card:hover .pricing-card-anim {
            opacity: 1;
          }

          .pricing-card:hover .pricing-card-sheen {
            opacity: 0.35;
            animation-duration: 2.2s;
          }

          @keyframes pricingSheen {
            0% {
              transform: translateX(-60%);
            }
            50% {
              transform: translateX(10%);
            }
            100% {
              transform: translateX(60%);
            }
          }

          .pricing-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 24px 70px rgba(15,23,42,0.95);
          }

          .pricing-card-featured:hover {
            transform: translateY(-14px);
            box-shadow: 0 30px 90px rgba(190,242,100,0.45);
          }
        `}</style>
      </div>
    </div>
  );
}

