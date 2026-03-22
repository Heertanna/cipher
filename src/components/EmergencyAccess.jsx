import React, { useCallback, useMemo, useState } from "react";
import { FaintBackground, Label, TextArea, ACCENT } from "./OnboardingCommon.jsx";

const EMERGENCY_KEY = "cipher_emergency_demo";
const STORAGE_EVENT_TTL_MS = 1000 * 60 * 60 * 48; // 48h

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
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
    />
  );
}

function fileMeta(files) {
  const list = Array.from(files || []);
  return list.map((f) => ({
    name: f.name,
    size: f.size,
    type: f.type,
  }));
}

export function EmergencyAccess({ onBack, onDone }) {
  const [description, setDescription] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [evidenceMeta, setEvidenceMeta] = useState([]);

  const [submitted, setSubmitted] = useState(false);

  const isReady = useMemo(
    () => description.trim().length > 3 && hospitalName.trim().length > 2,
    [description, hospitalName]
  );

  const submit = useCallback(() => {
    const now = Date.now();
    const payload = {
      id: `E-${Math.floor(now / 1000)}`,
      createdAt: now,
      description,
      hospitalName,
      estimatedCost: estimatedCost || null,
      evidenceCount: evidenceMeta.length,
      evidenceMeta,
    };

    // Persist so dashboard can show the post-emergency state.
    window.localStorage.setItem(EMERGENCY_KEY, JSON.stringify(payload));
    setSubmitted(true);
  }, [description, estimatedCost, evidenceMeta]);

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050505",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          position: "relative",
        }}
      >
        <FaintBackground />

        <div
          style={{
            width: "100%",
            maxWidth: 820,
            position: "relative",
            zIndex: 1,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "32px 32px",
            boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 22,
              gap: 16,
            }}
          >
            <div />
            <button
              type="button"
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
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              ← Back
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid rgba(250,204,21,0.35)",
                background: "rgba(250,204,21,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(250,204,21,0.95)",
                fontWeight: 900,
                flex: "0 0 auto",
              }}
            >
              🚨
            </div>

            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(250,204,21,0.85)",
                }}
              >
                Emergency confirmation
              </p>
              <h1
                style={{
                  margin: "10px 0 8px",
                  fontSize: "clamp(1.7rem, 3.2vw, 2.2rem)",
                  fontWeight: 950,
                  color: "#f1f5f9",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.05,
                }}
              >
                🚨 Emergency Access Granted
              </h1>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.45)" }}>
                You can proceed with treatment immediately.
                <br />
                This case will be evaluated after care is completed.
                <br />
                The system will contact <span style={{ color: "rgba(250,204,21,0.95)", fontWeight: 800 }}>{hospitalName || "the hospital"}</span> and start the treatment process.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={onDone}
              style={{
                padding: "14px 34px",
                borderRadius: 999,
                border: "1px solid rgba(250,204,21,0.5)",
                background: "rgba(250,204,21,0.12)",
                color: "rgba(250,204,21,0.95)",
                fontSize: 12,
                fontWeight: 950,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
      }}
    >
      <FaintBackground />

      <div
        style={{
          width: "100%",
          maxWidth: 820,
          position: "relative",
          zIndex: 1,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          padding: "32px 32px",
          boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
            gap: 16,
          }}
        >
          <div />
          <button
            type="button"
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
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.8rem, 3.6vw, 2.4rem)",
              fontWeight: 950,
              color: "#f1f5f9",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
            }}
          >
            Emergency Access
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 650,
            }}
          >
            Proceed with treatment immediately. This case will be evaluated after care is completed.
          </p>
        </div>

        {/* warning */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(250,204,21,0.28)",
            background: "rgba(250,204,21,0.10)",
            padding: 16,
            marginBottom: 18,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(250,204,21,0.95)",
              fontWeight: 850,
              lineHeight: 1.5,
            }}
          >
            Emergency access allows immediate treatment without prior approval. Final coverage will be determined after evaluation.
          </p>
        </div>

        {/* minimal form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div>
            <Label>Description</Label>
            <TextArea
              value={description}
              onChange={(v) => setDescription(v)}
              placeholder="Briefly describe what’s happening and what’s needed immediately"
              rows={3}
            />
          </div>

          <div>
            <Label>Hospital name</Label>
            <Input
              value={hospitalName}
              onChange={setHospitalName}
              placeholder="e.g. St. Mary’s Hospital"
            />
          </div>

          <div>
            <Label>Estimated cost (optional)</Label>
            <Input
              value={estimatedCost}
              onChange={setEstimatedCost}
              placeholder="e.g. INR 50000 (optional)"
            />
          </div>

          <div>
            <Label>Upload evidence (optional)</Label>
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={(e) => setEvidenceMeta(fileMeta(e.target.files))}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "#f1f5f9",
                fontFamily: "inherit",
              }}
            />
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {evidenceMeta?.length ? `${evidenceMeta.length} file(s) attached.` : "No files selected."}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 26,
            paddingTop: 22,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em" }}>
            Emergency flow is fast and minimal. Evaluation happens later.
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={!isReady}
            style={{
              padding: "14px 34px",
              borderRadius: 999,
              border: "1px solid rgba(250,204,21,0.5)",
              background: isReady ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.06)",
              color: isReady ? "rgba(250,204,21,0.95)" : "rgba(250,204,21,0.35)",
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: isReady ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}
          >
            Proceed with Emergency Access
          </button>
        </div>
      </div>
    </div>
  );
}

