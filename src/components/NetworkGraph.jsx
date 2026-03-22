import React from "react";

const NODES = [
  { id: 1, x: 18, y: 24 },
  { id: 2, x: 40, y: 18 },
  { id: 3, x: 65, y: 22 },
  { id: 4, x: 78, y: 42 },
  { id: 5, x: 60, y: 62 },
  { id: 6, x: 35, y: 65 },
  { id: 7, x: 20, y: 48 },
  { id: 8, x: 50, y: 40 },
];

const LINKS = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 1],
  [2, 8],
  [8, 5],
];

export function NetworkGraph() {
  const nodeMap = React.useMemo(
    () =>
      Object.fromEntries(
        NODES.map((n) => [
          n.id,
          {
            x: n.x,
            y: n.y,
          },
        ])
      ),
    []
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl glow-border bg-black/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(181,236,52,0.25),transparent_55%),radial-gradient(circle_at_bottom,rgba(181,236,52,0.18),transparent_60%)]" />
      <svg
        viewBox="0 0 100 80"
        className="relative h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#b5ec34" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#b5ec34" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {LINKS.map(([from, to], idx) => {
          const a = nodeMap[from];
          const b = nodeMap[to];
          return (
            <line
              key={`${from}-${to}-${idx}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#b5ec34"
              strokeWidth="0.45"
              className="network-line opacity-60"
              style={{ animationDelay: `${idx * 0.25}s` }}
            />
          );
        })}

        {NODES.map((node, idx) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle
              r="6"
              fill="url(#nodeGlow)"
              filter="url(#softGlow)"
              className="opacity-80"
            />
            <circle
              r="2.2"
              fill="#0f172a"
              stroke="#b5ec34"
              strokeWidth="0.4"
            />
            <circle
              r="1.1"
              fill="#b5ec34"
              className="animate-ping"
              style={{
                animationDuration: `${1.8 + idx * 0.12}s`,
              }}
            />
          </g>
        ))}
      </svg>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0)_0%,rgba(15,23,42,0.9)_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(181,236,52,0.16),transparent_55%)] mix-blend-screen" />

      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-lime-400/40 bg-black/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-lime-200/80">
        Live risk pooling network
      </div>
    </div>
  );
}

