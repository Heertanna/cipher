import React, { useState, useEffect, useCallback } from "react";
import { ACCENT, FaintBackground } from "./OnboardingCommon";
import { createIdentity } from "../lib/api.js";
import { saveSession } from "../lib/session.js";

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
  const [fadeIn, setFadeIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [, setAnonymousId] = useState(null);

  useEffect(() => {
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cipher_identity");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.alias) setAlias(parsed.alias);
      if (parsed.created) setCreated(true);
    } catch {
      // ignore
    }
  }, []);

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

  if (created) {
    return (
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "#02030a",
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
              fontSize: 11,
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
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
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

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#02030a",
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
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "rgba(181,236,52,0.5)",
            fontSize: 12,
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
            fontSize: 11,
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
                fontSize: 10,
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
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.03em" }}>
              This is how you will appear in the network.
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 10,
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
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.03em" }}>
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
          <p style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
            <span style={{ color: "rgba(181,236,52,0.6)", fontWeight: 600 }}>Your identity is anonymous.</span>{" "}
            The protocol never stores personal information — only encrypted identifiers.
          </p>
        </div>

        {error ? (
          <p style={{ marginTop: 16, fontSize: 13, color: "#fda4af", lineHeight: 1.5 }}>{error}</p>
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
