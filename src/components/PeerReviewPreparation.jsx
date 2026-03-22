import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";

const STORAGE_KEY = "cipher_claims_demo";

const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms));

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function anonymizeText(input) {
  const t = (input || "").trim();
  if (!t) return "—";

  let out = t;

  // Emails
  out = out.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[redacted]"
  );

  // Phone-like sequences
  out = out.replace(/\+?\d[\d\s-]{7,}\d/g, "[redacted]");

  // Long digit sequences (dates, IDs, etc.)
  out = out.replace(/\b\d{3,}\b/g, "[redacted]");

  // Light proper-noun redaction (demo heuristic).
  const medicalStop = new Set([
    "Fever",
    "Feverish",
    "Surgery",
    "Knee",
    "Migraine",
    "Injury",
    "Pain",
    "Headache",
    "Nausea",
    "Vomiting",
    "Accident",
    "Imaging",
    "Reports",
    "Therapy",
    "Reimbursement",
    "Doctor",
    "Medical",
  ]);

  out = out.replace(/\b[A-Z][a-z]{2,}\b/g, (w) => {
    if (medicalStop.has(w)) return w;
    return "[redacted]";
  });

  return out;
}

function extractSymptoms(description) {
  const d = (description || "").toLowerCase();
  const candidates = [
    { key: "Fever", tokens: ["fever", "temperature"] },
    { key: "Headache", tokens: ["headache", "migraine"] },
    { key: "Nausea", tokens: ["nausea", "nauseous"] },
    { key: "Vomiting", tokens: ["vomiting", "vomit"] },
    { key: "Pain", tokens: ["pain"] },
    { key: "Injury", tokens: ["injury", "trauma", "accident"] },
    { key: "Cough", tokens: ["cough"] },
    { key: "Dizziness", tokens: ["dizziness"] },
  ];

  const found = [];
  candidates.forEach((c) => {
    if (c.tokens.some((tok) => d.includes(tok))) found.push(c.key);
  });
  return found.slice(0, 4);
}

