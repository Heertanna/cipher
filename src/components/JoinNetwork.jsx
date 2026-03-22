import React, { useState, useEffect, useCallback } from "react";
import { ACCENT, FaintBackground } from "./OnboardingCommon";

function generateHash() {
  const chars = "0123456789ABCDEFabcdef";
  let h = "0x";
  for (let i = 0; i < 40; i++) h += chars[Math.floor(Math.random() * chars.length)];
  return h;
}

function truncateHash(h) {
  if (!h || h.length < 12) return h;
  return h.slice(0, 8) + "..." + h.slice(-6);
}

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

function StyledInput({ placeholder, value, onChange, readOnly }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase,
        ...(focused ? inputFocus : {}),
        ...(readOnly ? { cursor: "default", color: ACCENT, fontFamily: "monospace", fontSize: 13, letterSpacing: "0.04em" } : {}),
      }}
    />
  );
}

export function JoinNetwork({ onBack, onContinue }) {
  const [alias, setAlias] = useState("");
  const [hash, setHash] = useState("");
  const [customHash, setCustomHash] = useState(false);
  const [created, setCreated] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  // hydrate from localStorage if an identity already exists
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cipher_identity");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.alias) setAlias(parsed.alias);
      if (parsed.hash) setHash(parsed.hash);
      if (parsed.created) setCreated(true);
    } catch {
      // ignore malformed storage
    }
  }, []);

  const persist = useCallback(
    (next) => {
      try {
        const payload = {
          alias: (next.alias ?? alias).trim(),
          hash: next.hash ?? hash,
          created: next.created ?? created,
        };
        window.localStorage.setItem("cipher_identity", JSON.stringify(payload));
      } catch {
        // best-effort only
      }
    },
    [alias, hash, created]
  );

  const handleGenerate = useCallback(() => {
    const nextHash = generateHash();
    setHash(nextHash);
    setCustomHash(false);
    persist({ hash: nextHash, created: false });
  }, [persist]);

  const handleCreate = useCallback(() => {
    if (!alias.trim()) return;
    if (!hash) return;
    persist({ alias, hash, created: true });
    setCreated(true);
  }, [alias, hash, persist]);

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
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
                Alias
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
                {alias}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
                Hash
              </p>
              <p style={{ fontSize: 14, fontFamily: "monospace", color: ACCENT, letterSpacing: "0.04em" }}>
                {truncateHash(hash)}
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
        {/* back link */}
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

        {/* header */}
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

        {/* form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {/* alias */}
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
                // keep storage in sync but do not mark as created
                try {
                  const raw = window.localStorage.getItem("cipher_identity");
                  const base = raw ? JSON.parse(raw) : {};
                  window.localStorage.setItem(
                    "cipher_identity",
                    JSON.stringify({
                      ...base,
                      alias: next.trim(),
                      hash,
                      created: false,
                    })
                  );
                } catch {
                  // ignore
                }
              }}
            />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.03em" }}>
              This is how you will appear in the network.
            </p>
          </div>

          {/* identity hash */}
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
              Identity Hash
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <StyledInput
                  placeholder={customHash ? "Paste your own hash" : "Click generate →"}
                  value={hash}
                  onChange={(e) => {
                    const next = e.target.value;
                    setHash(next);
                    setCustomHash(true);
                    try {
                      const raw = window.localStorage.getItem("cipher_identity");
                      const base = raw ? JSON.parse(raw) : {};
                      window.localStorage.setItem(
                        "cipher_identity",
                        JSON.stringify({
                          ...base,
                          alias: alias.trim(),
                          hash: next,
                          created: false,
                        })
                      );
                    } catch {
                      // ignore
                    }
                  }}
                  readOnly={!customHash}
                />
              </div>
              <button
                onClick={handleGenerate}
                style={{
                  padding: "0 20px",
                  border: `1px solid ${ACCENT}`,
                  borderRadius: 8,
                  background: "transparent",
                  color: ACCENT,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = ACCENT;
                  e.target.style.color = "#050505";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = ACCENT;
                }}
              >
                Generate
              </button>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.03em" }}>
              Your identity hash is encrypted and used for verification across the protocol.
            </p>
            {!customHash && hash === "" && (
              <button
                onClick={() => { setCustomHash(true); setHash(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(181,236,52,0.4)",
                  fontSize: 11,
                  cursor: "pointer",
                  marginTop: 4,
                  padding: 0,
                  fontFamily: "inherit",
                  letterSpacing: "0.03em",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.color = ACCENT)}
                onMouseLeave={(e) => (e.target.style.color = "rgba(181,236,52,0.4)")}
              >
                Or paste your own hash →
              </button>
            )}
          </div>
        </div>

        {/* security note */}
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

        {/* CTA */}
        <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
          <button
            onClick={handleCreate}
            disabled={!alias.trim() || !hash}
            style={{
              padding: "14px 36px",
              border: "none",
              borderRadius: 6,
              background: alias.trim() && hash ? ACCENT : "rgba(181,236,52,0.15)",
              color: alias.trim() && hash ? "#050505" : "rgba(181,236,52,0.3)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: alias.trim() && hash ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (alias.trim() && hash) e.target.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => { e.target.style.opacity = "1"; }}
          >
            Create Identity
          </button>
          <button
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
