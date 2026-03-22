import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { CaseCard } from "./CaseCard.jsx";

const STORAGE_KEY = "cipher_claims_demo";

const STATIC_CASES = [
  {
    id: "A392",
    title: "Knee injury triage",
    stage: "Symptoms",
    status: "Under review",
    progress: 28,
    jurorCount: 8,
    description:
      "Acute knee injury after road accident. Imaging and reports uploaded. Pre-check is validating completeness.",
  },
  {
    id: "B118",
    title: "Migraine case review",
    stage: "Diagnosis",
    status: "Under review",
    progress: 53,
    jurorCount: 8,
    description:
      "Chronic migraine management plan. Medication history shared. Jury review is assessing risk, eligibility, and documentation consistency.",
  },
  {
    id: "C172",
    title: "Reimbursement decision",
    stage: "Decision",
    status: "Under review",
    progress: 84,
    jurorCount: 8,
    description:
      "Post-surgery physiotherapy reimbursement request. Decision stage is preparing payout recommendation and final notes.",
  },
];

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadDynamicJuryCases() {
  const claimsRaw = window.localStorage.getItem(STORAGE_KEY);
  const claims = safeParse(claimsRaw) || [];
  const juryClaims = claims.filter(
    (c) => c && (c.stage === "Jury review" || c.status === "Under Jury Review")
  );

  return juryClaims.slice(0, 2).map((c) => ({
    id: c.id,
    title: "Peer review case",
    stage: c.stageDetail || "Review in progress",
    status: c.status || "Under Jury Review",
    // ClaimsCard uses stage-based progress, but the spectate cards want a number.
    progress: c.stage === "Jury review" ? 50 : c.progress || 40,
    jurorCount: c.jurorCount || 8,
    description:
      c.anonymizedDescription ||
      c.anonymizedText ||
      "An anonymized medical case is being evaluated by a jury.",
  }));
}

function useIsMobile(breakpointPx = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const apply = () => setIsMobile(Boolean(mql.matches));
    apply();
    if (mql.addEventListener) mql.addEventListener("change", apply);
    else mql.addListener(apply);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", apply);
      else mql.removeListener(apply);
    };
  }, [breakpointPx]);

  return isMobile;
}

export function LiveCasesStack() {
  const isMobile = useIsMobile(900);

  const dynamicCases = useMemo(() => loadDynamicJuryCases(), []);
  const allCases = useMemo(() => [...dynamicCases, ...STATIC_CASES], [dynamicCases]);

  const [selectedId, setSelectedId] = useState(() => {
    const focusId = window.localStorage.getItem("cipher_focus_case_id");
    if (!focusId) return null;
    const exists = allCases.some((c) => c.id === focusId);
    return exists ? focusId : null;
  });

  const selected = useMemo(
    () => (selectedId ? allCases.find((c) => c.id === selectedId) : null),
    [selectedId, allCases]
  );

  useEffect(() => {
    window.localStorage.removeItem("cipher_focus_case_id");
  }, []);

  const deckHeight = 300;

  if (isMobile) {
    return (
      <section
        style={{
          padding: 20,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "radial-gradient(circle at 90% 0%, rgba(56,189,248,0.12), transparent 45%), rgba(15,23,42,0.9)",
          overflow: "visible",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 12,
            flexWrap: "wrap",
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

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {allCases.map((c) => (
            <CaseCard
              key={c.id}
              c={c}
              detail="hover"
              tone="dark"
              onClick={() => setSelectedId(c.id)}
              disableHover
            />
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(2,3,10,0.62)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
              }}
            >
              <div style={{ position: "absolute", left: 24, top: 18 }}>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.65)",
                    background: "rgba(15,23,42,0.5)",
                    color: "rgba(226,232,240,0.96)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  ← Back to stack
                </button>
              </div>

              <Motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                style={{ width: "100%", maxWidth: 740 }}
              >
                <CaseCard
                  c={selected}
                  detail="focus"
                  tone="dark"
                  onClick={() => {}}
                />
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 90% 0%, rgba(56,189,248,0.12), transparent 45%), rgba(15,23,42,0.9)",
        overflow: "visible",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap",
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

      {/* Desktop: three cards side-by-side */}
      <Motion.div
        initial={false}
        animate={{
          opacity: selectedId ? 0.12 : 1,
          filter: selectedId ? "blur(1px)" : "none",
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{
          minHeight: deckHeight,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          alignItems: "stretch",
          padding: 0,
          pointerEvents: selectedId ? "none" : "auto",
        }}
      >
        {allCases.map((c) => (
          <div key={c.id} style={{ height: "100%" }}>
            <CaseCard
              c={c}
              detail="hover"
              tone="dark"
              onClick={() => setSelectedId(c.id)}
              disableHover
            />
          </div>
        ))}
      </Motion.div>

      {/* focus overlay */}
      <AnimatePresence>
        {selected && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1100,
              background: "rgba(0,0,0,0.62)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div style={{ position: "absolute", left: 24, top: 18 }}>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.65)",
                  background: "rgba(15,23,42,0.5)",
                  color: "rgba(226,232,240,0.96)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                ← Back to stack
              </button>
            </div>

            <Motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1.0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ width: "100%", maxWidth: 560 }}
            >
              <CaseCard
                c={selected}
                detail="focus"
                tone="dark"
                onClick={() => {}}
              />
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