function hashSeed(input) {
  const s = String(input || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Starburst-like juror network (radial node-and-link diagram).
 * Visual intention: "peer network pool" with a central hub and spokes.
 */
function JurorNetworkBurst({
  claimId,
  litCount,
  height = 220,
}) {
  const { nodes, edges } = useMemo(() => {
    const rand = mulberry32(hashSeed(claimId));
    const cx = 110;
    const cy = 110;

    const center = { id: "center", x: cx, y: cy, isCenter: true };
    const nodesLocal = [center];

    const spokes = 12;
    const nodesPerSpokeMin = 2;
    const nodesPerSpokeMax = 5;

    // Create nodes along spokes at increasing radii.
    for (let s = 0; s < spokes; s++) {
      const baseAngle = (s / spokes) * Math.PI * 2;
      const spokeJitter = (rand() - 0.5) * 0.32;
      const angle = baseAngle + spokeJitter;

      const count = nodesPerSpokeMin + Math.floor(rand() * (nodesPerSpokeMax - nodesPerSpokeMin + 1));
      for (let i = 0; i < count; i++) {
        const u = (i + 1) / (count + 0.6);
        const radius = 22 + u * (78 + rand() * 22);
        const jitterR = (rand() - 0.5) * 6;
        const x = cx + Math.cos(angle) * (radius + jitterR);
        const y = cy + Math.sin(angle) * (radius + jitterR);
        nodesLocal.push({
          id: `n_${s}_${i}`,
          x,
          y,
          spoke: s,
          idx: i,
        });
      }
    }

    // Edges: center hub + spoke adjacency + a few cross links.
    const edgesLocal = [];
    const centerId = center.id;

    // Index nodes excluding center.
    const outerNodes = nodesLocal.filter((n) => !n.isCenter);

    // Center hub connections (dense, like the screenshot).
    outerNodes.forEach((n) => {
      if (rand() < 0.78) edgesLocal.push({ a: centerId, b: n.id, kind: "hub" });
    });

    // Spoke adjacency.
    for (let s = 0; s < spokes; s++) {
      for (let i = 0; i < 8; i++) {
        const n0 = nodesLocal.find((n) => !n.isCenter && n.spoke === s && n.idx === i);
        const n1 = nodesLocal.find((n) => !n.isCenter && n.spoke === s && n.idx === i + 1);
        if (n0 && n1 && rand() < 0.85) {
          edgesLocal.push({ a: n0.id, b: n1.id, kind: "spoke" });
        }
      }
    }

    // Cross links (creates the "web" look).
    for (let k = 0; k < 24; k++) {
      const a = outerNodes[Math.floor(rand() * outerNodes.length)];
      const b = outerNodes[Math.floor(rand() * outerNodes.length)];
      if (!a || !b || a.id === b.id) continue;
      if (a.spoke === b.spoke) continue;
      if (rand() < 0.55) edgesLocal.push({ a: a.id, b: b.id, kind: "cross" });
    }

    return {
      nodes: nodesLocal,
      edges: edgesLocal,
    };
  }, [claimId]);

  const litNodesLimit = Math.max(0, Math.min(nodes.length - 1, litCount));
  const litNodeSet = useMemo(() => {
    const outer = nodes.filter((n) => !n.isCenter);
    const lit = new Set();
    for (let i = 0; i < outer.length; i++) {
      if (i < litNodesLimit) lit.add(outer[i].id);
    }
    return lit;
  }, [nodes, litNodesLimit]);

  const findNode = (id) => nodes.find((n) => n.id === id);

  // Make the center light up once we have at least 1 lit outer node.
  const centerLit = litNodesLimit > 0;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.22)",
        background: "rgba(255,255,255,0.01)",
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 220 220"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="jurorBurstNodeGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.25" />
            <stop offset="70%" stopColor={ACCENT} stopOpacity="0.06" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </radialGradient>
          <filter id="jurorSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="110" cy="110" r="108" fill="url(#jurorBurstNodeGlow)" opacity="0.8" />

        {edges.map((e, idx) => {
          const a = findNode(e.a);
          const b = findNode(e.b);
          if (!a || !b) return null;

          const aLit = e.a === "center" ? centerLit : litNodeSet.has(e.a);
          const bLit = e.b === "center" ? centerLit : litNodeSet.has(e.b);
          const lit = aLit && bLit;

          const stroke = lit ? "rgba(181,236,52,0.75)" : "rgba(148,163,184,0.22)";
          const width = lit ? 1.35 : 0.75;
          const opacity = lit ? 0.95 : 0.6;

          return (
            <line
              key={`${e.a}-${e.b}-${idx}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={width}
              strokeLinecap="round"
              opacity={opacity}
              filter={lit ? "url(#jurorSoftGlow)" : undefined}
            />
          );
        })}

        {nodes.map((n) => {
          const lit = n.isCenter ? centerLit : litNodeSet.has(n.id);
          const r = n.isCenter ? (lit ? 5.2 : 3.2) : lit ? 3.7 : 2.3;

          return (
            <g key={n.id}>
              {lit && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r + 3.2}
                  fill="rgba(181,236,52,0.12)"
                  opacity={0.9}
                />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={lit ? ACCENT : "rgba(241,245,249,0.88)"}
                opacity={lit ? 1 : 0.85}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PipelineBackgroundNetwork({ claimId, litCount, drift }) {
  return (
    <Motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Motion.div
        animate={{ x: drift ? [0, 12, -8, 0] : 0, y: drift ? [0, -10, 6, 0] : 0 }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "min(92vw, 720px)",
          height: "min(55vh, 420px)",
          opacity: 0.14,
          filter: "blur(0.5px)",
        }}
      >
        <JurorNetworkBurst claimId={claimId} litCount={litCount} height="100%" />
      </Motion.div>
    </Motion.div>
  );
}

export function PeerReviewPreparation({
  claimId,
  description,
  onGoDashboard,
  onViewCaseProgress,
}) {
  const [view, setView] = useState("pipeline");
  const [stepIndex, setStepIndex] = useState(0);
  const [stepUiPhase, setStepUiPhase] = useState("processing");
  const [done, setDone] = useState(false);

  const cancelRef = useRef(false);
  const hasPersistedRef = useRef(false);

  const jurorCount = useMemo(() => {
    const seed = (claimId || "")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const n = 8 + (seed % 3); // 8..10
    return Math.max(8, Math.min(10, n));
  }, [claimId]);

  const anonymizedDescription = useMemo(
    () => anonymizeText(description),
    [description]
  );
  const symptoms = useMemo(() => extractSymptoms(description), [description]);

  const steps = useMemo(
    () => [
      {
        title: "Structuring case data",
        processingLine: "Structuring case data...",
        subtext:
          "Normalizing intake fields and extracting clinical context for review.",
        successMessage: "Case structured successfully",
      },
      {
        title: "Applying anonymization layer",
        processingLine: "Applying anonymization layer...",
        subtext: "Stripping identifiers while preserving medically relevant detail.",
        successMessage: "Anonymization layer applied",
      },
      {
        title: "Checking for conflicts and fairness",
        processingLine: "Checking for conflicts and fairness...",
        subtext: "Validating reviewer independence and diversity constraints.",
        successMessage: "Fairness checks passed",
      },
      {
        title: "Selecting jurors",
        processingLine: "Selecting jurors...",
        subtext: "Matching qualified peers across institutions to your case profile.",
        successMessage: "Jury pool finalized",
      },
      {
        title: "Assigning case to jury",
        processingLine: "Assigning case to jury...",
        subtext: "Distributing the anonymized packet and opening the review window.",
        successMessage: "Case assigned to jury",
      },
    ],
    []
  );

  const [litCount, setLitCount] = useState(0);

  // Per step: ~5–6s total (processing + ~800ms completion), then brief pause before next.
  const PROCESS_MS_MIN = 4200;
  const PROCESS_MS_MAX = 5200;
  const COMPLETE_MS = 800;
  const PAUSE_MS_MIN = 300;
  const PAUSE_MS_MAX = 500;

  useEffect(() => {
    cancelRef.current = false;

    async function run() {
      for (let i = 0; i < steps.length; i++) {
        if (cancelRef.current) return;
        setStepIndex(i);
        setStepUiPhase("processing");
        await sleep(randBetween(PROCESS_MS_MIN, PROCESS_MS_MAX));
        if (cancelRef.current) return;
        setStepUiPhase("complete");
        await sleep(COMPLETE_MS);
        if (cancelRef.current) return;
        if (i < steps.length - 1) {
          await sleep(randBetween(PAUSE_MS_MIN, PAUSE_MS_MAX));
        }
      }
      if (cancelRef.current) return;
      setDone(true);
      await sleep(randBetween(600, 950));
      if (cancelRef.current) return;
      setView("summary");
    }

    run();
    return () => {
      cancelRef.current = true;
    };
  }, [steps.length]);

  useEffect(() => {
    if (view !== "pipeline") return;
    if (stepIndex !== 3) {
      setLitCount(0);
      return;
    }

    setLitCount(0);
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setLitCount((prev) => (prev >= jurorCount ? prev : prev + 1));
    };

    const id = window.setInterval(tick, 460);
    const id2 = window.setTimeout(() => {
      if (cancelled) return;
      setLitCount(jurorCount);
    }, Math.max(3600, PROCESS_MS_MAX + COMPLETE_MS - 400));

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearTimeout(id2);
    };
  }, [view, stepIndex, jurorCount]);

  useEffect(() => {
    if (!done) return;
    if (hasPersistedRef.current) return;

    hasPersistedRef.current = true;
    const claimsRaw = window.localStorage.getItem(STORAGE_KEY);
    const claims = safeParse(claimsRaw) || [];
    const now = Date.now();

    const updated = claims.map((c) => {
      if (!claimId || c.id !== claimId) return c;
      return {
        ...c,
        status: "Under Jury Review",
        stage: "Jury review",
        stageDetail: "Review in progress",
        jurorCount,
        anonymizedDescription,
        anonymizedSymptoms: symptoms,
        updatedAt: now,
      };
    });

    if (claimId && !updated.some((c) => c.id === claimId)) {
      updated.unshift({
        id: claimId,
        status: "Under Jury Review",
        stage: "Jury review",
        stageDetail: "Review in progress",
        jurorCount,
        anonymizedDescription,
        anonymizedSymptoms: symptoms,
        createdAt: now,
        updatedAt: now,
      });
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
  }, [done, claimId, jurorCount, anonymizedDescription, symptoms]);

  const goDashboard = () => {
    if (typeof onGoDashboard === "function") onGoDashboard();
  };

  const goViewCaseProgress = () => {
    if (claimId) window.localStorage.setItem("cipher_focus_case_id", claimId);
    if (typeof onViewCaseProgress === "function") onViewCaseProgress();
    else goDashboard();
  };

  const progressFraction =
    (stepIndex + (stepUiPhase === "complete" ? 1 : 0.45)) / steps.length;

  const bgLit =
    view === "pipeline" && stepIndex === 3
      ? litCount
      : view === "pipeline"
        ? stepIndex > 3
          ? jurorCount
          : 0
        : jurorCount;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2400,
        background: "#03040c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`
        @keyframes peer-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes peer-pulse-ring {
          0%, 100% { transform: scale(0.92); opacity: 0.35; }
          50% { transform: scale(1.06); opacity: 0.65; }
        }
        @keyframes peer-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @media (max-width: 820px) {
          .peer-review-summary-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <AnimatePresence mode="wait">
        {view === "pipeline" && (
          <Motion.div
            key="pipeline"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
            }}
          >
            <PipelineBackgroundNetwork
              claimId={claimId}
              litCount={bgLit}
              drift
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                maxWidth: 520,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(148,163,184,0.55)",
                }}
              >
                System Processing
              </p>

              <div
                style={{
                  marginTop: 28,
                  marginBottom: 22,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Motion.div
                  initial={false}
                  animate={{
                    width: `${Math.min(100, progressFraction * 100)}%`,
                  }}
                  transition={{ duration: 1.35, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: `linear-gradient(90deg, rgba(181,236,52,0.15), ${ACCENT})`,
                    boxShadow: `0 0 24px rgba(181,236,52,0.35)`,
                  }}
                />
              </div>

              <p
                style={{
                  margin: "0 0 32px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(148,163,184,0.75)",
                }}
              >
                Step {stepIndex + 1} of {steps.length}
              </p>

              <AnimatePresence mode="wait">
                <Motion.div
                  key={`${stepIndex}-${stepUiPhase}`}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    borderRadius: 24,
                    padding: "36px 28px 40px",
                    border: "1px solid rgba(181,236,52,0.22)",
                    background:
                      "radial-gradient(120% 80% at 50% 0%, rgba(181,236,52,0.09), rgba(15,23,42,0.55))",
                    boxShadow:
                      "0 0 0 1px rgba(181,236,52,0.06) inset, 0 24px 80px rgba(0,0,0,0.45), 0 0 60px rgba(181,236,52,0.08)",
                  }}
                >
                  {stepUiPhase === "processing" ? (
                    <>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "clamp(1.35rem, 4.2vw, 1.85rem)",
                          fontWeight: 950,
                          color: "#f8fafc",
                          letterSpacing: "-0.03em",
                          lineHeight: 1.25,
                        }}
                      >
                        {steps[stepIndex].processingLine}
                      </h2>
                      <p
                        style={{
                          margin: "18px 0 0",
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: "rgba(148,163,184,0.92)",
                          maxWidth: 400,
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                      >
                        {steps[stepIndex].subtext}
                      </p>

                      <div
                        style={{
                          marginTop: 36,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 20,
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: 52,
                            height: 52,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "50%",
                              border: "2px solid rgba(181,236,52,0.2)",
                              animation: "peer-pulse-ring 1.8s ease-in-out infinite",
                            }}
                          />
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              border: `2px solid rgba(255,255,255,0.12)`,
                              borderTopColor: ACCENT,
                              animation: "peer-spin 0.95s linear infinite",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {[0, 1, 2].map((d) => (
                            <span
                              key={d}
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 999,
                                background: ACCENT,
                                animation: `peer-dot-bounce 1.1s ease-in-out ${d * 0.14}s infinite`,
                                opacity: 0.9,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          margin: "0 auto 20px",
                          borderRadius: "50%",
                          background: "rgba(181,236,52,0.12)",
                          border: `1px solid rgba(181,236,52,0.45)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 26,
                          color: ACCENT,
                          fontWeight: 950,
                          boxShadow: "0 0 40px rgba(181,236,52,0.25)",
                        }}
                      >
                        ✓
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "clamp(1.05rem, 3vw, 1.35rem)",
                          fontWeight: 850,
                          color: "#f1f5f9",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.35,
                        }}
                      >
                        {steps[stepIndex].successMessage}
                      </p>
                      <p
                        style={{
                          margin: "14px 0 0",
                          fontSize: 13,
                          color: "rgba(148,163,184,0.8)",
                          fontWeight: 600,
                        }}
                      >
                        {steps[stepIndex].title}
                      </p>
                    </>
                  )}
                </Motion.div>
              </AnimatePresence>
            </div>
          </Motion.div>
        )}

        {view === "summary" && (
          <Motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              maxWidth: 980,
              margin: "auto",
              padding: "40px 24px 48px",
            }}
          >
            <Motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{
                borderRadius: 22,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(155deg, rgba(15,23,42,0.96), rgba(8,10,22,0.94))",
                boxShadow: "0 28px 100px rgba(0,0,0,0.55)",
                overflow: "hidden",
              }}
            >
              <div
                className="peer-review-summary-grid"
                style={{
                  padding: 24,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.95fr)",
                  gap: 22,
                  alignItems: "start",
                }}
              >
                <div style={{ padding: "8px 8px 0" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: ACCENT,
                    }}
                  >
                    Peer review
                  </p>
                  <h1
                    style={{
                      margin: "12px 0 20px",
                      fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                      fontWeight: 950,
                      color: "#f8fafc",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.2,
                    }}
                  >
                    Case Ready for Review
                  </h1>

                  <div style={{ display: "grid", gap: 14 }}>
                    <div
                      style={{
                        padding: "16px 18px",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 22,
                          fontWeight: 950,
                          color: "#f1f5f9",
                        }}
                      >
                        {jurorCount} jurors selected
                      </p>
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 13,
                          color: "rgba(148,163,184,0.9)",
                          lineHeight: 1.5,
                        }}
                      >
                        Independent reviewers are matched to your anonymized case.
                      </p>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 16px",
                        borderRadius: 999,
                        border: "1px solid rgba(181,236,52,0.35)",
                        background: "rgba(181,236,52,0.08)",
                        width: "fit-content",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: ACCENT,
                          boxShadow: "0 0 20px rgba(181,236,52,0.45)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(241,245,249,0.95)",
                        }}
                      >
                        Under Jury Review
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 28 }}>
                    <button
                      type="button"
                      onClick={goViewCaseProgress}
                      style={{
                        padding: "15px 26px",
                        borderRadius: 999,
                        border: "1px solid rgba(181,236,52,0.55)",
                        background: "rgba(181,236,52,0.95)",
                        color: "#050505",
                        fontSize: 12,
                        fontWeight: 950,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      View Case Progress
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    padding: 18,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: "0.20em",
                        textTransform: "uppercase",
                        color: "rgba(148,163,184,0.9)",
                      }}
                    >
                      Anonymized Case View
                    </p>
                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.02)",
                        fontSize: 12,
                        fontWeight: 900,
                        color: "rgba(148,163,184,0.9)",
                      }}
                    >
                      Clean
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.01)",
                      padding: 14,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(148,163,184,0.9)",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Description
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: "rgba(241,245,249,0.95)",
                      }}
                    >
                      {anonymizedDescription}
                    </p>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "rgba(148,163,184,0.9)",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Symptoms
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 13,
                          color: "rgba(241,245,249,0.92)",
                          lineHeight: 1.6,
                        }}
                      >
                        {symptoms.length ? symptoms.join(", ") : "—"}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "rgba(148,163,184,0.9)",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Personal identity
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 13,
                          color: "rgba(241,245,249,0.92)",
                          lineHeight: 1.6,
                        }}
                      >
                        Removed (anonymization applied)
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <JurorNetworkBurst claimId={claimId} litCount={jurorCount} />
                  </div>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

