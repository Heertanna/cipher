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
        <div style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <img src="data:image/png;base64,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wtNUnZq+1j8N8QHn8svLi//mAgC40CEBAHAxYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIASJcTpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAAGEKACBAmAIACBCmAAAChCkAgABhCgAgQJgCAAgQpgAAAoQpAIAAYQoAIECYAgAIEKYAAAKEKQCAgP8Pv0UzTT7HSvQAAAAASUVORK5CYII=" alt="Cipher" style={{ width: 24, height: 24, display: "block" }} />
          <span
            style={{
              color: ACCENT,
              fontSize: 14,
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
            fontSize: 14,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {["Protocol", "How It Works", "Governance"].map((item) => (
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
            fontSize: 14,
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
            fontSize: 14,
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
              fontSize: 14,
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
              fontSize: 14,
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
          fontSize: 14,
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
