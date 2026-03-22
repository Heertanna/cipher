import React from "react";

export const ACCENT = "#b5ec34";

export function FaintBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 10% 0%, rgba(255,226,150,0.12), transparent 55%), radial-gradient(circle at 70% 110%, rgba(181,236,52,0.18), transparent 65%), #02030a",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.75,
          backgroundImage:
            "linear-gradient(rgba(40,40,60,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(40,40,60,0.45) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

export function Label({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
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
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(181,236,52,0.5)";
        e.target.style.boxShadow =
          "0 0 0 2px rgba(181,236,52,0.1), 0 0 20px rgba(181,236,52,0.06)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        e.target.style.boxShadow = "none";
      }}
    >
      {placeholder != null && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt || "—"}
        </option>
      ))}
    </select>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      style={{
        width: "100%",
        padding: "14px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "#f1f5f9",
        fontSize: 15,
        fontFamily: "inherit",
        outline: "none",
        resize: "vertical",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(181,236,52,0.5)";
        e.target.style.boxShadow =
          "0 0 0 2px rgba(181,236,52,0.1), 0 0 20px rgba(181,236,52,0.06)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

