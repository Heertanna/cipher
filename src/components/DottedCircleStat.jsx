import React, { useEffect, useState } from "react";

const DOT_COUNT = 36;
const RING_SIZE = 190;
const CENTER = RING_SIZE / 2;
const DOT_RING_RADIUS = 88;
const DOT_RADIUS = 3;

export function DottedCircleStat({ percentage, color, text, delayMs = 0 }) {
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
          width: 150,
          height: 150,
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
            fontSize: 32,
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
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: 120,
            lineHeight: 1.4,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
