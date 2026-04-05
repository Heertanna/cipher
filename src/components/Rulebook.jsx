import React, { useEffect, useRef, useState, useCallback } from "react";

const ACCENT = "#b5ec34";

const RULES = [
  {
    num: "01",
    title: "Collective Pool",
    desc: "Members contribute to a shared treasury that funds medical care for the network.",
  },
  {
    num: "02",
    title: "Instant Care",
    desc: "Common treatments are automatically approved and paid by the protocol.",
  },
  {
    num: "03",
    title: "Expert Jury",
    desc: "Complex cases are reviewed by a randomly selected panel of medical professionals.",
  },
  {
    num: "04",
    title: "Transparent Decisions",
    desc: "Jurors must submit medical reasoning. All decisions are recorded for accountability.",
  },
  {
    num: "05",
    title: "Pool Protection",
    desc: "Built-in safeguards maintain financial stability and protect the shared treasury.",
  },
];

const SCROLL_VH_PER_RULE = 55;
const TOTAL_VH = RULES.length * SCROLL_VH_PER_RULE + 80;

export function Rulebook() {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [closingVisible, setClosingVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const sectionTop = -rect.top;
    const scrollable = section.offsetHeight - vh;

    if (sectionTop < -vh * 0.3) {
      setSectionVisible(false);
      setActiveIndex(-1);
      return;
    }

    setSectionVisible(sectionTop > -vh * 0.5);

    if (sectionTop < 0 || sectionTop > scrollable) {
      if (sectionTop > scrollable) {
        setActiveIndex(RULES.length - 1);
        setProgress(1);
        setClosingVisible(true);
      }
      return;
    }

    const p = Math.max(0, Math.min(1, sectionTop / scrollable));
    setProgress(p);

    const ruleZone = 1 / RULES.length;
    const idx = Math.min(RULES.length - 1, Math.floor(p / ruleZone));
    setActiveIndex(idx);
    setClosingVisible(p > 0.92);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        height: `${TOTAL_VH}vh`,
        background: "#050505",
      }}
    >
      {/* sticky viewport */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            width: "94%",
            margin: "0 auto",
            position: "relative",
            paddingLeft: 60,
          }}
        >
          {/* ---- progress timeline (left rail) ---- */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 0,
              bottom: 0,
              width: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", height: "60%" }}>
              {/* track */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 2,
                }}
              />
              {/* filled bar */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${progress * 100}%`,
                  background: ACCENT,
                  borderRadius: 2,
                  transition: "height 0.35s ease-out",
                  boxShadow: `0 0 10px ${ACCENT}55`,
                }}
              />
              {/* dots */}
              {RULES.map((_, i) => {
                const y = (i / (RULES.length - 1)) * 100;
                const isActive = i === activeIndex;
                const isPast = i < activeIndex;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: -5,
                      top: `${y}%`,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background:
                        isActive ? ACCENT : isPast ? ACCENT : "rgba(255,255,255,0.1)",
                      boxShadow: isActive
                        ? `0 0 20px ${ACCENT}, 0 0 40px ${ACCENT}44`
                        : "none",
                      transform: `scale(${isActive ? 1.5 : isPast ? 1 : 0.7}) translateY(-50%)`,
                      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* ---- section label ---- */}
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(181,236,52,0.7)",
              marginBottom: 16,
              opacity: sectionVisible ? 1 : 0,
              transform: sectionVisible
                ? "translateY(0)"
                : "translateY(20px)",
              transition: "all 0.6s ease",
            }}
          >
            The Care Protocol Rulebook
          </p>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 580,
              lineHeight: 1.6,
              marginBottom: 48,
              opacity: sectionVisible ? 1 : 0,
              transition: "opacity 0.6s ease 0.15s",
            }}
          >
            Healthcare decisions follow transparent protocol rules — not
            corporate discretion.
          </p>

          {/* ---- stacked rule titles ---- */}
          <div style={{ position: "relative" }}>
            {RULES.map((rule, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;
              const isFuture = i > activeIndex;

              let opacity = 0.08;
              let titleSize = "clamp(1.6rem, 3vw, 2.8rem)";
              let titleColor = "rgba(255,255,255,0.08)";
              let numColor = "rgba(255,255,255,0.06)";
              let yShift = 0;
              let scale = 0.97;

              if (isActive) {
                opacity = 1;
                titleSize = "clamp(2.8rem, 5.5vw, 5rem)";
                titleColor = "#f1f5f9";
                numColor = ACCENT;
                yShift = 0;
                scale = 1.05;
              } else if (isPast) {
                opacity = 0.15;
                titleColor = "rgba(255,255,255,0.12)";
                numColor = "rgba(181,236,52,0.15)";
                yShift = -8;
                scale = 0.97;
              } else if (isFuture) {
                opacity = 0.08;
                yShift = 8;
              }

              if (activeIndex === -1) {
                opacity = 0.08;
              }

              return (
                <div
                  key={rule.num}
                  style={{
                    opacity,
                    transform: `scale(${scale}) translateY(${yShift}px)`,
                    transformOrigin: "left center",
                    transition:
                      "all 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
                    marginBottom: isActive ? 12 : 4,
                    position: "relative",
                  }}
                >
                  {/* number + arrow */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: isActive ? 6 : 2,
                      overflow: "hidden",
                      height: isActive ? 22 : 0,
                      opacity: isActive ? 1 : 0,
                      transition:
                        "height 0.5s ease, opacity 0.4s ease",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        color: ACCENT,
                        lineHeight: 1,
                      }}
                    >
                      →
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: numColor,
                        letterSpacing: "0.15em",
                        fontVariantNumeric: "tabular-nums",
                        transition: "color 0.5s ease",
                      }}
                    >
                      {rule.num}
                    </span>
                  </div>

                  {/* title */}
                  <h3
                    style={{
                      fontSize: titleSize,
                      fontWeight: isActive ? 800 : 700,
                      color: titleColor,
                      textTransform: "uppercase",
                      letterSpacing: isActive ? "-0.02em" : "0.01em",
                      lineHeight: 1.05,
                      transition:
                        "all 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
                      margin: 0,
                    }}
                  >
                    {rule.title}
                  </h3>

                  {/* description — only renders for active */}
                  <div
                    style={{
                      maxHeight: isActive ? 80 : 0,
                      opacity: isActive ? 1 : 0,
                      overflow: "hidden",
                      transition:
                        "max-height 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: "rgba(255,255,255,0.4)",
                        maxWidth: 520,
                        paddingTop: 12,
                      }}
                    >
                      {rule.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---- closing line ---- */}
          <div
            style={{
              marginTop: 56,
              opacity: closingVisible ? 1 : 0,
              transform: closingVisible
                ? "translateY(0)"
                : "translateY(20px)",
              transition: "all 0.8s ease",
            }}
          >
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "rgba(255,255,255,0.4)",
                maxWidth: 600,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              The system doesn't rely on trust in institutions — it relies
              on{" "}
              <span
                style={{
                  color: ACCENT,
                  fontStyle: "normal",
                  fontWeight: 700,
                }}
              >
                transparent rules
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
