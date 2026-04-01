import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function signalLabel(confidence) {
  const c = Number(confidence) || 0;
  if (c > 0.7) return "High";
  if (c >= 0.5) return "Moderate";
  return "Low";
}

function JurorCard({ entry, glowOpacity }) {
  const approved = entry.vote === "APPROVE";
  const pct = Math.round(Math.min(1, Math.max(0, entry.confidence)) * 100);
  const strength = signalLabel(entry.confidence);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border bg-white/[0.04] p-4 backdrop-blur-xl transition-shadow ${
        approved
          ? "border-[#b5ec34]/35 shadow-[0_0_24px_rgba(181,236,52,0.12)]"
          : "border-red-500/30 shadow-[0_0_24px_rgba(248,113,113,0.1)]"
      }`}
      style={{
        boxShadow: approved
          ? `0 0 ${20 + glowOpacity * 28}px rgba(181,236,52,${0.08 + glowOpacity * 0.12})`
          : `0 0 ${18 + glowOpacity * 24}px rgba(248,113,113,${0.08 + glowOpacity * 0.1})`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold tracking-wide text-slate-300">
            {entry.id}
          </p>
          <p
            className={`mt-2 text-[11px] font-black uppercase tracking-[0.2em] ${
              approved ? "text-[#b5ec34]" : "text-red-400"
            }`}
          >
            {entry.vote}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold text-slate-100">{pct}%</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {strength}
          </p>
        </div>
      </div>

      <div className="relative mt-4 h-2 overflow-hidden rounded-full border border-white/10 bg-black/40">
        <div
          className={`h-full rounded-full transition-all ${
            approved
              ? "bg-gradient-to-r from-emerald-600/50 to-[#b5ec34]"
              : "bg-gradient-to-r from-red-900/60 to-red-400"
          }`}
          style={{
            width: `${pct}%`,
            boxShadow: approved
              ? `0 0 ${8 + pct * 0.15}px rgba(181,236,52,0.5)`
              : `0 0 ${8 + pct * 0.12}px rgba(248,113,113,0.45)`,
          }}
        />
      </div>

      {entry.reason ? (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{entry.reason}</p>
      ) : null}
    </motion.article>
  );
}

/**
 * Slide-up panel: full juror signal transparency with anonymized aliases.
 */
export function JuryLedgerSheet({
  open,
  onClose,
  caseId,
  jurors,
}) {
  const [decrypted, setDecrypted] = useState(false);

  useEffect(() => {
    if (!open) {
      setDecrypted(false);
    }
  }, [open]);

  const onKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onKey]);

  const list = Array.isArray(jurors) ? jurors : [];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Close ledger"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="jury-ledger-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className="relative z-[101] max-h-[min(92dvh,880px)] w-full overflow-hidden rounded-t-3xl border border-white/10 border-b-0 bg-[#07070c] shadow-[0_-24px_80px_rgba(0,0,0,0.65)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex max-h-[inherit] max-w-4xl flex-col px-4 pb-6 pt-3 sm:px-6">
              <div
                className="mx-auto mb-3 h-1 w-12 shrink-0 rounded-full bg-white/20"
                aria-hidden
              />

              <header className="shrink-0 border-b border-white/5 pb-4 pt-1 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
                  Cipher
                </p>
                <h2
                  id="jury-ledger-title"
                  className="mt-1 text-xl font-bold tracking-tight text-slate-50 sm:text-2xl"
                >
                  Jury Ledger
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  All juror signals recorded for this case
                  {caseId ? (
                    <span className="font-mono text-slate-500"> · #{caseId}</span>
                  ) : null}
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    {decrypted
                      ? "Ledger decrypted — anonymized juror rows visible below."
                      : "Signal bundle encrypted for release. Decrypt to inspect anonymized votes."}
                  </p>
                  {!decrypted ? (
                    <button
                      type="button"
                      onClick={() => setDecrypted(true)}
                      className="shrink-0 rounded-full border border-[#b5ec34]/45 bg-[#b5ec34]/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b5ec34] shadow-[0_0_24px_rgba(181,236,52,0.2)] transition hover:bg-[#b5ec34]/18 hover:shadow-[0_0_32px_rgba(181,236,52,0.28)] active:scale-[0.98]"
                    >
                      Decrypt Ledger
                    </button>
                  ) : null}
                </div>
              </header>

              <div className="relative mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                <div
                  className={`transition-[filter,opacity] duration-500 ${
                    decrypted ? "blur-0 opacity-100" : "blur-xl opacity-40"
                  }`}
                >
                  {list.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-500">
                      No juror rows available for this case.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
                      {list.map((entry) => (
                        <li key={entry.id}>
                          <JurorCard
                            entry={entry}
                            glowOpacity={entry.confidence}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {!decrypted && list.length > 0 ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 backdrop-blur-md">
                      Encrypted
                    </p>
                  </div>
                ) : null}
              </div>

              <footer className="shrink-0 border-t border-white/5 pt-4">
                <p className="text-center text-[11px] leading-relaxed text-slate-500">
                  All juror identities are anonymized. Decisions are recorded for
                  transparency.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 w-full rounded-full border border-white/15 bg-white/[0.06] py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/25 hover:bg-white/10"
                >
                  Close
                </button>
              </footer>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default JuryLedgerSheet;
