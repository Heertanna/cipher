import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";

const GAP = 24;
const CARD_COUNT = 3;

const STACK_X = 18;
const STACK_Y = 14;

const BREAKDOWN_BAR_TRACK = "rgba(255,255,255,0.08)";

function ContributionBreakdown({ rows }) {
  return (
    <>
      <div
        style={{
          borderTop: "1px solid rgba(148,163,184,0.18)",
          marginTop: 12,
          paddingTop: 14,
        }}
      />
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.5)",
          margin: "0 0 10px 0",
        }}
      >
        CONTRIBUTION BREAKDOWN
      </p>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(148,163,184,0.7)",
              lineHeight: 1.3,
              flex: "1 1 auto",
              minWidth: 0,
            }}
          >
            {row.label}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f9fafb" }}>{row.amount}</span>
            <div
              style={{
                width: 80,
                height: 4,
                borderRadius: 999,
                background: BREAKDOWN_BAR_TRACK,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${row.pct}%`,
                  height: "100%",
                  background: row.barColor,
                  borderRadius: 999,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.85)",
                minWidth: 40,
                textAlign: "right",
              }}
            >
              {row.pctLabel ?? `${row.pct}%`}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

function useIsMobile(breakpointPx = 820) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const apply = () => setIsMobile(Boolean(mql.matches));
    apply();
    // Safari uses addListener; keep modern listener first.
    if (mql.addEventListener) mql.addEventListener("change", apply);
    else mql.addListener(apply);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", apply);
      else mql.removeListener(apply);
    };
  }, [breakpointPx]);

  return isMobile;
}

function PricingCardContent({ card, onSelectPlan, selectDisabled }) {
  // Keep the exact text styling you already had (fonts/colors/sizes) but move layout animations here.
  return (
    <>
      {card.topLabel}
      <p style={{ fontSize: card.priceFontSize, color: card.priceColor, margin: 0, marginBottom: 4, fontWeight: 700 }}>
        {card.price}
      </p>
      <p
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: card.tierColor,
          marginBottom: 14,
        }}
      >
        {card.tierSubtitle}
      </p>
      <ContributionBreakdown rows={card.breakdown} />
      <p style={{ fontSize: 14, color: card.descriptionColor, marginBottom: 20 }}>
        {card.description}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, color: card.listColor, lineHeight: 1.7 }}>
        {card.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <button
        type="button"
        disabled={selectDisabled}
        style={{
          ...card.ctaStyle,
          opacity: selectDisabled ? 0.45 : 1,
          cursor: selectDisabled ? "not-allowed" : card.ctaStyle.cursor,
        }}
        onClick={() => {
          if (selectDisabled) return;
          onSelectPlan?.(card.id);
        }}
      >
        {card.ctaText}
      </button>
    </>
  );
}

export function PricingCards({ onSelectPlan, selectDisabled = false }) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile(820);

  const cards = useMemo(
    () => [
      {
        id: "basic",
        className: "pricing-stack-card",
        topLabel: (
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
            Basic — ₹500
          </p>
        ),
        border: "1px solid rgba(255,255,255,0.1)",
        background:
          "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.18), transparent 55%), rgba(10,12,22,0.96)",
        price: "₹500",
        priceFontSize: 26,
        priceColor: "#e5e7eb",
        tierSubtitle: "Basic contribution",
        tierColor: "rgba(148,163,184,0.85)",
        description: "Basic Contribution · Minimal entry into the protocol",
        descriptionColor: "rgba(209,213,219,0.7)",
        bullets: [
          "Full access to claims & jury evaluation",
          "Equal medical decision-making",
          "Higher variability during pool stress",
          "Standard system interaction",
          "Full care access with minimal contribution",
        ],
        listColor: "rgba(255,255,255,0.7)",
        ctaText: "Start with Basic",
        ctaStyle: {
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
        },
        // Background overlays
        glowOpacity: 0.12,
        glowBackground: "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.9), transparent 55%)",
        accentGlowColor: "rgba(59,130,246,0.55)",
        featuredBorder: false,
        breakdown: [
          {
            label: "Claim Coverage Pool",
            amount: "\u20B9350",
            pct: 70,
            barColor: "#b5ec34",
          },
          {
            label: "Emergency Reserve",
            amount: "\u20B9100",
            pct: 20,
            barColor: "#fbbf24",
          },
          {
            label: "Catastrophic Buffer",
            amount: "\u20B950",
            pct: 10,
            barColor: "#f87171",
          },
        ],
      },
      {
        id: "standard",
        className: "pricing-stack-card pricing-stack-card-featured",
        topLabel: (
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
            🟡 Standard — ₹1,000 ⭐
          </p>
        ),
        border: `1px solid ${ACCENT}`,
        background:
          "radial-gradient(circle at 0% 0%, rgba(255,230,150,0.18), transparent 55%), rgba(10,14,26,0.95)",
        price: "₹1,000",
        priceFontSize: 28,
        priceColor: "#fefce8",
        tierSubtitle: "Recommended tier",
        tierColor: "rgba(250,250,250,0.9)",
        description: "Balanced Contribution · Stability with smoother experience",
        descriptionColor: "rgba(255,255,255,0.85)",
        bullets: [
          "Full access to claims & evaluation",
          "More stable monthly contribution",
          "Reduced friction in interactions",
          "Balanced system participation",
          "Optimized for stability and efficiency",
        ],
        listColor: "rgba(255,255,255,0.8)",
        ctaText: "Choose Standard",
        ctaStyle: {
          marginTop: 22,
          padding: "12px 22px",
          borderRadius: 999,
          border: "none",
          background: "linear-gradient(90deg, rgba(250,250,210,1), rgba(181,236,52,1))",
          color: "#020617",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "0 14px 40px rgba(250,250,210,0.25)",
        },
        glowOpacity: 0.12,
        glowBackground: "radial-gradient(circle at 20% 0%, rgba(181,236,52,0.9), transparent 60%)",
        accentGlowColor: "rgba(253,224,71,0.85)",
        featuredBorder: true,
        breakdown: [
          {
            label: "Claim Coverage Pool",
            amount: "\u20B9700",
            pct: 70,
            barColor: "#b5ec34",
          },
          {
            label: "Emergency Reserve",
            amount: "\u20B9200",
            pct: 20,
            barColor: "#fbbf24",
          },
          {
            label: "Catastrophic Buffer",
            amount: "\u20B9100",
            pct: 10,
            barColor: "#f87171",
          },
        ],
      },
      {
        id: "premium",
        className: "pricing-stack-card",
        topLabel: (
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
            🔵 Premium — ₹2,000
          </p>
        ),
        border: "1px solid rgba(96,165,250,0.6)",
        background:
          "radial-gradient(circle at 100% 0%, rgba(96,165,250,0.22), transparent 55%), rgba(8,12,24,0.95)",
        price: "₹2,000",
        priceFontSize: 26,
        priceColor: "#e5f2ff",
        tierSubtitle: "System supporter",
        tierColor: "rgba(191,219,254,0.95)",
        description: "System Supporter · Higher contribution, maximum stability",
        descriptionColor: "rgba(255,255,255,0.8)",
        bullets: [
          "Full and equal care access",
          "Lowest variability during pool stress",
          "Smoothest system experience",
          "Supports system resilience",
          "Strengthens the system for all members",
        ],
        listColor: "rgba(255,255,255,0.8)",
        ctaText: "Choose Premium",
        ctaStyle: {
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
        },
        glowOpacity: 0.12,
        glowBackground: "radial-gradient(circle at 0% 0%, rgba(56,189,248,0.9), transparent 55%)",
        accentGlowColor: "rgba(56,189,248,0.65)",
        featuredBorder: false,
        breakdown: [
          {
            label: "Claim Coverage Pool",
            amount: "\u20B91,400",
            pct: 70,
            barColor: "#b5ec34",
          },
          {
            label: "Emergency Reserve",
            amount: "\u20B9450",
            pct: 22.5,
            barColor: "#fbbf24",
            pctLabel: "22.5%",
          },
          {
            label: "Catastrophic Buffer",
            amount: "\u20B9150",
            pct: 7.5,
            barColor: "#f87171",
            pctLabel: "7.5%",
          },
        ],
      },
    ],
    []
  );

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setContainerWidth(cr.width);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardWidth = Math.max(260, (containerWidth - GAP * 2) / CARD_COUNT);
  const baseX = containerWidth ? (containerWidth - cardWidth) / 2 : 0;

  const [phase, setPhase] = useState(() => (reducedMotion || isMobile ? "layout" : "stacked"));

  useEffect(() => {
    if (reducedMotion || isMobile) return;

    const perCardMs = 400; // ~300–500ms per card
    const stackMs = perCardMs * (CARD_COUNT - 1) + perCardMs;
    const settleDelayMs = 750; // ~0.5–1s after stacking complete

    const t = window.setTimeout(() => setPhase("layout"), stackMs + settleDelayMs);
    return () => window.clearTimeout(t);
  }, [reducedMotion, isMobile]);

  const variants = useMemo(() => {
    return {
      entering: (custom) => ({
        opacity: 0,
        x: custom.baseX,
        y: 42,
        rotate: 0,
        scale: 0.93,
      }),
      stacked: (custom) => {
        const { index, baseX: bx } = custom;
        const z =
          index === 1 ? 30 : index === 0 ? 20 : 10; // Standard on top of the stack

        return {
          opacity: 1,
          x: bx + (index - 1) * STACK_X,
          y: (index - 1) * STACK_Y,
          rotate: (index - 1) * 2,
          scale: 0.95,
          zIndex: z,
          transition: {
            duration: 0.45,
            ease: "easeInOut",
            delay: index * 0.4, // one-by-one card formation (~300–500ms per card)
          },
        };
      },
      layout: (custom) => ({
        opacity: 1,
        x: custom.baseX + (custom.index - 1) * (custom.cardWidth + GAP),
        y: 0,
        rotate: 0,
        scale: 1,
        transition: {
          duration: 0.55,
          ease: "easeInOut",
          delay: 0,
        },
      }),
    };
  }, []);

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {cards.map((card) => {
          const isFeatured = card.id === "standard";
          return (
            <Motion.div
              key={card.id}
              className={card.className}
              style={{
                borderRadius: 20,
                border: card.border,
                background: card.background,
                padding: card.id === "standard" ? "34px 30px 36px" : "28px 26px 30px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 16px 45px rgba(15,23,42,0.9)",
              }}
              whileHover={{
                y: -5,
                scale: 1.01,
                boxShadow: isFeatured
                  ? "0 24px 70px rgba(190,242,100,0.35)"
                  : "0 24px 70px rgba(15,23,42,0.95)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                }}
              />
              <div
                className="pricing-stack-card-glow"
                style={{ background: card.glowBackground }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <PricingCardContent
                  card={card}
                  onSelectPlan={onSelectPlan}
                  selectDisabled={selectDisabled}
                />
              </div>
            </Motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: 720,
        width: "100%",
      }}
    >
      <style>{`
        .pricing-stack-card-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transform: scale(1);
          opacity: 0.12;
          transition: opacity 180ms ease, transform 260ms ease;
          filter: blur(10px);
          z-index: 0;
        }
        .pricing-stack-card:hover .pricing-stack-card-glow {
          opacity: 0.28;
          transform: scale(1.05);
        }
        .pricing-stack-card-featured:hover .pricing-stack-card-glow {
          opacity: 0.34;
        }
      `}</style>
      {cards.map((card, index) => {
        const isFeatured = card.id === "standard";

        const sharedStyle = {
          width: cardWidth,
          position: "absolute",
          top: 0,
          left: 0,
          borderRadius: isFeatured ? 22 : 20,
          border: card.border,
          background: card.background,
          padding: isFeatured ? "34px 30px 36px" : "28px 26px 30px",
          overflow: "hidden",
          boxShadow: "0 16px 45px rgba(15,23,42,0.9)",
          isolation: "isolate",
        };

        return (
          <Motion.div
            key={card.id}
            className={card.className}
            style={sharedStyle}
            initial="entering"
            animate={phase}
            variants={variants}
            custom={{ index, baseX, cardWidth }}
            whileHover={{
              y: -5,
              scale: 1.01,
              boxShadow: isFeatured
                ? "0 28px 90px rgba(190,242,100,0.42)"
                : "0 26px 90px rgba(15,23,42,0.98)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            />
              <div
                className="pricing-stack-card-glow"
                style={{
                  background: card.glowBackground,
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
              <PricingCardContent
                card={card}
                onSelectPlan={onSelectPlan}
                selectDisabled={selectDisabled}
              />
            </div>
          </Motion.div>
        );
      })}
    </div>
  );
}

