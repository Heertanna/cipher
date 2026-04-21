import React from "react";
import { motion as Motion } from "framer-motion";

const STATUS_COLOR = {
  "Under review": "rgba(181,236,52,0.95)",
  "Under Jury Review": "rgba(181,236,52,0.95)",
  Approved: "rgba(190,242,100,0.96)",
  Pending: "rgba(148,163,184,0.96)",
};

export function CaseCard({
  c,
  detail = "compact", // compact | hover | focus
  tone = "dark", // dark | light
  onClick,
  disableHover = false,
}) {
  const isLight = tone === "light";
  const statusColor = STATUS_COLOR[c.status] || "rgba(181,236,52,0.95)";

  const headerBg = isLight
    ? "linear-gradient(120deg, rgba(59,130,246,0.45), rgba(59,130,246,0.12))"
    : "linear-gradient(120deg, rgba(181,236,52,0.12), rgba(181,236,52,0.05))";

  const cardBg = isLight ? "rgba(248,250,252,0.98)" : "rgba(10,16,28,0.9)";
  const cardBorder = isLight
    ? "1px solid rgba(15,23,42,0.10)"
    : "1px solid rgba(181,236,52,0.12)";

  const titleColor = isLight ? "rgba(15,23,42,1)" : "rgba(226,232,240,0.96)";
  const subColor = isLight ? "rgba(71,85,105,1)" : "rgba(148,163,184,0.95)";

  const fillColor = "rgba(181,236,52,1)";
  const trackBg = isLight ? "rgba(2,6,23,0.06)" : "rgba(15,23,42,1)";

  const showDescription = detail === "hover" || detail === "focus";

  return (
    <Motion.div
      initial={false}
      style={{
        borderRadius: detail === "focus" ? 22 : 18,
        border: cardBorder,
        background: cardBg,
        overflow: "hidden",
        boxShadow: isLight ? "0 16px 40px rgba(2,6,23,0.10)" : "0 16px 45px rgba(0,0,0,0.35)",
        backdropFilter: detail === "compact" ? "blur(10px)" : "blur(14px)",
      }}
      whileHover={disableHover || detail === "focus" ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* header tab */}
      <div
        style={{
          height: detail === "focus" ? 54 : 42,
          padding: detail === "focus" ? "0 14px" : "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: headerBg,
          borderBottom: isLight
            ? "1px solid rgba(15,23,42,0.08)"
            : "1px solid rgba(181,236,52,0.14)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: isLight ? "rgba(59,130,246,0.95)" : "rgba(181,236,52,0.95)",
              boxShadow: "0 0 12px rgba(181,236,52,0.35)",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: detail === "focus" ? "0.18em" : "0.14em",
              textTransform: "uppercase",
              color: titleColor,
              fontWeight: 900,
            }}
          >
            Case #{c.id}
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "2px 10px",
            borderRadius: 999,
            border: `1px solid ${statusColor}`,
            background: isLight ? "rgba(248,250,252,0.6)" : "rgba(15,23,42,0.4)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: statusColor }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: titleColor,
              opacity: isLight ? 0.8 : 0.95,
              fontWeight: 800,
            }}
          >
            {c.status}
          </span>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: detail === "focus" ? "14px 14px 16px" : "12px 12px 12px" }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: detail === "focus" ? 18 : 14,
            fontWeight: 950,
            color: titleColor,
            letterSpacing: "-0.01em",
          }}
        >
          {c.stage}
        </p>

        <p style={{ margin: 0, fontSize: 12, color: subColor, lineHeight: 1.5 }}>
          {c.title}
        </p>

        <div
          style={{
            marginTop: 10,
            height: detail === "focus" ? 10 : 8,
            borderRadius: 999,
            background: trackBg,
            border: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(181,236,52,0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${c.progress}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${fillColor}, rgba(181,236,52,0.7))`,
            }}
          />
        </div>

        <p style={{ margin: "8px 0 0", fontSize: 11, color: subColor }}>
          {c.jurorCount} jurors evaluating
        </p>

        {showDescription && (
          <p
            style={{
              margin: detail === "focus" ? "10px 0 0" : "10px 0 0",
              fontSize: 12,
              lineHeight: 1.6,
              color: isLight ? "rgba(15,23,42,0.75)" : "rgba(203,213,225,0.92)",
              maxHeight: detail === "focus" ? 120 : 56,
              overflow: "hidden",
            }}
          >
            {c.description}
          </p>
        )}
      </div>
    </Motion.div>
  );
}

