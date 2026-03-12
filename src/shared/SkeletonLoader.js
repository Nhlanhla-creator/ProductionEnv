const LightBone = ({ className = "" }) => (
  <div
    className={`rounded-md bg-shimmer-light bg-shimmer animate-shimmer ${className}`}
  />
);

const MidBone = ({ className = "" }) => (
  <div
    className={`rounded-md bg-shimmer-mid bg-shimmer animate-shimmer ${className}`}
  />
);

const DarkBone = ({ className = "" }) => (
  <div
    className={`rounded-md bg-shimmer-dark bg-shimmer animate-shimmer ${className}`}
  />
);

// Stagger helper — picks a delay variant class by index
const delayClass = (i) =>
  ["animate-shimmer", "animate-shimmer-d1", "animate-shimmer-d2",
   "animate-shimmer-d3", "animate-shimmer-d4", "animate-shimmer-d5"][i % 6];

export default function SkeletonLoader() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-backgroundBrown font-serif">

      {/* ── SIDEBAR ── */}
      <aside className="flex flex-col items-center py-5 px-3 gap-5 w-16 shrink-0 bg-sidebar-gradient shadow-2xl z-10">
        {/* Logo mark */}
        <div className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(0)} mb-2`} />

        {/* Nav icons */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(i)}`}
          />
        ))}

        <div className="flex-1" />

        {/* Bottom utility icons */}
        <div className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(1)}`} />
        <div className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(2)}`} />
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── HEADER ── */}
        <header className="flex items-center justify-between px-8 py-4 shrink-0 bg-white border-b border-lightTan shadow-sm">
          {/* Logo text */}
          <LightBone className="w-28 h-9" />

          {/* Welcome block */}
          <div className="flex flex-col items-center gap-2">
            <LightBone className="w-56 h-[18px]" />
            <LightBone className="w-40 h-3.5" />
          </div>

          {/* Avatar + bell */}
          <div className="flex items-center gap-4">
            <LightBone className="w-9 h-9 rounded-full" />
            <LightBone className="w-9 h-9 rounded-full" />
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col gap-5">

          {/* Page title + date-filter button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <LightBone className="w-48 h-7" />
              <LightBone className="w-60 h-3.5" />
            </div>
            <LightBone className="w-32 h-9 rounded-lg" />
          </div>

          {/* ── TOP METRIC CARDS (4 col) ── */}
          <div className="grid grid-cols-4 gap-4">
            {/* First card — accent gradient background */}
            <div className="rounded-xl p-5 flex flex-col gap-3 shadow-sm bg-metric-accent">
              <div className="flex items-center justify-between">
                <DarkBone className="w-28 h-3.5" />
                <DarkBone className="w-12 h-5 rounded-full" />
              </div>
              <DarkBone className="w-[70%] h-8" />
              <DarkBone className="w-[55%] h-3" />
            </div>

            {/* Cards 2-4 — white */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-5 flex flex-col gap-3 shadow-sm bg-white border border-paleBrown"
              >
                <div className="flex items-center justify-between">
                  <LightBone className="w-28 h-3.5" />
                  <LightBone className="w-12 h-5 rounded-full" />
                </div>
                <LightBone className="w-[70%] h-8" />
                <LightBone className="w-[55%] h-3" />
              </div>
            ))}
          </div>

          {/* ── BOTTOM METRIC CARDS (4 col) ── */}
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-5 flex flex-col gap-3 shadow-sm bg-white border border-paleBrown"
              >
                <div className="flex items-center justify-between">
                  <LightBone className="w-32 h-3.5" />
                  <LightBone className="w-12 h-5 rounded-full" />
                </div>
                <LightBone className="w-[65%] h-8" />
                <LightBone className="w-[50%] h-3" />
              </div>
            ))}
          </div>

          {/* ── CHARTS ROW ── */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">

            {/* Bar chart — User Growth Trend */}
            <div className="rounded-xl p-5 flex flex-col gap-4 overflow-hidden bg-white border border-paleBrown">
              <div className="flex items-center justify-between">
                <LightBone className="w-40 h-4" />
                <LightBone className="w-7 h-7 rounded-full" />
              </div>

              {/* Bars */}
              <div className="flex items-end gap-2 flex-1">
                {[55, 40, 70, 45, 80, 60, 90, 50, 75, 85, 65, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className={`rounded-t-md bg-shimmer-mid bg-shimmer ${delayClass(i)}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>

              {/* X-axis label row */}
              <div className="flex gap-2">
                {[...Array(12)].map((_, i) => (
                  <LightBone key={i} className="flex-1 h-2.5" />
                ))}
              </div>
            </div>

            {/* Donut chart — User Composition */}
            <div className="rounded-xl p-5 flex flex-col gap-4 overflow-hidden bg-white border border-paleBrown">
              <div className="flex items-center justify-between">
                <LightBone className="w-36 h-4" />
                <LightBone className="w-7 h-7 rounded-full" />
              </div>

              <div className="flex-1 flex items-center justify-center gap-10">
                {/* SVG donut — stroke colours use the palette hex values directly
                    (SVG stroke can't use Tailwind classes, but this is purely a
                    visual placeholder shape, not a styled DOM element) */}
                <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0">
                  {[
                    { pct: 43, stroke: "#ddd0c8", offset: 0 },
                    { pct: 30, stroke: "#c9b5ab", offset: 43 },
                    { pct: 27, stroke: "#e8ddd7", offset: 73 },
                  ].map(({ pct, stroke, offset }, i) => {
                    const r = 35;
                    const circ = 2 * Math.PI * r;
                    return (
                      <circle
                        key={i}
                        cx="50" cy="50" r={r}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="18"
                        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                        transform={`rotate(${(offset / 100) * 360 - 90} 50 50)`}
                        className="animate-pulse-glow"
                      />
                    );
                  })}
                  <circle cx="50" cy="50" r="24" className="fill-white" />
                </svg>

                {/* Legend */}
                <div className="flex flex-col gap-3">
                  {[20, 16, 22].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <LightBone className="w-3 h-3 rounded-full shrink-0" />
                      <LightBone className={`w-${w} h-3.5`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
