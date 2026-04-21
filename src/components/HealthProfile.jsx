import React, { useEffect, useMemo, useState, useCallback } from "react";
import { AvatarPreview } from "./AvatarPreview.jsx";
import {
  ACCENT,
  Label,
  Select,
  TextArea,
} from "./OnboardingCommon.jsx";
import { saveHealthProfile } from "../lib/api.js";
import { getSession } from "../lib/session.js";

const AGE_OPTIONS = ["18-24", "25-34", "35-44", "45-54", "55+"];
const BLOOD_OPTIONS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

function genderToApiValue(label) {
  const map = {
    Male: "male",
    Female: "female",
    Other: "other",
    "Prefer not to say": "prefer not to say",
  };
  return map[label] ?? String(label).toLowerCase();
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function HealthProfile({ onBack, onContinue }) {
  const storedIdentity = useMemo(() => {
    return safeParse(window.localStorage.getItem("cipher_identity"));
  }, []);

  const [ageRange, setAgeRange] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [gender, setGender] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronic, setChronic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = safeParse(window.localStorage.getItem("healthProfile"));
    if (existing) {
      setAgeRange(existing.ageRange ?? "");
      setBloodType(existing.bloodType ?? "");
      setGender(existing.gender ?? "");
      setAllergies(existing.allergies ?? "");
      setChronic(existing.chronic ?? "");
    }
  }, []);

  const persist = useCallback(
    (next) => {
      const payload = {
        ageRange: next.ageRange ?? ageRange,
        bloodType: next.bloodType ?? bloodType,
        gender: next.gender ?? gender,
        allergies: next.allergies ?? allergies,
        chronic: next.chronic ?? chronic,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem("healthProfile", JSON.stringify(payload));
      return payload;
    },
    [ageRange, bloodType, gender, allergies, chronic]
  );

  const canContinue = Boolean(ageRange && bloodType && gender);

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
        {/* top row: step indicator + back */}
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
              Onboarding — Step 2 of 2
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 60,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: ACCENT,
                    opacity: 0.65,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Health Profile
              </span>
            </div>
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
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.color = ACCENT)}
            onMouseLeave={(e) => (e.target.style.color = "rgba(181,236,52,0.5)")}
          >
            ← Back
          </button>
        </div>

        {/* title */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)",
              fontWeight: 800,
              color: "#f1f5f9",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              marginBottom: 10,
              lineHeight: 1.05,
            }}
          >
            Health Profile
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.4)",
              maxWidth: 620,
              margin: 0,
            }}
          >
            Provide minimal health context to personalize your protocol avatar and
            help simulate pool risk models. No personal identifiers are stored.
          </p>
        </div>

        {/* body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 28,
            alignItems: "start",
          }}
          className="hp-grid"
        >
          {/* avatar */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 12,
              }}
            >
              Avatar Preview
            </p>
            <AvatarPreview
              ageRange={ageRange}
              gender={gender || "Prefer not to say"}
            />

            {storedIdentity?.alias && (
              <div style={{ marginTop: 14 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: 6,
                  }}
                >
                  Alias
                </p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "rgba(241,245,249,0.9)",
                    margin: 0,
                  }}
                >
                  {storedIdentity.alias}
                </p>
              </div>
            )}
          </div>

          {/* inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <Label>Age Range</Label>
              <Select
                value={ageRange}
                onChange={(v) => {
                  setAgeRange(v);
                  persist({ ageRange: v });
                }}
                options={AGE_OPTIONS}
                placeholder="Select age range"
              />
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 8,
                  letterSpacing: "0.03em",
                }}
              >
                Used to render avatar and pool risk banding.
              </p>
            </div>

            <div>
              <Label>Blood Type</Label>
              <Select
                value={bloodType}
                onChange={(v) => {
                  setBloodType(v);
                  persist({ bloodType: v });
                }}
                options={BLOOD_OPTIONS}
                placeholder="Select blood type"
              />
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 8,
                  letterSpacing: "0.03em",
                }}
              >
                Stored as a protocol attribute (optional for simulation).
              </p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Gender</Label>
              <Select
                value={gender}
                onChange={(v) => {
                  setGender(v);
                  persist({ gender: v });
                }}
                options={GENDER_OPTIONS}
                placeholder="Select gender"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Allergies</Label>
              <TextArea
                value={allergies}
                onChange={(v) => {
                  setAllergies(v);
                  persist({ allergies: v });
                }}
                placeholder="List allergies (comma-separated). e.g. peanuts, penicillin"
              />
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 8,
                  letterSpacing: "0.03em",
                }}
              >
                Not medical advice — used only to display protocol indicators.
              </p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Chronic Conditions</Label>
              <TextArea
                value={chronic}
                onChange={(v) => {
                  setChronic(v);
                  persist({ chronic: v });
                }}
                placeholder="List conditions (comma-separated). e.g. asthma, hypertension"
              />
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 8,
                  letterSpacing: "0.03em",
                }}
              >
                Stored as encrypted-like metadata (demo only).
              </p>
            </div>
          </div>
        </div>

        {/* footer actions */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.02em",
            }}
          >
            Required: age range, blood type, and gender.
          </p>

          <button
            onClick={async () => {
              if (!canContinue) return;
              setError("");
              setSubmitting(true);
              try {
                const { anonymousId, encryptionKey } = getSession();
                if (!anonymousId || !encryptionKey) {
                  throw new Error("Your session expired. Please go back and create your identity again.");
                }
                const payload = persist({});
                await saveHealthProfile(anonymousId, encryptionKey, {
                  ageRange: payload.ageRange,
                  bloodType: payload.bloodType,
                  gender: genderToApiValue(payload.gender),
                  allergies: payload.allergies ?? "",
                  conditions: payload.chronic ?? "",
                });
                onContinue(payload);
              } catch (e) {
                setError(e?.message || "Could not save your profile. Please try again.");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!canContinue || submitting}
            style={{
              padding: "14px 40px",
              border: "none",
              borderRadius: 6,
              background: canContinue && !submitting ? ACCENT : "rgba(181,236,52,0.15)",
              color: canContinue && !submitting ? "#050505" : "rgba(181,236,52,0.3)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: canContinue && !submitting ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "opacity 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (canContinue && !submitting) e.target.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = "1";
            }}
          >
            {submitting ? "Saving…" : "Next"}
          </button>
        </div>

        {error ? (
          <p style={{ marginTop: 14, fontSize: 13, color: "#fda4af", lineHeight: 1.5 }}>{error}</p>
        ) : null}

        {/* responsive note */}
        <style>{`
          @media (max-width: 820px) {
            .hp-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

