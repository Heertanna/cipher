import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";

const CASES = [
  {
    id: "A392",
    stage: "Symptoms",
    status: "Under review",
    progress: 28,
    jurors: 8,
    summary: "Acute knee injury after road accident. Imaging and reports uploaded.",
  },
  {
    id: "B118",
    stage: "Diagnosis",
    status: "Under review",
    progress: 53,
    jurors: 8,
    summary: "Chronic migraine management plan. Medication history shared.",
  },
  {
    id: "C172",
    stage: "Decision",
    status: "Under review",
    progress: 84,
    jurors: 8,
    summary: "Post-surgery physiotherapy reimbursement request.",
  },
];

export function LiveCasesCard() {
  const [openId, setOpenId] = useState(CASES[1]?.id ?? CASES[0]?.id ?? null);

  return (
    <section
      style={{
        padding: "20px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 90% 0%, rgba(56,189,248,0.14), transparent 45%), rgba(15,23,42,0.9)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(148,163,184,0.95)",
          }}
        >
          Live Cases
        </p>
        <span style={{ color: "rgba(148,163,184,0.85)", fontSize: 12 }}>
          Spectate mode
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
        className="live-cases-grid"
      >
        {CASES.map((c, idx) => {
          const isOpen = openId === c.id;
          const isLight = idx === 2;

          const headerBg = isLight
            ? "linear-gradient(180deg, rgba(59,130,246,0.35), rgba(59,130,246,0.12))"
            : "linear-gradient(180deg, rgba(59,130,246,0.95), rgba(59,130,246,0.25))";

          const bodyBg = isLight ? "rgba(248,250,252,0.98)" : "rgba(15,23,42,0.93)";
          const border = isLight
            ? "1px solid rgba(15,23,42,0.10)"
            : "1px solid rgba(148,163,184,0.35)";

          const titleColor = isLight ? "rgba(15,23,42,1)" : "rgba(226,232,240,0.96)";
          const subColor = isLight ? "rgba(71,85,105,1)" : "rgba(148,163,184,0.95)";

          const fillColor = isLight ? "rgba(181,236,52,1)" : "rgba(181,236,52,1)";
          const trackBg = isLight ? "rgba(2,6,23,0.06)" : "rgba(15,23,42,1)";

          return (
            <Motion.button
              key={c.id}
              type="button"
              onClick={() => setOpenId((prev) => (prev === c.id ? null : c.id))}
              style={{
                textAlign: "left",
                padding: 0,
                borderRadius: 18,
                border,
                background: bodyBg,
                cursor: "pointer",
                overflow: "hidden",
                transition:
                  "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
                boxShadow: isLight
                  ? "0 16px 40px rgba(2,6,23,0.12)"
                  : isOpen
                  ? "0 26px 70px rgba(0,0,0,0.55)"
                  : "0 18px 46px rgba(0,0,0,0.35)",
                transform: isOpen ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
              }}
            >
              {/* top bar */}
              <div
                style={{
                  height: 42,
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: headerBg,
                  borderBottom: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(15,23,42,0.7)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: isLight ? "rgba(59,130,246,0.95)" : "rgba(248,250,252,0.9)",
                      boxShadow: isLight ? "0 0 12px rgba(59,130,246,0.45)" : "0 0 12px rgba(59,130,246,0.45)",
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: titleColor,
                      fontWeight: 800,
                    }}
                  >
                    Projects
                  </p>
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {[0, 1, 2].map((k) => (
                    <span
                      key={k}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: isLight ? "rgba(15,23,42,0.55)" : "rgba(226,232,240,0.75)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* body */}
              <div style={{ padding: "12px 12px 12px" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 14,
                    fontWeight: 900,
                    color: titleColor,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Case #{c.id}
                </p>

                <p style={{ margin: 0, fontSize: 12, color: subColor, lineHeight: 1.5 }}>
                  {c.stage} · {c.status}
                </p>

                <div
                  style={{
                    marginTop: 10,
                    height: 8,
                    borderRadius: 999,
                    background: trackBg,
                    border: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(148,163,184,0.35)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${c.progress}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${fillColor}, rgba(56,189,248,1))`,
                    }}
                  />
                </div>

                <p style={{ margin: "8px 0 0", fontSize: 11, color: subColor }}>
                  {c.jurors} jurors evaluating
                </p>
              </div>

              {/* expandable details */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <Motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      padding: "0 12px 12px",
                      borderTop: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(15,23,42,0.6)",
                      background: isLight ? "rgba(248,250,252,0.98)" : "rgba(15,23,42,0.96)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: subColor,
                        lineHeight: 1.6,
                      }}
                    >
                      {c.summary}
                    </p>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.button>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .live-cases-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

