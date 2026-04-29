import React, { useState, useEffect, useCallback, useRef } from "react";
import { ACCENT, FaintBackground } from "./OnboardingCommon";
import { createIdentity } from "../lib/api.js";
import { getSession, saveSession } from "../lib/session.js";
import { PROTOCOL_DASHBOARD_CARD } from "../lib/protocolPageBackground.js";

const inputBase = {
  width: "100%",
  padding: "14px 16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#f1f5f9",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  boxSizing: "border-box",
};

const inputFocus = {
  borderColor: "rgba(181,236,52,0.5)",
  boxShadow: `0 0 0 2px rgba(181,236,52,0.1), 0 0 20px rgba(181,236,52,0.06)`,
};

function StyledInput({ placeholder, value, onChange, type = "text", autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase,
        ...(focused ? inputFocus : {}),
      }}
    />
  );
}

export function JoinNetwork({ onBack, onContinue }) {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState(false);
  const [showIdentityChoice, setShowIdentityChoice] = useState(true);
  const [showAliasForm, setShowAliasForm] = useState(false);
  const [showMarkStep, setShowMarkStep] = useState(false);
  const [showMarkIntro, setShowMarkIntro] = useState(true);
  const [identityType, setIdentityType] = useState(null);
  const [markLocked, setMarkLocked] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [markPointCount, setMarkPointCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [currentGesture, setCurrentGesture] = useState("palm");
  const [, setAnonymousId] = useState(null);
  const artCanvasRef = useRef(null);
  const miniCanvasRef = useRef(null);
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const lastHandPos = useRef(null);
  const prevHandXRef = useRef(0.5);
  const prevHandYRef = useRef(0.5);
  const handActivityRef = useRef(0);
  const globalRotationRef = useRef(0);
  const prevHandAngleRef = useRef(null);
  const handRotationVelRef = useRef(0);
  const canvasDensityRef = useRef(0);
  const pathRef = useRef([]);
  const seedRef = useRef(0);
  const complexityRef = useRef(0);
  const energyRef = useRef(0);
  const tRef = useRef(0);
  const gestureRef = useRef("palm");
  const smoothXRef = useRef(0.5);
  const smoothYRef = useRef(0.5);
  const peaceAngleRef = useRef(0);
  const threePhaseRef = useRef(0);
  const pinchSizeRef = useRef(0);
  const pointTrailRef = useRef([]);
  const fistCrystalsRef = useRef([]);
  const permanentStateRef = useRef({
    noiseScale: 1.0,
    radius: 100,
    amplitude: 200,
  });
  const animRef = useRef(null);
  const lockedRef = useRef(false);
  const markCardShell = {
    ...PROTOCOL_DASHBOARD_CARD,
    background:
      "linear-gradient(135deg, rgba(181,236,52,0.05) 0%, rgba(8,11,18,0.9) 42%, rgba(8,11,18,0.98) 100%)",
  };

  const persistAlias = useCallback((nextAlias, markCreated) => {
    try {
      window.localStorage.setItem(
        "cipher_identity",
        JSON.stringify({
          alias: nextAlias.trim(),
          created: markCreated,
        }),
      );
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cipher_identity");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.alias) setAlias(parsed.alias);
      if (parsed.created) {
        const { anonymousId, encryptionKey } = getSession();
        if (anonymousId && encryptionKey) {
          setCreated(true);
          setShowIdentityChoice(false);
          setShowAliasForm(false);
        } else {
          setCreated(false);
          setError("Your session expired. Please create identity again to continue.");
          persistAlias(parsed.alias || "", false);
        }
      }
    } catch {
      // ignore
    }
  }, [persistAlias]);

  const handleCreate = useCallback(async () => {
    if (!alias.trim() || !password) return;
    setError("");
    setSubmitting(true);
    try {
      const data = await createIdentity(alias.trim(), password);
      saveSession(data.anonymousId, password);
      setAnonymousId(data.anonymousId);
      persistAlias(alias, true);
      setCreated(true);
    } catch (e) {
      setError(e?.message || "Could not create identity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [alias, password, persistAlias]);

  const createAnonymousIdentity = useCallback(async () => {
    try {
      const randomAlias = `mbr_${Math.random().toString(36).slice(2, 10)}`;
      const randomPassword = Math.random().toString(36).slice(2, 18);
      const data = await createIdentity(randomAlias, randomPassword);
      if (data?.anonymousId) {
        saveSession(data.anonymousId, randomPassword);
        setAnonymousId(data.anonymousId);
      }
      setAlias(randomAlias);
      persistAlias(randomAlias, true);
      try {
        localStorage.setItem("cipher_member_id", data?.anonymousId || randomAlias);
        localStorage.setItem("cipher_alias", randomAlias);
      } catch {
        // best-effort
      }
      setShowMarkIntro(true);
      setShowMarkStep(true);
    } catch (err) {
      console.error("Identity creation error:", err);
      setShowMarkIntro(true);
      setShowMarkStep(true);
    }
  }, [persistAlias]);

  const handleIdentityChoice = useCallback((type) => {
    setIdentityType(type);
    setShowIdentityChoice(false);
    try {
      localStorage.setItem("cipher_identity_type", type);
    } catch {
      // best-effort
    }
    if (type === "mark") {
      createAnonymousIdentity();
    } else {
      setShowAliasForm(true);
    }
  }, [createAnonymousIdentity]);

  useEffect(() => {
    if (!showIdentityChoice) return;
    const canvas = document.getElementById("mark-preview-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
    let t = 0;
    let animId;

    function smoothNoise(x, y, z = 0) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const h = (a, b, c) => Math.abs(Math.sin(a * 127.1 + b * 311.7 + c * 74.3) * 43758.5453 % 1);
      return h(xi, yi, z) + u * (h(xi + 1, yi, z) - h(xi, yi, z)) + v * (h(xi, yi + 1, z) - h(xi, yi, z)) + u * v * (h(xi, yi, z) - h(xi + 1, yi, z) - h(xi, yi + 1, z) + h(xi + 1, yi + 1, z));
    }

    function loop() {
      animId = requestAnimationFrame(loop);
      t += 0.006;
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      const sB = smoothNoise(t * 0.8, 0) * 180 + 75;
      const sw = smoothNoise(t * 0.6, 10) * 1.5;
      for (let sym = 0; sym < 4; sym++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 4) * sym);
        ctx.strokeStyle = `rgba(180,200,20,${(sB / 255 * 0.8).toFixed(2)})`;
        ctx.lineWidth = sw;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.01) {
          const n = smoothNoise(Math.cos(a) * 1.0, Math.sin(a) * 1.0, t * 0.5);
          const offset = n * 60 - 30;
          const r = 35 + offset;
          if (a < 0.011) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
          else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    loop();
    return () => cancelAnimationFrame(animId);
  }, [showIdentityChoice]);

  useEffect(() => {
    if (!showMarkStep) return;
    const canvas = artCanvasRef.current;
    const mini = miniCanvasRef.current;
    if (!canvas || !mini) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    mini.width = mini.offsetWidth;
    mini.height = mini.offsetHeight;

    const ctx = canvas.getContext("2d");
    const mctx = mini.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Smooth noise using sine hash
    function smoothNoise(x, y, z = 0) {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = x - xi, yf = y - yi, zf = z - zi;
      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);
      const w = zf * zf * (3 - 2 * zf);
      const h = (a, b, c) => Math.abs(Math.sin(a * 127.1 + b * 311.7 + c * 74.3) * 43758.5453 % 1);
      const a = h(xi, yi, zi), b = h(xi+1, yi, zi);
      const c = h(xi, yi+1, zi), d = h(xi+1, yi+1, zi);
      const e = h(xi, yi, zi+1), f = h(xi+1, yi, zi+1);
      const g = h(xi, yi+1, zi+1), hh = h(xi+1, yi+1, zi+1);
      return a + u*(b-a) + v*(c-a) + w*(e-a)
           + u*v*(a-b-c+d) + u*w*(a-b-e+f)
           + v*w*(a-c-e+g) + u*v*w*(-a+b+c-d+e-f-g+hh);
    }

    // All parameters smoothly interpolated
    // Nothing snaps - everything glides
    let params = {
      noiseScale: 1.0,
      radius: 100,
      amplitude: 180,
      symmetry: 4,
      speed: 0.008,
      strokeBrightness: 180,
      strokeWeight: 1.0,
      secondaryScale: 0.5,
      timeScale: 1.0,
    };

    let targetParams = { ...params };
    let seedOffset = Math.random() * 1000;
    let t = 0;
    let smoothX = 0.5;
    let smoothY = 0.5;
    let animId;

    function loop() {
      animId = requestAnimationFrame(loop);
      if (lockedRef.current) return;
      const hand = lastHandPos.current;
      const gesture = gestureRef.current || "palm";
      const handPresent = hand !== null && hand.x !== undefined;
      const hx = handPresent ? hand.x : smoothX;
      const hy = handPresent ? hand.y : smoothY;

      const handMovedX = handPresent ? Math.abs(hx - prevHandXRef.current) : 0;
      const handMovedY = handPresent ? Math.abs(hy - prevHandYRef.current) : 0;
      const handMoved = handMovedX + handMovedY;

      if (handPresent && handMoved > 0.002) {
        handActivityRef.current = Math.min(1, handActivityRef.current + 0.15);
      } else {
        handActivityRef.current = Math.max(0, handActivityRef.current - 0.05);
      }

      const activity = handActivityRef.current;

      if (activity > 0.01) {
        canvasDensityRef.current = Math.min(1, canvasDensityRef.current + activity * 0.008);
      } else {
        canvasDensityRef.current = Math.max(0, canvasDensityRef.current - 0.001);
      }
      const density = canvasDensityRef.current;

      if (handPresent) {
        prevHandXRef.current = hx;
        prevHandYRef.current = hy;
      }

      t += 0.004 * activity;

      if (handPresent) {
        smoothX += (hx - smoothX) * 0.025 * (activity + 0.01);
        smoothY += (hy - smoothY) * 0.025 * (activity + 0.01);
      }

      // Map hand position to target parameters
      // Everything changes smoothly based on where hand is
      targetParams.noiseScale = smoothX * 2.2 + 0.3;
      targetParams.radius = smoothY * 130 + 30;
      targetParams.amplitude = Math.sqrt(Math.pow(smoothX-0.5,2)+Math.pow(smoothY-0.5,2)) * 2 * 220 + 60;
      targetParams.strokeBrightness = smoothX * 180 + 75;
      targetParams.strokeWeight = smoothY * 1.5 + 0.4;

      // Gesture changes symmetry and secondary scale - smoothly
      if (gesture === "palm")  { targetParams.symmetry = 4; targetParams.secondaryScale = 0.5; }
      if (gesture === "pinch") { targetParams.symmetry = 8; targetParams.secondaryScale = 0.8; }
      if (gesture === "fist")  { targetParams.symmetry = 3; targetParams.secondaryScale = 0.3; }
      if (gesture === "peace") { targetParams.symmetry = 6; targetParams.secondaryScale = 0.6; }
      if (gesture === "point") { targetParams.symmetry = 2; targetParams.secondaryScale = 1.2; }
      if (gesture === "three") { targetParams.symmetry = 12; targetParams.secondaryScale = 0.4; }
      if (gesture === "rotate") {
        targetParams.symmetry = 8;
        targetParams.secondaryScale = 0.7;
        targetParams.amplitude = 160 + Math.sin(globalRotationRef.current * 2) * 40;
      }

      // Smoothly interpolate ALL parameters every frame
      // This is what makes it feel like the video - butter smooth
      const lerpSpeed = 0.018 * activity;
      const symLerpSpeed = 0.008 * activity;
      for (const key in params) {
        if (key === "symmetry") {
          params[key] += (targetParams[key] - params[key]) * symLerpSpeed;
        } else {
          params[key] += (targetParams[key] - params[key]) * lerpSpeed;
        }
      }

      if (density > 0.6 && activity > 0.01) {
        const fadeAmount = density > 0.85 ? 0.06 * activity : 0.02 * activity;
        ctx.fillStyle = `rgba(0,0,0,${fadeAmount})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(globalRotationRef.current);

      // Noise-driven stroke properties - same as original sketch
      const noisyBright = Math.max(0.4, smoothNoise(t * 0.8, 0)) * params.strokeBrightness;
      const noisyWeight = params.strokeWeight * smoothNoise(t * 0.6, 10) * 2;

      // Draw symmetry copies - fractional symmetry creates smooth transitions
      const symCount = Math.round(params.symmetry);
      for (let sym = 0; sym < symCount; sym++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / symCount) * sym);

        // Primary blob
        const greenAlpha = Math.max(0.15, noisyBright / 255);
        ctx.strokeStyle = `rgba(180,200,20,${greenAlpha.toFixed(2)})`;
        ctx.lineWidth = Math.max(0.3, noisyWeight);
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.006) {
          const n = smoothNoise(
            Math.cos(a) * params.noiseScale + seedOffset,
            Math.sin(a) * params.noiseScale + seedOffset,
            t * 0.5
          );
          const offset = n * params.amplitude * 2 - params.amplitude;
          const r = params.radius + offset;
          const x = r * Math.cos(a);
          const y = r * Math.sin(a);
          if (a < 0.007) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Secondary blob - offset in time and scale
        // This creates the layered stacked look from reference
        ctx.strokeStyle = `rgba(160,185,15,${(Math.max(0.08, noisyBright / 255 * 0.5)).toFixed(2)})`;
        ctx.lineWidth = Math.max(0.2, noisyWeight * 0.5);
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.008) {
          const n = smoothNoise(
            Math.cos(a) * params.noiseScale * params.secondaryScale + seedOffset + 50,
            Math.sin(a) * params.noiseScale * params.secondaryScale + seedOffset + 50,
            t * 0.35 + 1.5
          );
          const offset = n * params.amplitude * 1.4 - params.amplitude * 0.7;
          const r = params.radius * 0.75 + offset;
          if (a < 0.009) ctx.moveTo(r*Math.cos(a), r*Math.sin(a));
          else ctx.lineTo(r*Math.cos(a), r*Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();

        // Tertiary blob - even smaller, faster noise
        ctx.strokeStyle = `rgba(140,170,10,${(Math.max(0.05, noisyBright / 255 * 0.25)).toFixed(2)})`;
        ctx.lineWidth = Math.max(0.1, noisyWeight * 0.3);
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.01) {
          const n = smoothNoise(
            Math.cos(a) * params.noiseScale * 1.8 + seedOffset + 200,
            Math.sin(a) * params.noiseScale * 1.8 + seedOffset + 200,
            t * 0.6 + 3.0
          );
          const offset = n * params.amplitude * 0.8 - params.amplitude * 0.4;
          const r = params.radius * 0.5 + offset;
          if (a < 0.011) ctx.moveTo(r*Math.cos(a), r*Math.sin(a));
          else ctx.lineTo(r*Math.cos(a), r*Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      }

      // Mirror - vertical flip creates full symmetric mandala
      ctx.save();
      ctx.scale(1, -1);
      for (let sym = 0; sym < symCount; sym++) {
        ctx.save();
        ctx.rotate((Math.PI*2/symCount)*sym + Math.PI/symCount);
        ctx.strokeStyle = `rgba(200,220,30,${(Math.max(0.06, noisyBright / 255 * 0.3)).toFixed(2)})`;
        ctx.lineWidth = Math.max(0.1, noisyWeight * 0.35);
        ctx.beginPath();
        for (let a = 0; a < Math.PI*2; a += 0.01) {
          const n = smoothNoise(
            Math.cos(a)*params.noiseScale*1.1+seedOffset+300,
            Math.sin(a)*params.noiseScale*1.1+seedOffset+300,
            t*0.28+5
          );
          const offset = n * params.amplitude * 1.2 - params.amplitude * 0.6;
          const r = params.radius * 0.65 + offset;
          if (a < 0.011) ctx.moveTo(r*Math.cos(a), r*Math.sin(a));
          else ctx.lineTo(r*Math.cos(a), r*Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      ctx.restore();

      mctx.clearRect(0, 0, mini.width, mini.height);
      mctx.drawImage(canvas, 0, 0, W, H, 0, 0, mini.width, mini.height);
    }

    loop();
    return () => cancelAnimationFrame(animId);
  }, [showMarkStep]);

  function detectGesture(lm) {
    const ext = (tip, pip) => tip.y < pip.y - 0.02;
    const iU = ext(lm[8], lm[6]);
    const mU = ext(lm[12], lm[10]);
    const rU = ext(lm[16], lm[14]);
    const pU = ext(lm[20], lm[18]);
    const tU = lm[4].x < lm[3].x - 0.02;
    const pinch = Math.sqrt(Math.pow(lm[4].x - lm[8].x, 2) + Math.pow(lm[4].y - lm[8].y, 2)) < 0.06;
    if (pinch) return "pinch";
    if (!iU && !mU && !rU && !pU) return "fist";
    if (iU && !mU && !rU && !pU) return "point";
    if (iU && mU && !rU && !pU) return "peace";
    if (iU && mU && rU && !pU) return "three";
    if (iU && mU && rU && pU && tU) return "rotate";
    return "palm";
  }

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks?.() || [];
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    handsRef.current = null;
    setCameraActive(false);
    setHandDetected(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      if (!window.Hands || !window.Camera) throw new Error("MediaPipe scripts not loaded");

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        if (lockedRef.current) return;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setHandDetected(true);
          const lm = results.multiHandLandmarks[0];
          const gesture = detectGesture(lm);
          gestureRef.current = gesture;
          setCurrentGesture(gesture);

          const wrist = results.multiHandLandmarks[0][0];
          const middleMCP = results.multiHandLandmarks[0][9];
          const handAngle = Math.atan2(middleMCP.y - wrist.y, middleMCP.x - wrist.x);

          if (gestureRef.current === "rotate") {
            if (prevHandAngleRef.current !== null) {
              let angleDelta = handAngle - prevHandAngleRef.current;
              if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
              if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
              handRotationVelRef.current = handRotationVelRef.current * 0.7 + angleDelta * 0.3;
              globalRotationRef.current += handRotationVelRef.current * 2.5;
            }
            prevHandAngleRef.current = handAngle;
          } else {
            handRotationVelRef.current *= 0.92;
            globalRotationRef.current += handRotationVelRef.current * 2.5;
            prevHandAngleRef.current = null;
          }

          const nx = 1 - lm[8].x;
          const ny = lm[8].y;

          lastHandPos.current = { x: nx, y: ny, raw: lm };
          setMarkPointCount((prev) => prev + 1);
          seedRef.current =
            (seedRef.current * 31 + Math.round(nx * 500) * 17 + Math.round(ny * 500) * 13) &
            0x7fffffff;

          const sEl = document.getElementById("mark-seed");
          if (sEl) sEl.textContent = seedRef.current.toString(16).padStart(8, "0").slice(0, 8);
        } else {
          setHandDetected(false);
          gestureRef.current = "palm";
          setCurrentGesture("palm");
          handRotationVelRef.current *= 0.92;
          globalRotationRef.current += handRotationVelRef.current * 2.5;
          prevHandAngleRef.current = null;
          lastHandPos.current = null;
        }
      });

      handsRef.current = hands;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      await camera.start();
      cameraRef.current = camera;
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(true);
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const lockMark = () => {
    if (markLocked) return;
    lockedRef.current = true;
    setMarkLocked(true);
    const canvas = artCanvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const seed = seedRef.current.toString(16).padStart(8, "0");
    localStorage.setItem(
      "cipher_mark",
      JSON.stringify({
        seed,
        dataUrl,
        energy: energyRef.current,
        complexity: complexityRef.current,
      }),
    );
    setTimeout(() => {
      setShowMarkStep(false);
      setCreated(true);
    }, 1500);
  };

  const clearMark = () => {
    if (lockedRef.current) return;
    pathRef.current = [];
    setMarkPointCount(0);
    energyRef.current = 0;
    complexityRef.current = 0;
    seedRef.current = 0;
    canvasDensityRef.current = 0;
    const canvas = artCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#060810";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const mini = miniCanvasRef.current;
    const mctx = mini.getContext("2d");
    mctx.clearRect(0, 0, mini.width, mini.height);
    ["mark-energy", "mark-complexity", "mark-seed"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = i === 2 ? "——————" : i === 0 ? "0.00" : "0";
    });
  };

  if (showMarkStep) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060810",
          backgroundImage:
            "radial-gradient(ellipse at bottom left, rgba(180,200,20,0.12) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 60px 60px, 60px 60px",
          color: "#fff",
          fontFamily: "inherit",
          padding: "32px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 900, width: "100%" }}>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <div>
                <button
                  onClick={() => {
                    setShowMarkStep(false);
                    setShowIdentityChoice(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(181,236,52,0.65)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    marginBottom: 14,
                    padding: 0,
                  }}
                >
                  ← Back
                </button>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    color: "#b4c814",
                    marginBottom: 6,
                  }}
                >
                  PROTOCOL ONBOARDING
                </div>
                <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
                  CREATE YOUR <span style={{ color: "#b4c814" }}>MARK.</span>
                </h1>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Move your cursor over the canvas — or activate hand tracking to paint with your hand.
                  <br />
                  Your movement style creates something no one else can replicate.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("cipher_mark");
                  setCreated(true);
                }}
                style={{
                  padding: "10px 18px",
                  flexShrink: 0,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  alignSelf: "flex-start",
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                }}
              >
                SKIP FOR NOW →
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20 }}>
            <div
              style={{
                ...markCardShell,
                border: `1px solid ${markLocked ? "rgba(180,200,20,0.5)" : "rgba(181,236,52,0.16)"}`,
                borderRadius: 16,
                overflow: "hidden",
                position: "relative",
                cursor: "none",
                height: 520,
              }}
            >
              <canvas ref={artCanvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: "absolute",
                  bottom: 60,
                  right: 12,
                  width: cameraActive ? 120 : 0,
                  height: cameraActive ? 90 : 0,
                  borderRadius: 8,
                  border: cameraActive
                    ? `1px solid ${handDetected ? "rgba(180,200,20,0.4)" : "rgba(255,255,255,0.1)"}`
                    : "none",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                  display: "block",
                  opacity: cameraActive ? 0.7 : 0,
                  transition: "all 0.3s ease",
                  zIndex: 5,
                }}
              />

              {!cameraActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      animation: "bounceDown 1s ease-in-out infinite",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: "#b4c814",
                        letterSpacing: "0.1em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      click here to start
                    </div>
                    <span style={{ color: "#b4c814", fontSize: 12 }}>↓</span>
                  </div>

                  <button
                    onClick={startCamera}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(180,200,20,0.12)",
                      border: "1px solid rgba(180,200,20,0.5)",
                      borderRadius: 8,
                      color: "#b4c814",
                      fontFamily: "monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      cursor: "pointer",
                      animation: "glowPulse 1.8s ease-in-out infinite",
                      boxShadow: "0 0 20px rgba(180,200,20,0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#b4c814",
                        animation: "statusPulse 1s ease-in-out infinite",
                        display: "inline-block",
                      }}
                    />
                    USE HAND TRACKING
                  </button>
                </div>
              )}

              {cameraActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 20,
                      background: handDetected ? "rgba(180,200,20,0.15)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${handDetected ? "rgba(180,200,20,0.4)" : "rgba(255,255,255,0.1)"}`,
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: handDetected ? "#b4c814" : "rgba(255,255,255,0.4)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: handDetected ? "#b4c814" : "rgba(255,255,255,0.3)",
                        animation: handDetected ? "statusPulse 1s ease-in-out infinite" : "none",
                      }}
                    />
                    {handDetected ? "HAND DETECTED" : "SHOW YOUR HAND"}
                  </div>
                  <button
                    onClick={stopCamera}
                    style={{
                      padding: "7px 14px",
                      background: "rgba(255,80,80,0.1)",
                      border: "1px solid rgba(255,80,80,0.3)",
                      borderRadius: 8,
                      color: "rgba(255,80,80,0.8)",
                      fontFamily: "monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                    }}
                  >
                    ✕ STOP CAMERA
                  </button>
                </div>
              )}

              {markPointCount === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.15)",
                      letterSpacing: "0.12em",
                      textAlign: "center",
                      lineHeight: 2.2,
                    }}
                  >
                    move your cursor here
                    <br />
                    no clicking needed
                  </div>
                </div>
              )}
              {cameraError && (
                <div
                  style={{
                    position: "absolute",
                    top: 46,
                    right: 12,
                    zIndex: 10,
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "rgba(255,80,80,0.85)",
                    letterSpacing: "0.08em",
                    background: "rgba(255,80,80,0.08)",
                    border: "1px solid rgba(255,80,80,0.2)",
                    borderRadius: 8,
                    padding: "6px 8px",
                  }}
                >
                  CAMERA UNAVAILABLE
                </div>
              )}

              {cameraActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 60,
                    left: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    zIndex: 10,
                  }}
                >
                  {[
                    { g: "palm", icon: "🖐", label: "MANDALA" },
                    { g: "pinch", icon: "🤌", label: "BURST" },
                    { g: "fist", icon: "✊", label: "CRYSTAL" },
                    { g: "peace", icon: "✌️", label: "DNA" },
                    { g: "point", icon: "☝️", label: "INK" },
                    { g: "three", icon: "🤟", label: "TRIPLE" },
                    { g: "rotate", icon: "🖐", label: "ROTATE - spin all fingers" },
                  ].map((item) => (
                    <div
                      key={item.g}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background:
                          currentGesture === item.g
                            ? "rgba(180,200,20,0.15)"
                            : "rgba(255,255,255,0.03)",
                        border: `1px solid ${
                          currentGesture === item.g
                            ? "rgba(180,200,20,0.4)"
                            : "rgba(255,255,255,0.06)"
                        }`,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{item.icon}</span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          color:
                            currentGesture === item.g ? "#b4c814" : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  right: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  {[
                    { id: "mark-width", label: "WIDTH", min: 8, max: 60, default: 24 },
                    { id: "mark-wave", label: "WAVE", min: 0, max: 100, default: 50 },
                    { id: "mark-layers", label: "LAYERS", min: 4, max: 24, default: 12 },
                  ].map((s) => (
                    <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 8,
                          letterSpacing: "0.12em",
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        {s.label}
                      </div>
                      <input type="range" id={s.id} min={s.min} max={s.max} defaultValue={s.default} style={{ width: 65, accentColor: "#b4c814" }} />
                    </div>
                  ))}
                </div>

                <select id="mark-color" defaultValue="green" style={{ display: "none" }}>
                  <option value="green">Green</option>
                  <option value="white">White</option>
                  <option value="mix">Mix</option>
                </select>

                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { val: "green", bg: "rgba(180,200,20,0.4)" },
                    { val: "white", bg: "rgba(255,255,255,0.2)" },
                    { val: "mix", bg: "linear-gradient(135deg,rgba(180,200,20,0.6),rgba(255,255,255,0.3))" },
                  ].map((c) => (
                    <div
                      key={c.val}
                      onClick={() => {
                        document.getElementById("mark-color").value = c.val;
                      }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        cursor: "pointer",
                        background: c.bg,
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  ...markCardShell,
                  border: "1px solid rgba(181,236,52,0.12)",
                  borderRadius: 12,
                  padding: 14,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 8,
                  }}
                >
                  ⊙ YOUR MARK
                </div>
                <canvas ref={miniCanvasRef} style={{ display: "block", width: "100%", borderRadius: 6, background: "#060810" }} />
                {markLocked && (
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "#b4c814",
                      letterSpacing: "0.1em",
                      textAlign: "center",
                      marginTop: 6,
                    }}
                  >
                    ✓ MARK LOCKED IN
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  SEED
                </div>
                <div
                  id="mark-seed"
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#b4c814",
                    marginTop: 2,
                    letterSpacing: "0.05em",
                  }}
                >
                  ——————
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button
              onClick={clearMark}
              style={{
                padding: "13px 24px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              CLEAR
            </button>
            <button
              onClick={lockMark}
              disabled={markLocked || markPointCount < 10}
              style={{
                flex: 1,
                padding: "13px",
                background: markLocked ? "rgba(180,200,20,0.15)" : "#b4c814",
                border: markLocked ? "1px solid rgba(180,200,20,0.3)" : "none",
                borderRadius: 10,
                color: markLocked ? "#b4c814" : "#000",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.1em",
                cursor: markLocked ? "default" : "pointer",
                boxShadow: markLocked ? "none" : "0 0 20px rgba(180,200,20,0.25)",
              }}
            >
              {markLocked ? "✓ MARK LOCKED — ACTIVATING PROFILE..." : "LOCK IN MY MARK →"}
            </button>
          </div>

          {showMarkIntro && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                background: "rgba(6,8,16,0.72)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                style={{
                  ...markCardShell,
                  width: "100%",
                  maxWidth: 520,
                  border: "1px solid rgba(181,236,52,0.16)",
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    color: "rgba(180,200,20,0.8)",
                    marginBottom: 10,
                  }}
                >
                  CREATE YOUR MARK
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                  This visual signature is unique to your movement style and appears on your dashboard.
                </p>
                <button
                  onClick={() => setShowMarkIntro(false)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "#b4c814",
                    border: "none",
                    borderRadius: 12,
                    marginTop: 18,
                    color: "#050505",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                  }}
                >
                  START CREATING →
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("cipher_mark");
                    setCreated(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    marginTop: 10,
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                  }}
                >
                  SKIP — GO TO DASHBOARD →
                </button>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "monospace",
                    letterSpacing: "0.07em",
                    lineHeight: 1.6,
                  }}
                >
                  you can create your mark later from your profile
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontSize: 10,
              color: "rgba(255,255,255,0.12)",
              fontFamily: "monospace",
              letterSpacing: "0.07em",
            }}
          >
            ◇ stored as a mathematical seed · never as an image · regenerated everywhere across cipher
          </div>
        </div>
        <style>{`
          @keyframes statusPulse {
            0%,100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          @keyframes bounceDown {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
          }
          @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(180,200,20,0.3); border-color: rgba(180,200,20,0.4); }
            50% { box-shadow: 0 0 40px rgba(180,200,20,0.6); border-color: rgba(180,200,20,0.8); }
          }
        `}</style>
      </div>
    );
  }

  if (showIdentityChoice) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060810",
          backgroundImage:
            "radial-gradient(ellipse at bottom left, rgba(180,200,20,0.12) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 60px 60px, 60px 60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          color: "#fff",
          fontFamily: "inherit",
        }}
      >
        <div style={{ maxWidth: 720, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#b4c814", marginBottom: 12 }}>
              ⊙ ONE LAST STEP
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 14 }}>
              How will the network
              <br />
              <span style={{ color: "#b4c814" }}>know you?</span>
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
              Choose how you appear to others in the network. This shapes your presence - how jurors see you, how your votes are attributed, how your claims are represented.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
            <div
              onClick={() => handleIdentityChoice("mark")}
              style={{
                background: "rgba(180,200,20,0.04)",
                border: "1px solid rgba(180,200,20,0.25)",
                borderRadius: 20,
                padding: "32px 28px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(180,200,20,0.08)";
                e.currentTarget.style.borderColor = "rgba(180,200,20,0.5)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 60px rgba(180,200,20,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(180,200,20,0.04)";
                e.currentTarget.style.borderColor = "rgba(180,200,20,0.25)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  height: 140,
                  borderRadius: 12,
                  background: "#000",
                  border: "1px solid rgba(180,200,20,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <canvas id="mark-preview-canvas" width="200" height="140" style={{ display: "block" }} />
              </div>

              <div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", color: "#b4c814", marginBottom: 8 }}>
                  ⊙ CIPHER MARK
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Visual Identity</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                  Create a unique generative artwork using your hand movements. Your mark appears everywhere instead of a name - completely anonymous, completely yours.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "Maximum anonymity",
                  "Unique visual fingerprint",
                  "Created with hand gestures",
                  "Never the same as anyone else's",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ color: "#b4c814", fontSize: 10 }}>◇</span>
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#b4c814",
                  border: "none",
                  borderRadius: 10,
                  color: "#000",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(180,200,20,0.3)",
                }}
              >
                CREATE MY MARK →
              </button>
            </div>

            <div
              onClick={() => handleIdentityChoice("alias")}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "32px 28px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 60px rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  height: 140,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.8)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {"anon_" + "••••••••"}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>
                  ⊙ NETWORK IDENTITY
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                  ⊙ ALIAS
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Text Identity</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                  Choose a username in the next step. Simple, readable, and recognizable across the network.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "Simple and familiar",
                  "Recognizable across the network",
                  "Good for jurors and governance",
                  "No camera needed",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>◇</span>
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                USE MY ALIAS →
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
            ◇ You can create a Cipher Mark later from your profile settings
          </div>
        </div>
      </div>
    );
  }

  if (created) {
    return (
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          backgroundColor: "#060810",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), radial-gradient(ellipse at bottom left, rgba(180, 200, 20, 0.12) 0%, #060810 65%)",
          backgroundSize: "60px 60px, 60px 60px, 100% 100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 500,
            padding: "0 24px",
            opacity: 1,
            animation: "fadeUp 0.6s ease both",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: ACCENT,
              margin: "0 auto 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(181,236,52,0.5)",
              marginBottom: 12,
            }}
          >
            Protocol Identity
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "#f1f5f9",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              marginBottom: 40,
            }}
          >
            Identity Created
          </h1>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "28px 32px",
              textAlign: "left",
              marginBottom: 40,
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
                Alias
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
                {alias}
              </p>
            </div>
          </div>

          <button
            onClick={onContinue ?? onBack}
            style={{
              padding: "14px 40px",
              border: "none",
              borderRadius: 6,
              background: ACCENT,
              color: "#050505",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            Activate Profile
          </button>
        </div>
      </div>
    );
  }

  if (!showAliasForm) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FaintBackground />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 560,
          padding: "0 24px",
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <button
          onClick={() => {
            setShowAliasForm(false);
            setShowIdentityChoice(true);
          }}
          style={{
            background: "none",
            border: "none",
            color: "rgba(181,236,52,0.5)",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            marginBottom: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
            padding: 0,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.color = ACCENT)}
          onMouseLeave={(e) => (e.target.style.color = "rgba(181,236,52,0.5)")}
        >
          ← Back
        </button>

        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(181,236,52,0.4)",
            marginBottom: 12,
          }}
        >
          Protocol Onboarding
        </p>
        <h1
          style={{
            fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)",
            fontWeight: 800,
            color: "#f1f5f9",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            marginBottom: 16,
            lineHeight: 1.05,
          }}
        >
          Join the
          <br />
          <span style={{ color: ACCENT }}>Network</span>
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 48,
            maxWidth: 440,
          }}
        >
          Create your protocol identity. Your identity is pseudonymous and
          secured through encryption.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 10,
              }}
            >
              Alias
            </label>
            <StyledInput
              placeholder="Enter a public alias (e.g. care_node_21)"
              value={alias}
              onChange={(e) => {
                const next = e.target.value;
                setAlias(next);
                try {
                  const raw = window.localStorage.getItem("cipher_identity");
                  const base = raw ? JSON.parse(raw) : {};
                  window.localStorage.setItem(
                    "cipher_identity",
                    JSON.stringify({
                      ...base,
                      alias: next.trim(),
                      created: false,
                    }),
                  );
                } catch {
                  // ignore
                }
              }}
              autoComplete="username"
            />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.03em" }}>
              This is how you will appear in the network.
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 10,
              }}
            >
              Password
            </label>
            <StyledInput
              type="password"
              placeholder="Choose a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.03em" }}>
              Used to protect your health data encryption. Never shared with the protocol in plain form.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            padding: "20px 24px",
            background: "rgba(181,236,52,0.03)",
            border: "1px solid rgba(181,236,52,0.08)",
            borderRadius: 10,
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
            <span style={{ color: "rgba(181,236,52,0.6)", fontWeight: 600 }}>Your identity is anonymous.</span>{" "}
            The protocol never stores personal information — only encrypted identifiers.
          </p>
        </div>

        {error ? (
          <p style={{ marginTop: 16, fontSize: 14, color: "#fda4af", lineHeight: 1.5 }}>{error}</p>
        ) : null}

        <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
          <button
            onClick={handleCreate}
            disabled={!alias.trim() || !password || submitting}
            style={{
              padding: "14px 36px",
              border: "none",
              borderRadius: 6,
              background: alias.trim() && password && !submitting ? ACCENT : "rgba(181,236,52,0.15)",
              color: alias.trim() && password && !submitting ? "#050505" : "rgba(181,236,52,0.3)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: alias.trim() && password && !submitting ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (alias.trim() && password && !submitting) e.target.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = "1";
            }}
          >
            {submitting ? "Creating…" : "Create Identity"}
          </button>
          <button
            type="button"
            style={{
              padding: "14px 32px",
              border: "1px solid rgba(181,236,52,0.3)",
              borderRadius: 6,
              background: "transparent",
              color: "rgba(181,236,52,0.5)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "rgba(181,236,52,0.6)";
              e.target.style.color = ACCENT;
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(181,236,52,0.3)";
              e.target.style.color = "rgba(181,236,52,0.5)";
            }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
