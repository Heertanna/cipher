import React, { useEffect, useMemo, useState } from "react";

const DOT_COUNT = 36;
const RING_SIZE = 280;
const CENTER = RING_SIZE / 2;
const DOT_RING_RADIUS = 132;
const DOT_RADIUS = 3;

// Demo-only seed data for transparency visuals.
const DEMO_STATS = {
  total_cases: 300,
  approved: 201,
  denied: 63,
  re_evaluation: 36,
};

function DottedCircleStat({ percentage, color, text, delayMs = 0 }) {
  const [filledDots, setFilledDots] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const targetPct = Math.max(0, Math.min(100, Number(percentage) || 0));
  const targetDots = Math.round((targetPct / 100) * DOT_COUNT);

  useEffect(() => {
    let cancelled = false;
    setFilledDots(0);
    setDisplayPct(0);
    const startHandle = window.setTimeout(() => {
      const start = Date.now();
      const duration = 1500;
      const tick = window.setInterval(() => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const t = Math.min(1, elapsed / duration);
        setFilledDots(Math.round(targetDots * t));
        setDisplayPct(Math.round(targetPct * t));
        if (t >= 1) window.clearInterval(tick);
      }, 30);
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(startHandle);
    };
  }, [delayMs, targetDots, targetPct]);

  return (
    <div style={{ width: RING_SIZE, height: RING_SIZE, position: "relative", flexShrink: 0 }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        {Array.from({ length: DOT_COUNT }).map((_, idx) => {
          const angle = -Math.PI / 2 + (idx / DOT_COUNT) * Math.PI * 2;
          const x = CENTER + Math.cos(angle) * DOT_RING_RADIUS;
          const y = CENTER + Math.sin(angle) * DOT_RING_RADIUS;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={DOT_RADIUS}
              fill={idx < filledDots ? color : "rgba(255,255,255,0.12)"}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 220,
          height: 220,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "3rem",
            fontWeight: 300,
            color: "#ffffff",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {displayPct}%
        </p>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: 140,
            lineHeight: 1.4,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

export function TransparencyStats() {
  const stats = DEMO_STATS;

  const percentages = useMemo(() => {
    const total = Number(stats.total_cases) || 0;
    if (total <= 0) {
      return { approvedPct: 0, deniedPct: 0, reEvalPct: 0 };
    }
    return {
      approvedPct: Math.round((stats.approved / total) * 100),
      deniedPct: Math.round((stats.denied / total) * 100),
      reEvalPct: Math.round((stats.re_evaluation / total) * 100),
    };
  }, [stats]);

  return (
    <section style={{ width: "100%", maxWidth: 980, margin: "0 auto", padding: "60px 0" }}>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.6)",
        }}
      >
        PROTOCOL TRANSPARENCY
      </p>
      <p style={{ margin: "8px 0 48px", fontSize: 14, color: "rgba(148,163,184,0.5)" }}>
        Live aggregate data. No individual cases exposed.
      </p>

      <div
        className="transparency-circles-row"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 48,
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        <DottedCircleStat
          percentage={percentages.approvedPct}
          color="#b5ec34"
          text="cases were approved after peer jury review."
          delayMs={0}
        />
        <DottedCircleStat
          percentage={percentages.deniedPct}
          color="#f87171"
          text="cases were denied due to insufficient evidence."
          delayMs={180}
        />
        <DottedCircleStat
          percentage={percentages.reEvalPct}
          color="#fbbf24"
          text="cases moved to re-evaluation for deeper review."
          delayMs={360}
        />
      </div>
    </section>
  );
}
