import React from "react";
import { motion as Motion } from "framer-motion";

const EVENTS = [
  { id: 1, icon: "✓", text: "3 claims approved today", time: "2m ago" },
  { id: 2, icon: "↘", text: "Pool dropped by 2%", time: "17m ago" },
  { id: 3, icon: "⚖", text: "Jury assigned to case #A392", time: "32m ago" },
  { id: 4, icon: "↗", text: "Reserve recovered by 1.2%", time: "1h ago" },
  { id: 5, icon: "✓", text: "Case #C172 moved to Decision", time: "2h ago" },
];

const EMERGENCY_KEY = "cipher_emergency_demo";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatTimeAgo(ts) {
  const delta = Date.now() - ts;
  const s = Math.max(0, Math.floor(delta / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function SystemActivityCard() {
  const emergency = safeParse(window.localStorage.getItem(EMERGENCY_KEY));
  const emergencyRecent =
    emergency?.createdAt && Date.now() - Number(emergency.createdAt) < 1000 * 60 * 60 * 48;

  const events = emergencyRecent
    ? [
        {
          id: "emergency-0",
          icon: "⚠️",
          text: "Emergency Case — Under Evaluation",
          time: formatTimeAgo(Number(emergency.createdAt)),
        },
        ...EVENTS,
      ]
    : EVENTS;

  return (
    <section
      style={{
        padding: "20px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(15,23,42,0.9)",
        minHeight: 260,
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.95)",
        }}
      >
        System Activity
      </p>

      <div
        style={{
          maxHeight: 220,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingRight: 4,
        }}
      >
        {EVENTS.map((event, i) => (
          <Motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.28 }}
            style={{
              display: "grid",
              gridTemplateColumns: "26px 1fr auto",
              alignItems: "center",
              gap: 10,
              padding: "10px 10px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.96)",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                border: "1px solid rgba(181,236,52,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: "rgba(190,242,100,0.95)",
              }}
            >
              {event.icon}
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(226,232,240,0.9)" }}>
              {event.text}
            </p>
            <span
              style={{
                fontSize: 14,
                color: "rgba(148,163,184,0.9)",
                letterSpacing: "0.08em",
              }}
            >
              {event.time}
            </span>
          </Motion.div>
        ))}
      </div>
    </section>
  );
}

