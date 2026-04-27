import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ACCENT } from "./OnboardingCommon.jsx";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";
import {
  CLAIMS_UPDATED_EVENT,
  readClaimsFromStorage,
} from "../lib/verdictClaimSync.js";
import { BecomeReviewerCard } from "./BecomeReviewerCard.jsx";
import { JurorAssignedCasesClipboardSection } from "./JurorAssignedCasesClipboardSection.jsx";
import { DottedCircleStat } from "./DottedCircleStat.jsx";
import { JUROR_MOCK_CASES } from "../data/jurorMockData.js";
import { PROTOCOL_PAGE_BACKGROUND } from "../lib/protocolPageBackground.js";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const PLAN_LABEL = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

const LEVEL_DISPLAY = {
  newcomer: "NEWCOMER",
  contributor: "CONTRIBUTOR",
  trusted: "TRUSTED",
  expert: "EXPERT",
};

function HeartRateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="protocol-label-icon protocol-label-icon-heart"
    >
      <path
        className="protocol-heart-rate-path"
        d="M2.5 13.5h4l2.1-4.2 3.1 8.2 2.6-5.4h7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="protocol-label-icon">
      <path
        d="M12 2.8 5.2 5.7v5.5c0 4.2 2.6 7.9 6.8 10 4.2-2.1 6.8-5.8 6.8-10V5.7L12 2.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.1 11.1 13.8 14.7 10.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MedicalCrossIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="protocol-label-icon">
      <path
        d="M10 4.5h4v5.5h5.5v4H14v5.5h-4V14H4.5v-4H10V4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoleBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="protocol-label-icon">
      <circle cx="12" cy="8.2" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.8 19.2c1.3-3.4 3.6-5.1 6.2-5.1s4.9 1.7 6.2 5.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TierStackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="protocol-label-icon">
      <path
        d="M4.5 7.2h15M6.5 12h11M8.5 16.8h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActivityPulseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="protocol-label-icon">
      <path
        d="M3 12h4l2-4 3.2 8 2.6-5H21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function JurorDashboard() {
  const navigate = useNavigate();

  const reviewCaseId = useMemo(() => {
    const flagged = JUROR_MOCK_CASES.find((c) => c.lastInteracted)?.id;
    return flagged || JUROR_MOCK_CASES[0]?.id || "A392";
  }, []);

  const identityAlias = useMemo(() => {
    try {
      const raw = window.localStorage.getItem("cipher_identity");
      return raw ? JSON.parse(raw)?.alias : null;
    } catch {
      return null;
    }
  }, []);

  const subscription = useMemo(
    () => safeParse(window.localStorage.getItem("cipher_subscription")),
    []
  );

  const tierLabel = PLAN_LABEL[subscription?.planId] || PLAN_LABEL.standard;

  const [rpData, setRpData] = useState(null);
  const [noSession, setNoSession] = useState(false);

  useEffect(() => {
    const { anonymousId } = getSession();
    if (!anonymousId) {
      setNoSession(true);
      return;
    }
    setNoSession(false);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/members/rp/${encodeURIComponent(anonymousId)}`
        );
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Could not load reputation");
        if (!cancelled) setRpData(j);
      } catch {
        if (!cancelled) setRpData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reputationPoints =
    noSession || rpData == null
      ? null
      : Math.round(Number(rpData?.reputation_points ?? 0));
  const reputationLevelLabel =
    LEVEL_DISPLAY[rpData?.rp_level] || LEVEL_DISPLAY.newcomer;

  const [dashboardClaims, setDashboardClaims] = useState(() =>
    readClaimsFromStorage()
  );

  useEffect(() => {
    const onUpdate = () => setDashboardClaims(readClaimsFromStorage());
    window.addEventListener(CLAIMS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CLAIMS_UPDATED_EVENT, onUpdate);
  }, []);

  const hasDashboardClaims =
    Array.isArray(dashboardClaims) && dashboardClaims.length > 0;
  const transparencyPercentages = useMemo(
    () => ({ approvedPct: 67, deniedPct: 21, reEvalPct: 12 }),
    []
  );

  const glassCardShell = {
    background:
      "linear-gradient(135deg, rgba(181,236,52,0.06) 0%, rgba(10,16,28,0.8) 40%, rgba(10,16,28,0.9) 100%)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(181,236,52,0.1)",
    borderRadius: "16px",
    boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(181,236,52,0.05)",
  };

  const overviewCardShell = {
    ...glassCardShell,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    height: "100%",
    boxSizing: "border-box",
  };

  const statCardShell = {
    ...glassCardShell,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: 0,
  };

  const statLabelStyle = {
    fontSize: 14,
    letterSpacing: "0.15em",
    color: "rgba(255,255,255,0.3)",
    marginBottom: "6px",
    textTransform: "uppercase",
  };

  const statLabelWithIconStyle = {
    ...statLabelStyle,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  const statValueLarge = { fontSize: 32, fontWeight: 700, color: ACCENT };
  const statValueMedium = { fontSize: 22, fontWeight: 600, color: "#fff" };

  const actionButtonBase = {
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    borderRadius: "20px",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const filledActionButton = {
    ...actionButtonBase,
    background: "#b5ec34",
    color: "#000",
    border: "none",
  };

  const ghostActionButton = {
    ...actionButtonBase,
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.15)",
  };

  const navPillBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "calc(100% - 16px)",
    boxSizing: "border-box",
    margin: "4px 8px",
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderRadius: 20,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.45)",
    background: "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
    fontFamily: "inherit",
  };

  const navPillActive = {
    background: "#b5ec34",
    color: "#000000",
    fontWeight: 700,
    border: "none",
    opacity: 1,
  };

  const navPillHoverReset = (el) => {
    el.style.border = "1px solid rgba(255, 255, 255, 0.08)";
    el.style.color = "rgba(255, 255, 255, 0.45)";
  };

  const navPillHoverIn = (el) => {
    el.style.borderColor = "rgba(255, 255, 255, 0.16)";
    el.style.color = "rgba(255, 255, 255, 0.62)";
  };

  const onOpenReview = () => {
    navigate(`/case-review/${encodeURIComponent(reviewCaseId)}`);
    window.scrollTo(0, 0);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        height: "100vh",
        minHeight: 600,
        ...PROTOCOL_PAGE_BACKGROUND,
        overflow: "auto",
        overflowX: "hidden",
        cursor: "crosshair",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          padding: "20px clamp(12px, 2vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(6, 8, 16, 0.9)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Cipher" role="img">
            <rect width="6" height="6" x="2" y="2" fill="#b4c814" />
            <rect width="6" height="6" x="10" y="2" fill="#b4c814" opacity="0.6" />
            <rect width="6" height="6" x="2" y="10" fill="#b4c814" opacity="0.6" />
            <rect width="6" height="6" x="10" y="10" fill="#b4c814" />
            <rect width="6" height="6" x="16" y="16" fill="#b4c814" opacity="0.4" />
          </svg>
          <span
            style={{
              color: ACCENT,
              fontSize: 14,
              letterSpacing: "0.16em",
              fontWeight: 800,
            }}
          >
            CIPHER
          </span>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px 14px",
            color: "rgba(255,255,255,0.62)",
            fontSize: 14,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {["Protocol", "How It Works", "Governance"].map((item) => (
            <button
              key={item}
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: "4px 2px",
                font: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                cursor: "pointer",
                transition: "color 160ms ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
                maxWidth: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.62)";
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            navigate("/");
            window.scrollTo(0, 0);
          }}
          style={{
            ...ghostActionButton,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          BACK TO HOME
        </button>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            background:
              "linear-gradient(180deg, rgba(181,236,52,0.04) 0%, rgba(10,16,28,0.6) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(181, 236, 52, 0.06)",
            padding: "24px 0",
            position: "sticky",
            top: 60,
            height: "calc(100vh - 60px)",
            display: "flex",
            flexDirection: "column",
            alignSelf: "flex-start",
          }}
        >
          <button
            type="button"
            onClick={() => {
              navigate("/protocol-dashboard");
              window.scrollTo(0, 0);
            }}
            style={navPillBase}
            onMouseEnter={(e) => navPillHoverIn(e.currentTarget)}
            onMouseLeave={(e) => navPillHoverReset(e.currentTarget)}
          >
            Hub
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("/claim-intake");
              window.scrollTo(0, 0);
            }}
            style={navPillBase}
            onMouseEnter={(e) => navPillHoverIn(e.currentTarget)}
            onMouseLeave={(e) => navPillHoverReset(e.currentTarget)}
          >
            Submit Claim
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("/emergency-access");
              window.scrollTo(0, 0);
            }}
            style={navPillBase}
            onMouseEnter={(e) => navPillHoverIn(e.currentTarget)}
            onMouseLeave={(e) => navPillHoverReset(e.currentTarget)}
          >
            Emergency Access
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("/governance");
              window.scrollTo(0, 0);
            }}
            style={navPillBase}
            onMouseEnter={(e) => navPillHoverIn(e.currentTarget)}
            onMouseLeave={(e) => navPillHoverReset(e.currentTarget)}
          >
            Governance
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("/juror-dashboard");
              window.scrollTo(0, 0);
            }}
            style={{ ...navPillBase, ...navPillActive }}
          >
            Jury Duty
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("/");
              window.scrollTo(0, 0);
            }}
            style={navPillBase}
            onMouseEnter={(e) => navPillHoverIn(e.currentTarget)}
            onMouseLeave={(e) => navPillHoverReset(e.currentTarget)}
          >
            Back to Landing
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 14px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              marginTop: "auto",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ACCENT,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 14,
                color: "rgba(255,255,255,0.85)",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {identityAlias || "—"}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: ACCENT,
                flexShrink: 0,
              }}
            >
              ACTIVE
            </span>
          </div>
        </aside>

        <main style={{ flex: 1, padding: "24px 16px", minWidth: 0 }}>
          <div
            style={{
              width: "100%",
              maxWidth: 1320,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <h1
              style={{
                margin: "8px 0 24px",
                fontSize: 50,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#fff",
              }}
            >
              Hello, {identityAlias || "Member"}
            </h1>

            <div
              className="protocol-top-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 11fr) minmax(0, 9fr)",
                gap: 20,
                alignItems: "stretch",
              }}
            >
              <Motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                style={{ minHeight: 0, display: "flex", flexDirection: "column", height: "100%" }}
              >
                <section style={overviewCardShell}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        color: "rgba(181,236,52,0.5)",
                        fontWeight: 600,
                      }}
                    >
                      YOUR CLAIMS
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/claim-intake");
                          window.scrollTo(0, 0);
                        }}
                        style={{
                          ...filledActionButton,
                        }}
                      >
                        Submit claim
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/emergency-access");
                          window.scrollTo(0, 0);
                        }}
                        style={{
                          ...ghostActionButton,
                        }}
                      >
                        Emergency
                      </button>
                    </div>
                  </div>

                  {!hasDashboardClaims ? (
                    <div
                      style={{
                        ...glassCardShell,
                        border: "1px dashed rgba(181,236,52,0.18)",
                        padding: 40,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 16,
                        flex: 1,
                        minHeight: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          border: "1.5px dashed rgba(181,236,52,0.15)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "rgba(181,236,52,0.25)",
                          fontSize: 22,
                          lineHeight: 1,
                        }}
                      >
                        +
                      </div>
                      <p
                        style={{
                          margin: "12px 0 0",
                          fontSize: 14,
                          color: "rgba(255,255,255,0.2)",
                          textAlign: "center",
                          maxWidth: 280,
                        }}
                      >
                        No active claims yet. Submit your first claim to get started.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        flex: 1,
                        minHeight: 0,
                        overflow: "auto",
                      }}
                    >
                      {dashboardClaims.map((c) => (
                        <div
                          key={c.id}
                          className="protocol-dashboard-claim-row"
                          style={{
                            ...glassCardShell,
                            padding: "12px 14px",
                            transition: "all 0.3s ease",
                            cursor: "default",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 14,
                              letterSpacing: "0.12em",
                              color: "rgba(148,163,184,0.9)",
                              textTransform: "uppercase",
                            }}
                          >
                            Claim {c.id}
                          </p>
                          <p
                            style={{
                              margin: "6px 0 0",
                              fontSize: 14,
                              color: "rgba(226,232,240,0.92)",
                            }}
                          >
                            {c.status || c.stage || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </Motion.div>
              <Motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  height: "100%",
                  alignSelf: "stretch",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gridTemplateRows: "1fr 1fr",
                    gap: "14px",
                    flex: 1,
                    minHeight: 0,
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <div style={statCardShell}>
                    <div style={statLabelWithIconStyle}>
                      <HeartRateIcon />
                      <span>Reputation</span>
                    </div>
                    <div style={statValueLarge}>
                      {reputationPoints == null ? "—" : reputationPoints}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        letterSpacing: "0.1em",
                        color: "rgba(181,236,52,0.5)",
                        marginTop: "4px",
                      }}
                    >
                      {reputationPoints == null ? "—" : reputationLevelLabel}
                    </div>
                  </div>

                  <div style={statCardShell}>
                    <div style={statLabelWithIconStyle}>
                      <ShieldIcon />
                      <span>Pool Health</span>
                    </div>
                    <div style={statValueLarge}>+2.1%</div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.2)",
                        marginTop: "4px",
                      }}
                    >
                      UPDATED 4M AGO
                    </div>
                  </div>

                  <div style={statCardShell}>
                    <div style={statLabelWithIconStyle}>
                      <RoleBadgeIcon />
                      <span>Your role</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px", fontWeight: 600, color: "#b5ec34" }}>
                        Juror
                      </span>
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#b5ec34",
                        }}
                      />
                    </div>
                  </div>

                  <div style={statCardShell}>
                    <div style={statLabelWithIconStyle}>
                      <TierStackIcon />
                      <span>Contribution Tier</span>
                    </div>
                    <div style={statValueMedium}>{tierLabel}</div>
                  </div>
                </div>
              </Motion.div>
            </div>

            <Motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13, duration: 0.35 }}
            >
              <section
                style={{
                  ...glassCardShell,
                  padding: "24px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    letterSpacing: "0.15em",
                    color: "rgba(181,236,52,0.5)",
                    textTransform: "uppercase",
                    marginBottom: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ActivityPulseIcon />
                  <span>NEW UPDATES</span>
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  You have a new case to review
                </h2>
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.4)",
                    maxWidth: 640,
                  }}
                >
                  Open the review flow when you are ready — your response helps the pool reach a fair
                  decision.
                </p>
                <button type="button" onClick={onOpenReview} style={{ ...filledActionButton, marginTop: 18 }}>
                  OPEN REVIEW
                </button>
              </section>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.35 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr",
                  gap: "14px",
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    ...statCardShell,
                    padding: "24px",
                    minHeight: 330,
                    height: 330,
                    maxHeight: 330,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      ...statLabelStyle,
                      fontSize: 14,
                      color: "rgba(181,236,52,0.9)",
                      marginBottom: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <ShieldIcon />
                    <span>Pool health</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "36px",
                      marginBottom: "20px",
                      marginTop: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "#b5ec34" }}>72%</div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "rgba(181,236,52,0.5)",
                          letterSpacing: "0.1em",
                          marginTop: "2px",
                        }}
                      >
                        STABLE
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>₹3.1M</div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "rgba(255,255,255,0.3)",
                          letterSpacing: "0.1em",
                          marginTop: "2px",
                        }}
                      >
                        RESERVE
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>38</div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "rgba(255,255,255,0.3)",
                          letterSpacing: "0.1em",
                          marginTop: "2px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <MedicalCrossIcon />
                        <span>ACTIVE CLAIMS</span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      gap: 24,
                      flexWrap: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center", flex: 1, minWidth: 0 }}>
                      <DottedCircleStat
                        percentage={transparencyPercentages.approvedPct}
                        color="#b5ec34"
                        text="cases were approved after peer jury review."
                        delayMs={0}
                        compact
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", flex: 1, minWidth: 0 }}>
                      <DottedCircleStat
                        percentage={transparencyPercentages.deniedPct}
                        color="#f87171"
                        text="cases were denied due to insufficient evidence."
                        delayMs={180}
                        compact
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", flex: 1, minWidth: 0 }}>
                      <DottedCircleStat
                        percentage={transparencyPercentages.reEvalPct}
                        color="#fbbf24"
                        text="cases moved to re-evaluation for deeper review."
                        delayMs={360}
                        compact
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.15)", marginTop: "16px" }}>
                    Live aggregate data. No individual cases exposed.
                  </div>
                </div>

                <div
                  style={{
                    ...statCardShell,
                    padding: "24px",
                    minHeight: 330,
                    height: 330,
                    maxHeight: 330,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      ...statLabelStyle,
                      fontSize: 14,
                      marginBottom: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <ActivityPulseIcon />
                    <span>System activity</span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
                    {[
                      { text: "3 claims approved today", time: "2m", positive: true },
                      { text: "Pool dropped by 2%", time: "17m", positive: false },
                      { text: "Jury assigned to case #A392", time: "32m", positive: true },
                      { text: "Reserve recovered by 1.2%", time: "1h", positive: true },
                    ].map((item) => (
                      <div
                        key={`${item.text}-${item.time}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: item.positive ? "#b5ec34" : "rgba(255,255,255,0.25)",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", flex: 1 }}>
                          {item.text}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            color: "rgba(255,255,255,0.15)",
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          }}
                        >
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.35 }}
            >
              <BecomeReviewerCard variant="verifiedJuror" />
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44, duration: 0.35 }}
            >
              <JurorAssignedCasesClipboardSection />
            </Motion.div>

            <style>{`
          @media (max-width: 900px) {
            .protocol-top-grid,
            .protocol-bottom-grid {
              grid-template-columns: 1fr !important;
            }
          }
          .protocol-dashboard-claim-row {
            transition: all 0.3s ease;
          }
          .protocol-dashboard-claim-row:hover {
            border-color: rgba(181,236,52,0.2);
            box-shadow: 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(181,236,52,0.08);
            transform: translateY(-2px);
          }
          .protocol-label-icon {
            width: 17px;
            height: 17px;
            color: rgba(255,255,255,0.6);
            opacity: 0.6;
            flex-shrink: 0;
            animation: protocolIconBreath 3.2s ease-in-out infinite;
          }
          .protocol-label-icon-heart {
            animation-duration: 2.8s;
          }
          .protocol-heart-rate-path {
            stroke-dasharray: 30;
            stroke-dashoffset: 0;
            animation: protocolHeartTrace 2.6s ease-in-out infinite;
          }
          @keyframes protocolIconBreath {
            0%, 100% { opacity: 0.5; transform: translateY(0); }
            50% { opacity: 0.68; transform: translateY(-0.6px); }
          }
          @keyframes protocolHeartTrace {
            0% { stroke-dashoffset: 20; }
            45% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -20; }
          }
        `}</style>
          </div>
        </main>
      </div>
    </div>
  );
}
