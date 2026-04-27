import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { PoolHeartbeat } from "./components/PoolHeartbeat.jsx";
import { Rulebook } from "./components/Rulebook.jsx";
import { JoinNetwork } from "./components/JoinNetwork.jsx";
import { HealthProfile } from "./components/HealthProfile.jsx";
import { DocumentSubmit } from "./components/DocumentSubmit.jsx";
import { TermsConditions } from "./components/TermsConditions.jsx";
import { PricingPlans } from "./components/PricingPlans.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { PaymentPage } from "./components/PaymentPage.jsx";
import { ProtocolDashboard } from "./components/ProtocolDashboard.jsx";
import { ClaimIntake } from "./components/ClaimIntake.jsx";
import { EmergencyAccess } from "./components/EmergencyAccess.jsx";
import { HospitalView } from "./components/HospitalView.jsx";
import { JurorDashboard } from "./components/JurorDashboard.jsx";
import { CaseReview } from "./components/CaseReview.jsx";
import { VerdictScreen } from "./components/VerdictScreen.jsx";
import { ReEvaluationFlow } from "./components/ReEvaluationFlow.jsx";
import { JurorApplication } from "./components/JurorApplication.jsx";
import { GovernancePanel } from "./components/GovernancePanel.jsx";
import { CaseProgress } from "./components/CaseProgress.jsx";
import { HeroSection } from "./components/HeroSection.jsx";
import { IntroAnimation } from "./components/IntroAnimation";
import { initializeMockJuryCases } from "./data/jurorMockData.js";
import cipherLogo from "./assets/cipher-logo.png";

/* ───────────────────────────────────────────
   Quadrant pixel-grid canvas
   Self-contained: fills its parent, seeds &
   grows blocks, loops.
   ─────────────────────────────────────────── */
function QuadrantCanvas({ density = 8 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    const CELL = 22;
    const AR = 181, AG = 236, AB = 52;
    let cols, rows, alphas, targets;

    function cluster(ox, oy, n) {
      const out = [];
      let cx = ox, cy = oy;
      for (let i = 0; i < n; i++) {
        out.push([cy, cx]);
        const d = Math.floor(Math.random() * 4);
        if (d === 0) cx++;
        else if (d === 1) cx--;
        else if (d === 2) cy++;
        else cy--;
      }
      return out;
    }

    function crossCells(cx, cy, arm, t) {
      const out = [];
      const h = Math.floor(t / 2);
      for (let r = -arm; r <= arm; r++)
        for (let c = -h; c <= h; c++) out.push([cy + r, cx + c]);
      for (let c = -arm; c <= arm; c++)
        for (let r = -h; r <= h; r++) out.push([cy + r, cx + c]);
      return out;
    }

    function lBlock(ox, oy, len, dir) {
      const out = [];
      for (let i = 0; i < len; i++)
        out.push(dir === 0 ? [oy + i, ox] : [oy, ox + i]);
      const last = out[out.length - 1];
      for (let i = 1; i <= Math.ceil(len * 0.5); i++)
        out.push(dir === 0 ? [last[0], last[1] + i] : [last[0] + i, last[1]]);
      return out;
    }

    function place(cells) {
      cells.forEach(([r, c]) => {
        if (r >= 0 && r < rows && c >= 0 && c < cols) targets[r][c] = 1;
      });
    }

    function seed() {
      place(crossCells(
        Math.floor(cols * 0.5),
        Math.floor(rows * 0.45),
        3, 3
      ));
      for (let i = 0; i < density; i++) {
        place(cluster(
          Math.floor(Math.random() * cols * 0.8 + cols * 0.1),
          Math.floor(Math.random() * rows * 0.8 + rows * 0.1),
          5 + Math.floor(Math.random() * 8)
        ));
      }
      place(lBlock(Math.floor(cols * 0.3), Math.floor(rows * 0.3), 4, 0));
      place(lBlock(Math.floor(cols * 0.65), Math.floor(rows * 0.6), 4, 1));
    }

    function reset() {
      alphas = Array.from({ length: rows }, () => new Float32Array(cols));
      targets = Array.from({ length: rows }, () => new Uint8Array(cols));
    }

    function setup() {
      const pw = parent.offsetWidth;
      const ph = parent.offsetHeight;
      if (pw === 0 || ph === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = pw * dpr;
      canvas.height = ph * dpr;
      canvas.style.width = pw + "px";
      canvas.style.height = ph + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(pw / CELL) + 1;
      rows = Math.ceil(ph / CELL) + 1;
      reset();
      seed();
    }

    setup();
    window.addEventListener("resize", setup);

    let tick = 0;
    const GROW = 800, FADE = 280, CYCLE = GROW + FADE;
    let frameId;

    function draw() {
      const pw = parent.offsetWidth;
      const ph = parent.offsetHeight;
      ctx.clearRect(0, 0, pw, ph);

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, ph);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(pw, r * CELL);
        ctx.stroke();
      }

      tick++;
      const ct = tick % CYCLE;

      if (ct < GROW && ct % 55 === 0) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (targets[r][c] === 1) {
              for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && targets[nr][nc] === 0 && Math.random() < 0.06)
                  targets[nr][nc] = 1;
              }
              if (Math.random() < 0.018) targets[r][c] = 0;
            }
          }
        }
      }

      if (ct >= GROW) {
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) targets[r][c] = 0;
      }

      if (ct === 0 && tick > 0) { reset(); seed(); }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (targets[r][c] === 1 && alphas[r][c] < 1)
            alphas[r][c] = Math.min(1, alphas[r][c] + 0.02);
          else if (targets[r][c] === 0 && alphas[r][c] > 0)
            alphas[r][c] = Math.max(0, alphas[r][c] - 0.014);

          const a = alphas[r][c];
          if (a > 0.01) {
            ctx.fillStyle = `rgba(${AR},${AG},${AB},${(a * 0.8).toFixed(3)})`;
            const g = 2;
            ctx.fillRect(c * CELL + g, r * CELL + g, CELL - g * 2, CELL - g * 2);
          }
        }
      }

      frameId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", setup);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}

