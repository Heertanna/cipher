import React, { useEffect, useRef, useState } from "react";

const COLS = 56;
const ROWS = 14;
const DOT_GAP = 18;
const ACCENT = "#b5ec34";

function heartbeatValue(index) {
  const period = 18;
  const phase = ((index % period) + period) % period;
  const t = phase / period;

  if (t < 0.15) return 0.5 + t * 0.6;
  if (t < 0.2) return 0.59 + (t - 0.15) * 2.0;
  if (t < 0.25) return 0.69 + (t - 0.2) * 6.2;
  if (t < 0.3) return 1.0 - (t - 0.25) * 10.0;
  if (t < 0.35) return 0.5 - (t - 0.3) * 6.0;
  if (t < 0.4) return 0.2 + (t - 0.35) * 6.0;
  if (t < 0.5) return 0.5 + (t - 0.4) * 3.5;
  if (t < 0.55) return 0.85 - (t - 0.5) * 5.0;
  if (t < 0.65) return 0.6 + (t - 0.55) * 0.5;
  return 0.5 + Math.sin(t * Math.PI * 2) * 0.04;
}

function generateHeartbeat(offset) {
  const arr = [];
  for (let c = 0; c < COLS; c++) {
    arr.push(Math.max(0.02, Math.min(0.98, heartbeatValue(c + offset))));
  }
  return arr;
}

export function PoolHeartbeat() {
  const [offset, setOffset] = useState(0);
  const frameRef = useRef(null);
  const lastTime = useRef(0);

  useEffect(() => {
    function tick(time) {
      if (time - lastTime.current > 350) {
        lastTime.current = time;
        setOffset((o) => o + 1);
      }
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const data = generateHeartbeat(offset);
  const dataRows = data.map((v) => Math.round((1 - v) * (ROWS - 1)));

  const pad = DOT_GAP * 0.5;
  const svgW = pad * 2 + (COLS - 1) * DOT_GAP;
  const svgH = pad * 2 + (ROWS - 1) * DOT_GAP;

  return (
    <section
      style={{
        position: "relative",
        background: "#050505",
        padding: "80px 0 60px",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1500, width: "94%", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 40,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(181,236,52,0.5)",
                marginBottom: 12,
              }}
            >
              Pool Vitals · Live
            </p>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#f1f5f9",
              }}
            >
              Analyze{" "}
              <span style={{ color: ACCENT }}>every claim</span>
              <br />
              in real time
            </h2>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "flex-end", paddingTop: 12 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "rgba(181,236,52,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Approved</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>↑ 247</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Rejected</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>↓ 18</p>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(181,236,52,0.2)",
            borderRadius: 20,
            background: "#0a0a0f",
            padding: "20px 12px",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            {Array.from({ length: ROWS }).map((_, row) =>
              Array.from({ length: COLS }).map((_, col) => {
                const cx = pad + col * DOT_GAP;
                const cy = pad + row * DOT_GAP;
                const activeRow = dataRows[col];
                const isActive = row === activeRow;
                const belowCurve = row > activeRow;
                const distBelow = row - activeRow;

                let r, fill;

                if (isActive) {
                  r = 6.5;
                  fill = ACCENT;
                } else if (belowCurve && distBelow <= 3) {
                  r = 5 - distBelow * 0.7;
                  const o = (0.65 - distBelow * 0.15).toFixed(2);
                  fill = `rgba(255,255,255,${o})`;
                } else if (belowCurve) {
                  r = 3;
                  fill = "rgba(255,255,255,0.18)";
                } else {
                  r = 3;
                  fill = "rgba(255,255,255,0.1)";
                }

                return (
                  <circle
                    key={`${row}-${col}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={fill}
                  />
                );
              })
            )}
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            fontSize: 10,
            color: "rgba(181,236,52,0.35)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          <span>← Older claims</span>
          <span>Latest →</span>
        </div>

        {/* stats cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginTop: 40,
          }}
        >
          {[
            { label: "Pool Treasury", value: "₹1.24M", change: "↑ +4.7% this month", accent: true },
            { label: "Active Members", value: "312", change: "+12 this week", accent: false, yellowBorder: true },
            { label: "Claims Processed", value: "265", change: "+8 today", accent: false, yellowBorder: true },
            { label: "Approval Rate", value: "92%", change: "peer-reviewed decisions", accent: true },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: card.accent ? ACCENT : "#0a0a0f",
                border: card.accent ? "none" : card.yellowBorder ? "1px solid rgba(255, 215, 0, 0.5)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: card.accent ? "rgba(5,5,5,0.6)" : "rgba(255,255,255,0.35)",
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: card.accent ? "#050505" : "#f1f5f9",
                  letterSpacing: "-0.02em",
                }}
              >
                {card.value}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: card.accent ? "rgba(5,5,5,0.5)" : "rgba(181,236,52,0.5)",
                  letterSpacing: "0.04em",
                }}
              >
                {card.change}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
