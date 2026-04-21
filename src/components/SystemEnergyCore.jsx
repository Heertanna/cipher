import React, { useRef, useState, useMemo } from "react";
import { motion as Motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ACCENT } from "./OnboardingCommon.jsx";

const MOCK = {
  healthPercent: 72,
  activeClaims: 38,
  totalFunds: "₹12.4M",
  reserveBalance: "₹3.1M",
  recentChange: "+2.1%",
  updatedAgo: "4 min ago",
  interpretation: "Pool health determines contribution adjustments",
  personalImpact: "Your contribution supports active pool coverage",
};

function getStatus(health) {
  if (health < 40) return "Critical";
  if (health < 70) return "Watch";
  return "Stable";
}

function statusColor(status) {
  if (status === "Critical") return "#f87171";
  if (status === "Watch") return "#facc15";
  return "#bbf7d0";
}

function EnergySphere({ health }) {
  const status = getStatus(health);

  const { minLen, maxLen, speed } = useMemo(() => {
    if (status === "Critical") return { minLen: 0.5, maxLen: 1.25, speed: 1.8 };
    if (status === "Watch") return { minLen: 0.6, maxLen: 1.1, speed: 1.2 };
    return { minLen: 0.7, maxLen: 1.0, speed: 0.7 };
  }, [status]);

  const linesRef = useRef(null);
  const tipsRef = useRef(null);

  // Precompute radial directions on a sphere using golden spiral
  const dirs = useMemo(() => {
    const count = 220;
    const out = [];
    for (let i = 0; i < count; i++) {
      const y = (2 * i) / count - 1 + 1 / count;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * (Math.PI * (3 - Math.sqrt(5)));
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      const v = new THREE.Vector3(x, y, z).normalize();
      out.push(v);
    }
    return out;
  }, []);

  const linePositions = useMemo(() => {
    const arr = new Float32Array(dirs.length * 2 * 3); // start+end per line
    return arr;
  }, [dirs.length]);

  const tipPositions = useMemo(
    () => new Float32Array(dirs.length * 3),
    [dirs.length]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    const lines = linesRef.current;
    const tips = tipsRef.current;
    if (!lines || !tips) return;

    const lp = lines.geometry.attributes.position.array;
    const tp = tips.geometry.attributes.position.array;

    const lenRange = maxLen - minLen;

    for (let i = 0; i < dirs.length; i++) {
      const d = dirs[i];
      const phase =
        Math.sin(d.x * 3.1 + t * 0.7) +
        Math.sin(d.y * 4.3 - t * 0.45) +
        Math.sin(d.z * 5.2 + t * 0.35);
      const n = (phase / 3 + 1) * 0.5; // 0..1
      const len = minLen + lenRange * n;

      const endX = d.x * len;
      const endY = d.y * len;
      const endZ = d.z * len;

      const li = i * 6;
      lp[li] = 0;
      lp[li + 1] = 0;
      lp[li + 2] = 0;
      lp[li + 3] = endX;
      lp[li + 4] = endY;
      lp[li + 5] = endZ;

      const ti = i * 3;
      tp[ti] = endX;
      tp[ti + 1] = endY;
      tp[ti + 2] = endZ;
    }

    lines.geometry.attributes.position.needsUpdate = true;
    tips.geometry.attributes.position.needsUpdate = true;
  });

  const col = statusColor(status);

  return (
    <group>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={col}
          transparent
          opacity={0.4}
          linewidth={1}
        />
      </lineSegments>
      <points ref={tipsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[tipPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={col}
          size={0.06}
          sizeAttenuation
          depthWrite={false}
          transparent
          opacity={0.95}
        />
      </points>
    </group>
  );
}

export function SystemEnergyCore() {
  const [focusMode, setFocusMode] = useState(false);
  const health = MOCK.healthPercent;
  const status = getStatus(health);
  const color = statusColor(status);
  const trendDirUp = MOCK.recentChange.trim().startsWith("+");
  const infoCardStyle = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.7)",
    background: "rgba(15,23,42,0.75)",
    backdropFilter: "blur(10px)",
  };

  return (
    <Motion.div
      onClick={() => setFocusMode((v) => !v)}
      animate={{ scale: focusMode ? 1.07 : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        margin: "32px 0 16px",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(1100px, 100%)",
          height: "min(740px, 78vh)",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          <ambientLight intensity={0.45} color="#a5f3fc" />
          <directionalLight
            intensity={0.9}
            color={color}
            position={[2, 3, 3]}
          />
          <directionalLight
            intensity={0.6}
            color="#0f172a"
            position={[-3, -4, -2]}
          />
          <group rotation={[0.4, 0.3, 0]}>
            <EnergySphere health={health} />
          </group>
        </Canvas>

        {/* overlay text + hover stats */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#f9fafb",
              textShadow: "0 0 18px rgba(15,23,42,0.9)",
            }}
          >
            {health}%
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color,
            }}
          >
            {status}
          </span>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            padding: "22px 26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <StatPill label="Active claims" value={String(MOCK.activeClaims)} />
            <StatPill label="Reserve" value={MOCK.reserveBalance} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "end",
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(148,163,184,0.96)" }}>
              <div style={infoCardStyle}>
                <p style={{ margin: 0 }}>{MOCK.interpretation}</p>
                <p style={{ margin: "4px 0 0", color: "rgba(226,232,240,0.96)" }}>
                  {MOCK.personalImpact}
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 11,
                    color: "rgba(148,163,184,0.96)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Updated {MOCK.updatedAgo}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.7)",
                  background: "rgba(15,23,42,0.75)",
                  backdropFilter: "blur(10px)",
                  color: "rgba(226,232,240,0.96)",
                  fontSize: 12,
                  fontWeight: 650,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Pool change:{" "}
                <span style={{ color: trendDirUp ? "#bbf7d0" : "#f87171" }}>
                  {MOCK.recentChange}
                </span>
              </div>
            </div>
          </div>
        </Motion.div>

        {focusMode && (
          <Motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 18,
              bottom: 18,
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.45)",
              background: "rgba(15,23,42,0.78)",
              backdropFilter: "blur(12px)",
              color: "rgba(226,232,240,0.96)",
              pointerEvents: "none",
              maxWidth: 420,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Focus Mode
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.5, color: "rgba(148,163,184,0.95)" }}>
              Expanding into a detailed system view (coming soon).
            </p>
          </Motion.div>
        )}
      </div>
    </Motion.div>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.7)",
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(12px)",
        color: "#e5e7eb",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

