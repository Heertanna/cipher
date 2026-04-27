import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { JUROR_MOCK_CASES, resolveJuryCaseType } from "../data/jurorMockData.js";

const GLASS_CARD = {
  background:
    "linear-gradient(135deg, rgba(181,236,52,0.06) 0%, rgba(10,16,28,0.8) 40%, rgba(10,16,28,0.9) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(181,236,52,0.1)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(181,236,52,0.05)",
};

const LIVE_CASES_SECTION_GLASS = {
  background:
    "linear-gradient(145deg, rgba(181,236,52,0.05) 0%, rgba(10,16,28,0.85) 30%, rgba(10,16,28,0.9) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(181,236,52,0.1)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(181,236,52,0.05)",
};

function JurorAssignedClipboardCard({ c, index }) {
  const navigate = useNavigate();
  const isPending = String(c.status || "").toLowerCase().includes("pending");
  const statusLabel = isPending ? "PENDING" : "IN PROGRESS";
  const statusColor = isPending ? "rgba(255,255,255,0.35)" : "#b5ec34";
  const juryType = resolveJuryCaseType(c);
  const isEmergency =
    c.emergency === true || String(juryType).toLowerCase() === "emergency";
  const priorityLabel = isEmergency
    ? "EMERGENCY"
    : String(juryType || "Planned").toUpperCase();
  const priorityColor = isEmergency ? "#b5ec34" : "rgba(255,255,255,0.55)";
  const responded = Math.max(0, Number(c.responded) || 0);
  const total = Math.max(1, Number(c.totalJurors) || 10);
  const progressPct = Math.min(100, Math.round((responded / total) * 100));
  const progressWidth = `${progressPct}%`;
  const stampRotate = index % 2 === 0 ? "rotate(-2deg)" : "rotate(1deg)";

  const filledActionButton = {
    marginTop: 16,
    width: "100%",
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    borderRadius: "20px",
    cursor: "pointer",
    fontFamily: "inherit",
    background: "#b5ec34",
    color: "#000",
    border: "none",
  };

  return (
    <div
      className="juror-assigned-glass-card"
      style={{
        ...GLASS_CARD,
        width: "100%",
        textAlign: "left",
        overflow: "visible",
        position: "relative",
        padding: 4,
        transition: "all 0.3s ease",
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -16,
          left: "50%",
          transform: "translateX(-50%)",
          width: 80,
          height: 28,
          background: "rgba(181,236,52,0.15)",
          border: "2px solid rgba(181,236,52,0.25)",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid rgba(181,236,52,0.4)",
            background: "rgba(6,8,16,0.9)",
          }}
        />
      </div>

      <div
        style={{
          border: "1px solid rgba(181,236,52,0.08)",
          borderRadius: 4,
          background: "rgba(10,16,28,0.9)",
          minHeight: 0,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "rgba(181,236,52,0.06)",
            padding: "12px 20px",
            borderBottom: "1px solid rgba(181,236,52,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(181,236,52,0.7)",
              letterSpacing: "0.04em",
            }}
          >
            CASE #{c.id}
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.12em",
              color: "rgba(181,236,52,0.3)",
              textTransform: "uppercase",
            }}
          >
            CONFIDENTIAL
          </span>
        </div>

        <div
          style={{
            padding: "20px 22px 22px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 32px, rgba(181,236,52,0.04) 32px, rgba(181,236,52,0.04) 33px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid rgba(181,236,52,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#b5ec34",
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: 12,
              minHeight: 28,
            }}
          >
            <span
              style={{
                border: `2px solid ${isPending ? "rgba(255,255,255,0.2)" : "rgba(181,236,52,0.35)"}`,
                padding: "4px 12px",
                fontSize: 14,
                letterSpacing: "0.12em",
                color: statusColor,
                transform: stampRotate,
                textTransform: "uppercase",
                lineHeight: 1,
                fontWeight: 700,
              }}
            >
              {statusLabel}
            </span>
          </div>

          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Priority
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: priorityColor, letterSpacing: "0.04em" }}>
              {priorityLabel}
            </div>
          </div>

          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Case summary
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              {c.description}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                Juror responses
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
                {responded} / {total} jurors responded
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                Time remaining
              </div>
              <div style={{ fontSize: 14, color: "#b5ec34" }}>{c.timeLeft || "—"}</div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div
              style={{
                height: 2,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 1,
                position: "relative",
                overflow: "visible",
              }}
            >
              <div
                style={{
                  height: 2,
                  background: "#b5ec34",
                  width: progressWidth,
                  borderRadius: 1,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    right: -2.5,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#b5ec34",
                    boxShadow: "0 0 10px rgba(181,236,52,0.9)",
                    animation: "jurorAssignedPulse 1.6s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "rgba(255,255,255,0.15)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {progressPct}% pool responses
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              navigate(`/case-review/${encodeURIComponent(c.id)}`);
              window.scrollTo(0, 0);
            }}
            style={filledActionButton}
          >
            REVIEW CASE
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Assigned-case clipboard grid for the juror dashboard.
 * Data: {@link JUROR_MOCK_CASES} (extend to API when available).
 */
export function JurorAssignedCasesClipboardSection() {
  const assignedCases = useMemo(() => [...JUROR_MOCK_CASES], []);
  const pendingCount = useMemo(
    () => assignedCases.filter((c) => String(c.status || "").toLowerCase().includes("pending")).length,
    [assignedCases]
  );

  return (
    <section
      style={{
        ...LIVE_CASES_SECTION_GLASS,
        padding: 28,
        marginTop: 14,
        overflow: "visible",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(181,236,52,0.5)",
          }}
        >
          CASES ASSIGNED TO YOU
        </p>
        <span
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.14em",
          }}
        >
          {pendingCount} PENDING
        </span>
      </div>

      <div
        className="juror-assigned-cases-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {assignedCases.map((c, index) => (
          <JurorAssignedClipboardCard key={c.id} c={c} index={index} />
        ))}
      </div>

      <style>{`
        @keyframes jurorAssignedPulse {
          0%, 100% { opacity: 0.75; transform: translateY(-50%) scale(1); }
          50% { opacity: 1; transform: translateY(-50%) scale(1.25); }
        }
        .juror-assigned-glass-card:hover {
          border-color: rgba(181,236,52,0.2);
          box-shadow: 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(181,236,52,0.08);
          transform: translateY(-2px);
        }
        @media (min-width: 1100px) {
          .juror-assigned-cases-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
