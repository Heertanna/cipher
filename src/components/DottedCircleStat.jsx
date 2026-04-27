import React, { useEffect, useState } from "react";

const DOT_COUNT = 36;

export function DottedCircleStat({ percentage, color, text, delayMs = 0, compact = false }) {
  const [filledDots, setFilledDots] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const targetPct = Math.max(0, Math.min(100, Number(percentage) || 0));
  const targetDots = Math.round((targetPct / 100) * DOT_COUNT);
  const ringSize = compact ? 168 : 190;
  const center = ringSize / 2;
  const dotRingRadius = compact ? 78 : 88;
  const dotRadius = compact ? 2.7 : 3;
  const innerSize = compact ? 128 : 150;
  const pctFontSize = compact ? 29 : 32;
  const textFontSize = compact ? 13 : 14;
  const textMaxWidth = compact ? 106 : 120;

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
    <div style={{ width: ringSize, height: ringSize, position: "relative", flexShrink: 0 }}>
      <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
        {Array.from({ length: DOT_COUNT }).map((_, idx) => {
          const angle = -Math.PI / 2 + (idx / DOT_COUNT) * Math.PI * 2;
          const x = center + Math.cos(angle) * dotRingRadius;
          const y = center + Math.sin(angle) * dotRingRadius;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={dotRadius}
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
          width: innerSize,
          height: innerSize,
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
            fontSize: pctFontSize,
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
            fontSize: textFontSize,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: textMaxWidth,
            lineHeight: 1.4,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
