import React, { useEffect, useState } from "react";
import {
  ACCENT,
  Label,
  TextArea,
} from "./OnboardingCommon.jsx";
import { uploadDocuments } from "../lib/api.js";
import { getSession } from "../lib/session.js";

const HEALTH_STATES = ["Optimal", "Managed", "Critical"];

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function DocumentSubmit({ onBack, onContinue }) {
  const [healthState, setHealthState] = useState("Optimal");
  const [notes, setNotes] = useState("");
  const [fileObjects, setFileObjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = safeParse(window.localStorage.getItem("medicalDocuments"));
    if (existing) {
      setHealthState(existing.healthState || "Optimal");
      setNotes(existing.notes || "");
    }
  }, []);

  function persist(next = {}) {
    const nextFiles = next.fileObjects ?? fileObjects;
    const payload = {
      healthState: next.healthState ?? healthState,
      notes: next.notes ?? notes,
      fileNames: nextFiles.map((f) => f.name),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem("medicalDocuments", JSON.stringify(payload));
    return payload;
  }

  function handleFilesChange(event) {
    const list = Array.from(event.target.files || []);
    setFileObjects(list);
    persist({ fileObjects: list });
  }

  const severityPosition =
    healthState === "Optimal" ? "0%" : healthState === "Managed" ? "50%" : "100%";

  const severityColor =
    healthState === "Optimal"
      ? "#22c55e"
      : healthState === "Managed"
      ? "#eab308"
      : "#ef4444";

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
        padding: "80px 24px",
      }}
    >
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
        }}
      >
        {/* header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(181,236,52,0.45)",
                marginBottom: 10,
              }}
            >
              Onboarding — Step 3 of 3
            </p>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 3.4vw, 2.5rem)",
                fontWeight: 800,
                color: "#f1f5f9",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              Submit Medical Documents
            </h1>
          </div>

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
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "inherit",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.target.style.color = ACCENT)}
            onMouseLeave={(e) => (e.target.style.color = "rgba(181,236,52,0.5)")}
          >
            ← Back
          </button>
        </div>

        {/* description */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.45)",
            maxWidth: 620,
            marginBottom: 28,
          }}
        >
          Attach any recent checkups, lab results, or discharge summaries. When you
          continue, files are sent securely to the protocol (you can skip this step).
        </p>

        {/* grid: upload + severity */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
            gap: 24,
            marginBottom: 28,
          }}
        >
          {/* upload card – styled like input group */}
          <div
            style={{
              padding: "20px 22px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Label>Recent Documents</Label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 999,
                border: `1px solid rgba(181,236,52,0.5)`,
                color: ACCENT,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <span>Choose Files</span>
              <input
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFilesChange}
              />
            </label>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                marginTop: 10,
              }}
            >
              PDF, images, or reports — optional; you can skip if you prefer.
            </p>

            {fileObjects.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginTop: 16,
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                {fileObjects.map((file, idx) => (
                  <li
                    key={file.name + idx}
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.7)",
                      padding: "6px 0",
                      borderBottom:
                        idx < fileObjects.length - 1
                          ? "1px solid rgba(255,255,255,0.06)"
                          : "none",
                    }}
                  >
                    {file.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* severity card – styled like input group */}
          <div
            style={{
              padding: "20px 22px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Label>Current Health State</Label>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {HEALTH_STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setHealthState(state);
                    persist({ healthState: state });
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 999,
                    border:
                      healthState === state
                        ? `1px solid ${severityColor}`
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      healthState === state
                        ? "rgba(181,236,52,0.1)"
                        : "transparent",
                    color:
                      healthState === state
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.55)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {state}
                </button>
              ))}
            </div>

            {/* severity bar */}
            <div
              style={{
                position: "relative",
                height: 12,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%)",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  left: severityPosition,
                  transform: "translateX(-50%)",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "2px solid #020617",
                  background: severityColor,
                  boxShadow: `0 0 12px ${severityColor}66`,
                  transition: "left 0.2s ease, background 0.2s ease",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <span>Stable</span>
              <span>Elevated risk</span>
            </div>
          </div>
        </div>

        {/* notes */}
        <div
          style={{
            marginBottom: 26,
          }}
        >
          <Label>Additional Context (optional)</Label>
          <TextArea
            value={notes}
            onChange={(v) => {
              setNotes(v);
              persist({ notes: v });
            }}
            placeholder="Describe ongoing treatments, recent changes, or anything a peer jury should know."
            rows={3}
          />
        </div>

        {/* footer actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 18,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Health state is for simulation only. Uploads run when you choose Next.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (submitting) return;
                setError("");
                persist({});
                onContinue();
              }}
              disabled={submitting}
              style={{
                background: "none",
                border: "none",
                color: submitting ? "rgba(181,236,52,0.2)" : "rgba(181,236,52,0.5)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.target.style.color = ACCENT;
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.target.style.color = "rgba(181,236,52,0.5)";
              }}
            >
              Skip for now
            </button>
            {uploadProgress != null && uploadProgress < 100 ? (
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.06em",
                }}
              >
                Uploading {uploadProgress}%
              </span>
            ) : null}
            <button
              type="button"
              disabled={submitting || fileObjects.length === 0}
              onClick={async () => {
                if (submitting || fileObjects.length === 0) return;
                setError("");
                setSubmitting(true);
                setUploadProgress(0);
                try {
                  const { anonymousId } = getSession();
                  if (!anonymousId) {
                    throw new Error("Your session expired. Please go back and create your identity again.");
                  }
                  persist({});
                  await uploadDocuments(anonymousId, fileObjects, (pct) => setUploadProgress(pct));
                  onContinue();
                } catch (e) {
                  setError(e?.message || "Upload failed. Please try again.");
                } finally {
                  setSubmitting(false);
                  setUploadProgress(null);
                }
              }}
              style={{
                padding: "14px 32px",
                borderRadius: 6,
                border: "none",
                background:
                  submitting || fileObjects.length === 0
                    ? "rgba(181,236,52,0.15)"
                    : ACCENT,
                color:
                  submitting || fileObjects.length === 0
                    ? "rgba(181,236,52,0.3)"
                    : "#050505",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor:
                  submitting || fileObjects.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {submitting ? "Uploading…" : "Next"}
            </button>
          </div>
        </div>

        {error ? (
          <p style={{ marginTop: 14, fontSize: 13, color: "#fda4af", lineHeight: 1.5 }}>{error}</p>
        ) : null}
      </div>
    </div>
  );
}

