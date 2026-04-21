import React, { useEffect, useRef } from "react";

const ACCENT = "#b5ec34";
export function HeroSection({ onJoin }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    let frameId = 0;
    let time = 0;
    let pulseTimer = 0;
    const particles = [];
    const pulseRings = [];
    let helix = null;

    const setSize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      particles.length = 0;
      pulseRings.length = 0;

      const W = width;
      const H = height;
      const x0 = W * 1.0, y0 = -H * 0.05;
      const x1 = W * 0.0, y1 = H * 1.05;
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
      const STEPS = 200, AMP = 110;

      helix = { x0, y0, x1, y1, dx, dy, len, ux, uy, nx, ny, STEPS, AMP };

      const strandCenterStatic = (strand, fr) => {
        const fcX = x0 + ux * len * fr;
        const fcY = y0 + uy * len * fr;
        const ra = fr * Math.PI * 5.5;
        const a = strand === 1 ? ra : ra + Math.PI;
        return {
          x: fcX + nx * Math.cos(a) * AMP,
          y: fcY + ny * Math.cos(a) * AMP,
        };
      };

      const strandPerpStatic = (strand, i) => {
        const fr = i / STEPS;
        const dFr = 1 / STEPS;
        let p0;
        let p1;
        if (i < STEPS) {
          p0 = strandCenterStatic(strand, fr);
          p1 = strandCenterStatic(strand, fr + dFr);
        } else {
          p0 = strandCenterStatic(strand, fr - dFr);
          p1 = strandCenterStatic(strand, fr);
        }
        const tx = p1.x - p0.x;
        const ty = p1.y - p0.y;
        const tlen = Math.hypot(tx, ty) || 1;
        return { px: -ty / tlen, py: tx / tlen };
      };

      const layerSpreadAndR = () => {
        const u = Math.random();
        if (u < 0.5) {
          return { dist: 3 + Math.random() * 7, r: 1.4 + Math.random() * 2.2 };
        }
        if (u < 0.8) {
          return { dist: 10 + Math.random() * 15, r: 0.65 + Math.random() * 1.15 };
        }
        return { dist: 25 + Math.random() * 25, r: 0.25 + Math.random() * 0.75 };
      };

      const pushStrandStep = (strand, i) => {
        const frac = i / STEPS;
        const { px, py } = strandPerpStatic(strand, i);
        const c = strandCenterStatic(strand, frac);
        const z =
          strand === 1
            ? Math.sin(frac * Math.PI * 5.5)
            : Math.sin(frac * Math.PI * 5.5 + Math.PI);
        const n = 10 + Math.floor(Math.random() * 3);
        for (let j = 0; j < n; j += 1) {
          const { dist, r: pr } = layerSpreadAndR();
          const sign = Math.random() < 0.5 ? -1 : 1;
          const off = sign * dist;
          particles.push({
            x: c.x + px * off,
            y: c.y + py * off,
            bx: c.x + px * off,
            by: c.y + py * off,
            frac,
            off,
            vx: 0,
            vy: 0,
            phase: Math.random() * Math.PI * 2,
            r: pr,
            strand,
            z,
          });
        }
      };

      for (let i = 0; i <= STEPS; i += 1) {
        pushStrandStep(1, i);
        pushStrandStep(2, i);
      }
    };

    const step = () => {
      const W = width;
      const H = height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#060810";
      ctx.fillRect(0, 0, W, H);

      const gridSize = 60;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      time += 0.005;
      pulseTimer += 1;
      if (pulseTimer >= 180) {
        pulseTimer = 0;
        pulseRings.push({ r: 8, alpha: 1 });
      }

      const { x0, y0, len, ux, uy, nx, ny, STEPS, AMP } = helix;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const fracCX = x0 + ux * len * p.frac;
        const fracCY = y0 + uy * len * p.frac;
        const rotAngle = p.frac * Math.PI * 5.5 + time * 0.32;
        const dFr = 1 / STEPS;
        const fr = p.frac;

        if (p.strand === 1 || p.strand === 2) {
          const a = p.strand === 1 ? rotAngle : rotAngle + Math.PI;
          const cx = fracCX + nx * Math.cos(a) * AMP;
          const cy = fracCY + ny * Math.cos(a) * AMP;
          let p0x;
          let p0y;
          let p1x;
          let p1y;
          if (fr < 1 - 1e-9) {
            const frN = Math.min(fr + dFr, 1);
            const fNX = x0 + ux * len * frN;
            const fNY = y0 + uy * len * frN;
            const rN = frN * Math.PI * 5.5 + time * 0.32;
            const aN = p.strand === 1 ? rN : rN + Math.PI;
            p0x = cx;
            p0y = cy;
            p1x = fNX + nx * Math.cos(aN) * AMP;
            p1y = fNY + ny * Math.cos(aN) * AMP;
          } else {
            const frP = fr - dFr;
            const fPX = x0 + ux * len * frP;
            const fPY = y0 + uy * len * frP;
            const rP = frP * Math.PI * 5.5 + time * 0.32;
            const aP = p.strand === 1 ? rP : rP + Math.PI;
            p0x = fPX + nx * Math.cos(aP) * AMP;
            p0y = fPY + ny * Math.cos(aP) * AMP;
            p1x = cx;
            p1y = cy;
          }
          const tx = p1x - p0x;
          const ty = p1y - p0y;
          const tlen = Math.hypot(tx, ty) || 1;
          const px = -ty / tlen;
          const py = tx / tlen;
          p.bx = cx + px * p.off;
          p.by = cy + py * p.off;
          p.z = p.strand === 1 ? Math.sin(rotAngle) : Math.sin(rotAngle + Math.PI);
        }

        const md = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        if (mouse.active && md < 95) {
          const dist = Math.max(md, 0.0001);
          p.vx -= ((mouse.x - p.x) / dist) * 0.5;
          p.vy -= ((mouse.y - p.y) / dist) * 0.5;
        }

        const k = p.strand === 1 || p.strand === 2 ? 0.14 : 0.055;
        const damp = p.strand === 1 || p.strand === 2 ? 0.89 : 0.85;
        p.vx += (p.bx - p.x) * k;
        p.vy += (p.by - p.y) * k;
        p.vx *= damp;
        p.vy *= damp;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -200) p.x = -200;
        if (p.x > W + 200) p.x = W + 200;
        if (p.y < -200) p.y = -200;
        if (p.y > H + 200) p.y = H + 200;
      }

      pulseRings.forEach((ring) => {
        ring.r += 1.2;
        ring.alpha *= 0.977;
      });
      for (let i = pulseRings.length - 1; i >= 0; i -= 1) {
        const ring = pulseRings[i];
        if (ring.alpha < 0.01 || ring.r > 320) {
          pulseRings.splice(i, 1);
        }
      }

      pulseRings.forEach((ring) => {
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(181,236,52,${ring.alpha * 0.28})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      const byStrand = [[], []];
      for (let pi = 0; pi < particles.length; pi += 1) {
        const p = particles[pi];
        if (p.strand === 1 || p.strand === 2) byStrand[p.strand - 1].push(p);
      }
      const sortAlongHelix = (a, b) => a.frac - b.frac;
      for (let s = 0; s < 2; s += 1) {
        const pts = byStrand[s];
        pts.sort(sortAlongHelix);
        const win = 14;
        for (let i = 0; i < pts.length; i += 3) {
          const a = pts[i];
          for (let j = i + 1; j < Math.min(i + win, pts.length); j += 1) {
            const b = pts[j];
            if (Math.abs(a.frac - b.frac) > 0.06) break;
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d > 30) continue;
            const da = (a.z + 1) / 2;
            const db = (b.z + 1) / 2;
            const dep = (da + db) * 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(181,236,52,${0.1 * dep})`;
            ctx.lineWidth = 0.45;
            ctx.stroke();
          }
        }
      }

      const sorted = [...particles].sort((a, b) => a.z - b.z);
      sorted.forEach((p) => {
        const depth = Math.max(0, Math.min(1, (p.z + 1) / 2));
        const mouseDist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        const hover = Math.max(0, 1 - mouseDist / 95);
        const sizeMul = 0.3 + depth * 1.0;
        const baseAlpha = 1;
        const alpha = baseAlpha * (0.2 + depth * 0.8);
        const rawSz = p.r * sizeMul * (1 + hover * 0.35);
        const sz = Math.max(0.2, rawSz);

        let fill;
        if (p.strand === 1) fill = `rgba(181,236,52,${alpha})`;
        else fill = `rgba(255,255,255,${alpha})`;

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(step);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const onResize = () => {
      setSize();
      initParticles();
    };

    onResize();
    frameId = window.requestAnimationFrame(step);

    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        minHeight: 600,
        background: "transparent",
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          display: "block",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 2,
          width: "100%",
          padding: "20px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <img
            src="/cipher-logo.png"
            alt="Cipher"
            style={{ width: 24, height: 24, display: "block", objectFit: "contain" }}
          />
          <span
            style={{
              color: ACCENT,
              fontSize: 13,
              letterSpacing: "0.16em",
              fontWeight: 800,
            }}
          >
            CIPHER
          </span>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 26,
            color: "rgba(255,255,255,0.62)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {["Protocol", "How It Works", "Governance", "Documentation"].map((item) => (
            <button
              key={item}
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: 0,
                font: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                cursor: "pointer",
                transition: "color 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.62)";
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onJoin}
          style={{
            border: "1px solid rgba(181,236,52,0.65)",
            background: "rgba(2,6,12,0.85)",
            color: "rgba(255,255,255,0.96)",
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "10px 16px",
            borderRadius: 20,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Log in
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          zIndex: 2,
          top: 100,
          left: 0,
          paddingLeft: 60,
          maxWidth: 700,
          width: "auto",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
          }}
        >
          Community Health Network
        </p>
        <h1
          style={{
            margin: "12px 0 0 0",
            maxWidth: 700,
            width: "auto",
            color: "#ffffff",
            fontSize: "clamp(2.5rem, 4.5vw, 3.8rem)",
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>Rebuilding Trust in</span>
          <br />
          <span style={{ color: ACCENT }}>Healthcare.</span>
        </h1>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onJoin}
            style={{
              background: ACCENT,
              color: "#000000",
              border: "none",
              borderRadius: 999,
              padding: "11px 16px",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Join the Network
          </button>
          <button
            type="button"
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              padding: "11px 16px",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Explore
          </button>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          zIndex: 2,
          right: 60,
          bottom: 120,
          textAlign: "left",
          maxWidth: 450,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.6)",
            fontSize: 17,
            lineHeight: 1.9,
            letterSpacing: "0.02em",
          }}
        >
          A decentralized care protocol where communities pool funds, evaluate medical claims
          together, and keep every payout transparent.
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          zIndex: 2,
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.18)",
          fontSize: 9,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Move · Hover · Click to interact
      </div>
    </section>
  );
}
