import React, { useEffect, useState } from "react";
import { ACCENT } from "./OnboardingCommon.jsx";
import {
  PROTOCOL_DASHBOARD_CARD,
  PROTOCOL_PAGE_BACKGROUND,
} from "../lib/protocolPageBackground.js";

const STEPS = [
  {
    label: "Verifying document authenticity...",
    type: "loading",
    delay: 1500,
  },
  {
    label: "Documents verified",
    type: "success",
    delay: 1000,
  },
  {
    label: "Redacting personal information (name, address)...",
    type: "loading",
    delay: 1500,
  },
  {
    label: "Sensitive data removed",
    type: "success",
    delay: 1000,
  },
  {
    label: "Securing medical data to your identity",
    type: "loading",
    delay: 1000,
  },
  {
    label: "Setup complete",
    type: "success",
    delay: 0,
  },
];

export function DocumentProcessingModal({ onFinished }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const step = STEPS[currentIndex];
    if (!step || step.delay === 0) return;

    const id = setTimeout(() => {
      setCurrentIndex((prev) =>
        prev < STEPS.length - 1 ? prev + 1 : prev
      );
    }, step.delay);

    return () => clearTimeout(id);
  }, [currentIndex]);

  const isLast = currentIndex === STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        ...PROTOCOL_PAGE_BACKGROUND,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
      }}
    >
      <div
        style={{
          ...PROTOCOL_DASHBOARD_CARD,
          width: "100%",
          maxWidth: 520,
          borderRadius: 20,
          padding: "28px 28px 24px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(181,236,52,0.5)",
            marginBottom: 10,
          }}
        >
          Processing
        </p>
        <h2
          style={{
            fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
            fontWeight: 800,
            color: "#f1f5f9",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Processing Documents
        </h2>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.5)",
            marginTop: 8,
            marginBottom: 20,
          }}
        >
          Verifying and securing your data...
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {STEPS.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            let icon;
            if (step.type === "loading" && isActive) {
              icon = (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(148,163,184,0.5)",
                    borderTopColor: ACCENT,
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              );
            } else if (step.type === "success" && (isCompleted || isActive)) {
              icon = (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: ACCENT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#020617",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
              );
            } else {
              icon = (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "1px solid rgba(148,163,184,0.5)",
                  }}
                />
              );
            }

            return (
              <div
                key={step.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: isActive ? 1 : isCompleted ? 0.88 : 0.5,
                  transform: isActive ? "translateX(0)" : "translateX(0)",
                  transition: "opacity 0.2s ease",
                }}
              >
                {icon}
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(226,232,240,0.9)",
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <button
            disabled={!isLast}
            onClick={onFinished}
            style={{
              padding: "10px 26px",
              borderRadius: 999,
              border: "none",
              background: isLast ? ACCENT : "rgba(148,163,184,0.3)",
              color: isLast ? "#020617" : "rgba(15,23,42,0.8)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: isLast ? "pointer" : "default",
              fontFamily: "inherit",
            }}
          >
            Go to Dashboard
          </button>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

