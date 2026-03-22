import React from "react";
import { Network, ShieldCheck, Database, ScanLine } from "lucide-react";

function BentoCard({ icon: Icon, title, subtitle }) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-neutral-900/85 p-6 shadow-[0_0_0_rgba(15,23,42,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
      <div className="pointer-events-none absolute inset-px rounded-[18px] border border-white/5" />
      <div className="relative flex flex-col gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-neutral-900/95 text-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.5)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-50">{title}</p>
          <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.9),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.95),transparent_55%)] opacity-80" />
      <div className="pointer-events-none absolute -right-24 top-6 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-emerald-500/18 blur-[80px]" />

      <div className="relative z-10 w-full max-w-5xl md:max-w-6xl mx-auto">
        <div className="grid gap-10 md:grid-cols-2 items-start">
          {/* Left column */}
          <div className="space-y-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-400">
              Care Protocol
            </p>
            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02] text-neutral-50">
                Decentralizing
                <br />
                Healthcare
              </h1>
              <p className="max-w-xl text-sm sm:text-base leading-relaxed text-neutral-300/90">
                A programmable mutual layer for medical costs. Claims move
                through verifiable AI triage, peer review and on-chain
                treasuries designed for communities instead of carriers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-neutral-300">
              <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 uppercase tracking-[0.2em]">
                Rupee denominated · 2026
              </span>
              <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 uppercase tracking-[0.2em] text-teal-200">
                Mutualized risk pools
              </span>
            </div>
          </div>

          {/* Right column: bento grid */}
          <div className="grid grid-cols-2 gap-4">
            <BentoCard
              icon={Network}
              title="Network"
              subtitle="312 members"
            />
            <BentoCard
              icon={ShieldCheck}
              title="Triage"
              subtitle="AI assisted verification"
            />

            <div className="col-span-2">
              <BentoCard
                icon={Database}
                title="Risk Pool"
                subtitle="₹1.2M treasury · +4.7% this epoch"
              />
            </div>

            <BentoCard
              icon={Database}
              title="Treasury"
              subtitle="Capital pooled across cohorts"
            />
            <BentoCard
              icon={ScanLine}
              title="Audit"
              subtitle="On-chain verification"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