/* ───────────────────────────────────────────
   Hero — diagonal composition
   TL: heading  |  TR: animation
   BL: animation |  BR: subheading
   Center: CTA buttons
   ─────────────────────────────────────────── */
function Hero({ onJoin }) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "transparent",
        color: "#f1f5f9",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* nav */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          borderBottom: "1px solid rgba(181,236,52,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src={cipherLogo} alt="Cipher" style={{ width: 24, height: 24 }} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b5ec34" }}>
            Cipher
          </span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 14, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          <span style={{ color: "rgba(181,236,52,0.7)", cursor: "pointer" }}>Protocol</span>
          <span style={{ color: "rgba(181,236,52,0.7)", cursor: "pointer" }}>How it Works</span>
          <span style={{ color: "rgba(181,236,52,0.7)", cursor: "pointer" }}>Governance</span>
          <span onClick={onJoin} style={{ color: "#050505", background: "#b5ec34", padding: "6px 16px", borderRadius: 4, fontWeight: 600, cursor: "pointer" }}>
            Log in
          </span>
        </div>
      </nav>

      {/* 2 × 2 diagonal grid */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          position: "relative",
        }}
      >
        {/* ── Q1  top-left: HEADING ── */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "clamp(32px, 5vh, 64px) clamp(32px, 4vw, 64px)",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.8rem, 6vw, 6.5rem)",
              fontWeight: 800,
              lineHeight: 0.95,
              color: "#b5ec34",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              margin: 0,
              maxWidth: "100%",
            }}
          >
            Rebuilding
            <br />
            trust in
            <br />
            healthcare.
          </h1>
        </div>

        {/* ── Q2  top-right: ANIMATION ── */}
        <div style={{ position: "relative", overflow: "hidden", paddingBottom: 30 }}>
          <QuadrantCanvas density={7} />
        </div>

        {/* ── Q3  bottom-left: ANIMATION ── */}
        <div style={{ position: "relative", overflow: "hidden", paddingTop: 30 }}>
          <QuadrantCanvas density={7} />
        </div>

        {/* ── Q4  bottom-right: SUBHEADING ── */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "clamp(32px, 5vh, 64px) clamp(32px, 4vw, 64px)",
          }}
        >
          <p
            style={{
              fontSize: 20,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.03em",
              marginBottom: 28,
              textAlign: "right",
              maxWidth: 480,
            }}
          >
            A decentralized care protocol where communities pool funds,
            evaluate medical claims together, and keep every payout transparent.
            Members contribute to a shared medical treasury, automated triage
            handles routine claims, and peer juries review complex cases.
          </p>
        </div>

        {/* ── CENTER: CTA BUTTONS (overlay) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "4vh",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", gap: 12, pointerEvents: "auto" }}>
            <button
              onClick={onJoin}
              style={{
                padding: "14px 32px",
                border: "1px solid #b5ec34",
                borderRadius: 6,
                background: "transparent",
                color: "#b5ec34",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Join the Network
            </button>
            <button
              style={{
                padding: "14px 32px",
                border: "1px solid rgba(181,236,52,0.4)",
                borderRadius: 6,
                background: "transparent",
                color: "rgba(181,236,52,0.7)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Explore the Protocol
            </button>
          </div>
        </div>
      </div>

      {/* bottom cards strip */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          maxWidth: 1500,
          width: "94%",
          margin: "0 auto",
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            borderTop: "1px solid rgba(181,236,52,0.25)",
          }}
        >
          {[
            { title: "Shared Risk Pool", desc: "Members contribute to a community treasury that funds medical treatments collectively." },
            { title: "Peer Jury Review", desc: "Complex medical claims are evaluated by randomly selected medical professionals and experts." },
            { title: "Transparent Payouts", desc: "Every decision and payment is recorded on-chain to ensure accountability and transparency." },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                padding: "28px 32px",
                borderRight: i < 2 ? "1px solid rgba(181,236,52,0.15)" : "none",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b5ec34", marginBottom: 10 }}>
                {card.title}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(181,236,52,0.45)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProtocolDashboardRoute() {
  const navigate = useNavigate();
  return (
    <ProtocolDashboard
      onHome={() => {
        navigate("/");
        window.scrollTo(0, 0);
      }}
      onStartClaim={() => {
        navigate("/claim-intake");
        window.scrollTo(0, 0);
      }}
      onStartEmergency={() => {
        navigate("/emergency-access");
        window.scrollTo(0, 0);
      }}
    />
  );
}

function ClaimIntakeRoute() {
  const navigate = useNavigate();
  return (
    <ClaimIntake
      onBack={() => {
        navigate("/protocol-dashboard");
        window.scrollTo(0, 0);
      }}
      onDone={() => {
        navigate("/protocol-dashboard");
        window.scrollTo(0, 0);
      }}
      onViewCaseProgress={(claim) => {
        navigate("/case-progress", { state: { claim } });
        window.scrollTo(0, 0);
      }}
    />
  );
}

function EmergencyAccessRoute() {
  const navigate = useNavigate();
  return (
    <EmergencyAccess
      onBack={() => {
        navigate("/protocol-dashboard");
        window.scrollTo(0, 0);
      }}
      onDone={() => {
        navigate("/protocol-dashboard");
        window.scrollTo(0, 0);
      }}
    />
  );
}

function PageFlow({ initialPage = "home", blockLandingContent = false }) {
  const [page, setPage] = useState(initialPage);
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const navigate = useNavigate();

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    const subscriptionKey = "cipher_subscription";
    const safeParse = (raw) => {
      try {
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    const sub = safeParse(window.localStorage.getItem(subscriptionKey));
    if (!sub || sub.status !== "active" || !sub.lastPaidAt) return;
    const now = Date.now();
    const lastPaidAt = Number(sub.lastPaidAt);
    if (!Number.isFinite(lastPaidAt)) return;
    const msPerMonth = 1000 * 60 * 60 * 24 * 30.4375;
    const monthsMissed = Math.max(0, now - lastPaidAt) / msPerMonth;
    if (monthsMissed > 2) {
      window.localStorage.setItem(
        subscriptionKey,
        JSON.stringify({
          ...sub,
          status: "removed",
          removedAt: now,
        })
      );
    }
  }, []);

  if (page === "join") {
    return (
      <JoinNetwork
        onContinue={() => {
          setPage("health");
          window.scrollTo(0, 0);
        }}
        onBack={() => {
          setPage("home");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (page === "health") {
    return (
      <HealthProfile
        onBack={() => {
          setPage("join");
          window.scrollTo(0, 0);
        }}
        onContinue={() => {
          setPage("documents");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (page === "documents") {
    return (
      <DocumentSubmit
        onBack={() => {
          setPage("health");
          window.scrollTo(0, 0);
        }}
        onContinue={() => {
          setPage("dashboard");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (page === "dashboard") {
    return (
      <Dashboard
        onHome={() => {
          setPage("home");
          window.scrollTo(0, 0);
        }}
        onNext={() => {
          setPage("terms");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (page === "terms") {
    return (
      <TermsConditions
        onBack={() => {
          setPage("dashboard");
          window.scrollTo(0, 0);
        }}
        onContinue={() => {
          setPage("pricing");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (page === "pricing") {
    return (
      <PricingPlans
        selectedPlanId={selectedPlan}
        onBack={() => {
          setPage("terms");
          window.scrollTo(0, 0);
        }}
        onFinish={() => {
          setPage("payment");
          window.scrollTo(0, 0);
        }}
        onSelectPlan={(planId) => {
          setSelectedPlan(planId);
        }}
      />
    );
  }

  if (page === "payment") {
    return (
      <PaymentPage
        planId={selectedPlan}
        onBack={() => {
          setPage("pricing");
          window.scrollTo(0, 0);
        }}
        onDone={() => {
          navigate("/protocol-dashboard", {
            state: {
              welcomeMessage: "Welcome to Care Protocol. Your identity has been created.",
            },
          });
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (blockLandingContent) {
    return null;
  }

  return (
    <>
      <HeroSection onJoin={() => { setPage("join"); window.scrollTo(0, 0); }} />
      <PoolHeartbeat />
      <Rulebook />
    </>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(
    () => {
      const path = window.location.pathname;
      return path === '/' || path === '/cipher/' || path === '/cipher';
    }
  );
  useEffect(() => {
    initializeMockJuryCases().catch((error) => {
      console.error("Failed to initialize mock jury cases:", error?.message);
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "transparent",
      }}
    >
      {showIntro && (
        <IntroAnimation
          onComplete={() => setShowIntro(false)}
        />
      )}
      <Routes>
        <Route path="/join" element={<PageFlow initialPage="join" />} />
        <Route path="/juror-dashboard" element={<JurorDashboard />} />
        <Route path="/verdict/:juryCaseId" element={<VerdictScreen />} />
        <Route path="/re-evaluation/:juryCaseId" element={<ReEvaluationFlow />} />
        <Route path="/juror-application" element={<JurorApplication />} />
        <Route path="/case-review/:caseId" element={<CaseReview />} />
        <Route path="/governance" element={<GovernancePanel />} />
        <Route path="/case-progress" element={<CaseProgress />} />
        <Route path="/protocol-dashboard" element={<ProtocolDashboardRoute />} />
        <Route path="/claim-intake" element={<ClaimIntakeRoute />} />
        <Route path="/emergency-access" element={<EmergencyAccessRoute />} />
        <Route path="/hospital-view" element={<HospitalView />} />
        <Route path="*" element={<PageFlow blockLandingContent={showIntro} />} />
      </Routes>
    </div>
  );
}

export default App;
