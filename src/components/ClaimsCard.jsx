import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCENT } from "./OnboardingCommon.jsx";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  CLAIMS_UPDATED_EVENT,
  readClaimsFromStorage,
  readVerdictSnapshot,
} from "../lib/verdictClaimSync.js";

export function ClaimsCard({ onStartClaim }) {
  const [claims, setClaims] = useState(() => readClaimsFromStorage());

  useEffect(() => {
    const refresh = () => setClaims(readClaimsFromStorage());
    window.addEventListener(CLAIMS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CLAIMS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const hasClaims = claims && claims.length > 0;

  return (
    <Motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        padding: "20px 20px 22px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 0% 0%, rgba(181,236,52,0.08), transparent 50%), rgba(15,23,42,0.9)",
        minHeight: 180,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(148,163,184,0.95)",
            margin: 0,
          }}
        >
          Your Claims
        </p>

        <button
          type="button"
          onClick={typeof onStartClaim === "function" ? onStartClaim : undefined}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.65)",
            background: "transparent",
            color: "rgba(226,232,240,0.96)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Submit a claim
        </button>
      </div>

      {!hasClaims ? (
        <Motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            marginTop: 12,
            padding: "16px 14px",
            borderRadius: 12,
            border: "1px dashed rgba(148,163,184,0.6)",
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.75))",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(148,163,184,0.96)",
            }}
          >
            No active claims. When you submit a claim it will appear here with its stage
            in the protocol.
          </p>
        </Motion.div>
      ) : (
        <Motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 6,
          }}
        >
          <AnimatePresence>
            {claims.map((c) => (
              <ClaimRow key={c.id} claim={c} />
            ))}
          </AnimatePresence>
        </Motion.div>
      )}
    </Motion.section>
  );
}

const STAGE_ORDER = ["Pre-check", "Jury review", "Decision"];

function ClaimRow({ claim }) {
  const navigate = useNavigate();
  const stageIndex = Math.max(
    0,
    STAGE_ORDER.indexOf(claim.stage || "Pre-check")
  );
  const progress = ((stageIndex + 1) / STAGE_ORDER.length) * 100;

  const hasVerdict =
    claim.status === "Approved" || claim.status === "Rejected";

  let statusColor = "rgba(250,204,21,0.95)";
  if (claim.status === "Approved") statusColor = "rgba(190,242,100,0.96)";
  if (claim.status === "Rejected") statusColor = "rgba(248,113,113,0.96)";
  if (claim.status === "Pending") statusColor = "rgba(148,163,184,0.96)";
  if (claim.status === "Under Jury Review")
    statusColor = "rgba(181,236,52,0.95)";

  const openVerdict = () => {
    if (!hasVerdict) return;
    const snap = readVerdictSnapshot();
    if (snap?.caseResult) {
      navigate("/final-verdict", { state: { caseResult: snap.caseResult } });
    } else {
      navigate("/final-verdict");
    }
  };

  return (
    <Motion.div
      role={hasVerdict ? "button" : undefined}
      tabIndex={hasVerdict ? 0 : undefined}
      onClick={hasVerdict ? openVerdict : undefined}
      onKeyDown={
        hasVerdict
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openVerdict();
              }
            }
          : undefined
      }
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hasVerdict ? { y: -4, scale: 1.01 } : { y: -4 }}
      transition={{ duration: 0.26 }}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: hasVerdict
          ? `1px solid ${claim.status === "Rejected" ? "rgba(248,113,113,0.45)" : "rgba(190,242,100,0.45)"}`
          : "1px solid rgba(148,163,184,0.5)",
        background: "rgba(15,23,42,0.95)",
        boxShadow: hasVerdict
          ? claim.status === "Rejected"
            ? "0 12px 36px rgba(248,113,113,0.12)"
            : "0 12px 36px rgba(181,236,52,0.15)"
          : "0 12px 30px rgba(0,0,0,0.28)",
        cursor: hasVerdict ? "pointer" : "default",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.9)",
            }}
          >
            Claim {claim.id}
          </p>
          <p
            style={{
              margin: 2,
              fontSize: 12,
              color: "rgba(226,232,240,0.9)",
            }}
          >
            Stage: {claim.stage}
          </p>
          {claim.stageDetail ? (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "rgba(148,163,184,0.9)",
              }}
            >
              {claim.stageDetail}
            </p>
          ) : null}
          {typeof claim.jurorCount === "number" &&
          claim.stage === "Jury review" &&
          !hasVerdict ? (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "rgba(148,163,184,0.9)",
              }}
            >
              {claim.jurorCount} jurors evaluating
            </p>
          ) : null}
          {hasVerdict ? (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(148,163,184,0.65)",
              }}
            >
              Tap to view verdict
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "2px 10px",
            borderRadius: 999,
            border: `1px solid ${statusColor}`,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: statusColor,
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: statusColor,
            }}
          >
            {hasVerdict ? claim.status.toUpperCase() : claim.status}
          </span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 999,
          background: "rgba(15,23,42,1)",
          border: "1px solid rgba(30,64,175,0.7)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(90deg, rgba(51,65,85,0.8) 1px, transparent 1px)",
            backgroundSize: "12px 100%",
            opacity: 0.6,
          }}
        />
        <Motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "relative",
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${ACCENT}, ${statusColor})`,
          }}
        />
      </div>
    </Motion.div>
  );
}

