import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";

const glassShell = {
  background:
    "linear-gradient(135deg, rgba(181,236,52,0.06) 0%, rgba(10,16,28,0.8) 40%, rgba(10,16,28,0.9) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(181,236,52,0.1)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(181,236,52,0.05)",
  padding: "24px",
};

export function BecomeReviewerCard({ variant } = {}) {
  const navigate = useNavigate();
  const [isJuror, setIsJuror] = useState(() => window.localStorage.getItem("cipher_is_juror") === "true");

  useEffect(() => {
    if (variant === "verifiedJuror") return;
    const { anonymousId } = getSession();
    if (!anonymousId) return;
    fetch(`${API_URL}/members/juror-status?anonymous_id=${encodeURIComponent(anonymousId)}`)
      .then((r) => r.json())
      .then((d) => {
        const j = Boolean(d?.is_juror);
        setIsJuror(j);
        if (j) window.localStorage.setItem("cipher_is_juror", "true");
        else window.localStorage.removeItem("cipher_is_juror");
      })
      .catch(() => {});
  }, [variant]);

  if (variant === "verifiedJuror") {
    return (
      <Motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={glassShell}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(181,236,52,0.5)",
          }}
        >
          Reviewer network
        </p>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
          }}
        >
          You are a verified juror
        </p>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Your reviews feed the shared pool&apos;s fairness signals. Complete assigned cases on time so
          members receive timely decisions.
        </p>
      </Motion.section>
    );
  }

  if (isJuror) return null;

  return (
    <Motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={glassShell}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(181,236,52,0.5)",
        }}
      >
        Reviewer network
      </p>
      <p
        style={{
          margin: "12px 0 0",
          fontSize: "16px",
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "-0.01em",
          lineHeight: 1.4,
        }}
      >
        Become a reviewer — Join the verified medical peer network
      </p>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 13,
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Apply with your credentials and complete a short trial case. The protocol routes only medical
        evaluation to reviewers; financial decisions stay automated.
      </p>
      <button
        type="button"
        onClick={() => {
          navigate("/juror-application");
          window.scrollTo(0, 0);
        }}
        style={{
          marginTop: 18,
          padding: "10px 22px",
          borderRadius: "20px",
          border: "none",
          background: "#b5ec34",
          color: "#000",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Start application
      </button>
    </Motion.section>
  );
}
