import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { API_URL } from "../config/api.js";
import { getSession } from "../lib/session.js";

export function BecomeReviewerCard() {
  const navigate = useNavigate();
  const [isJuror, setIsJuror] = useState(() => window.localStorage.getItem("cipher_is_juror") === "true");

  useEffect(() => {
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
  }, []);

  if (isJuror) return null;

  return (
    <Motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        padding: "22px 24px",
        borderRadius: 18,
        border: "1px solid rgba(251,191,36,0.42)",
        background:
          "linear-gradient(135deg, rgba(251,191,36,0.07), transparent 50%), rgba(15,23,42,0.9)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(251,191,36,0.9)",
        }}
      >
        Reviewer network
      </p>
      <p
        style={{
          margin: "12px 0 0",
          fontSize: 17,
          fontWeight: 750,
          color: "#fef3c7",
          letterSpacing: "-0.02em",
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
          color: "rgba(226,232,240,0.85)",
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
          padding: "12px 22px",
          borderRadius: 999,
          border: "1px solid rgba(251,191,36,0.55)",
          background: "rgba(251,191,36,0.14)",
          color: "#fbbf24",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Start application
      </button>
    </Motion.section>
  );
}
