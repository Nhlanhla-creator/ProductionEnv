"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { usePortfolio } from "../../context/PortfolioContext";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SHIMMER_DELAYS = [
  "animate-shimmer",    "animate-shimmer-d1", "animate-shimmer-d2",
  "animate-shimmer-d3", "animate-shimmer-d4", "animate-shimmer-d5",
  "animate-shimmer",    "animate-shimmer-d1", "animate-shimmer-d2",
];

const PipelineSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-2 px-1">
    {SHIMMER_DELAYS.map((delay, i) => (
      <div
        key={i}
        className={`bg-shimmer-dark bg-shimmer rounded-2xl flex-shrink-0 ${delay}`}
        style={{ width: "125px", height: "110px" }}
      >
        <div className="p-3 flex flex-col h-full justify-between">
          <div className="h-2.5 w-14 rounded bg-white/20" />
          <div className="h-6 w-10 rounded bg-white/20 mx-auto" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Stage definitions ────────────────────────────────────────────────────────
const STAGES = [
  { id: "initial",     name: "Matching",             description: "Total SMEs matched to this programme" },
  { id: "application", name: "Application",          description: "Formal applications received" },
  { id: "review",      name: "Evaluation",           description: "Applications currently under review" },
  { id: "approved",    name: "Due Diligence",        description: "SMEs progressed to due diligence" },
  { id: "supported",   name: "Support Approved",     description: "Applications with support approved" },
  { id: "active",      name: "Active Support",       description: "SMEs actively receiving support" },
  { id: "funding",     name: "Decision",             description: "Awaiting final funding decision" },
  { id: "termsheet",   name: "Term Sheet",           description: "Term sheet issued" },
  { id: "closed",      name: "Deal Closed",          description: "Deals successfully closed" },
  { id: "rejected",    name: "Withdrawn / Declined", description: "Applications withdrawn or declined" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function SupportDealFlowPipeline({ onStageClick }) {
  const { metrics, enriched, loading } = usePortfolio();
  const [hoveredStage, setHoveredStage] = useState(null);
  const counts = metrics?.pipeline || {};

  const handleStageClick = (stage) => {
    console.log("Matches rendered", enriched, metrics);
    if (!stage?.id) return;
    if (onStageClick) onStageClick(stage.id === "all" ? null : stage.id);
  };

  return (
    <div className="w-full bg-white rounded-[20px] p-5 shadow-lg font-['Comic_Sans_MS','Segoe_UI',cursive,sans-serif]">
      <h2 className="text-2xl text-[#3e2723] font-semibold pb-4">
        DealFlow Pipeline
      </h2>
      {loading ? (
        <PipelineSkeleton />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => {
            const isHovered = hoveredStage === stage.id;
            return (
              <div
                key={stage.id}
                className="relative flex-shrink-0 cursor-pointer transition-transform duration-200"
                // onMouseEnter={() => setHoveredStage(stage.id)}
                // onMouseLeave={() => setHoveredStage(null)}
                onClick={() => handleStageClick(stage)}
              >
                {/* Stage card */}
                <div
                  className={`
                    w-[125px] h-[110px] rounded-2xl p-3 relative overflow-hidden
                    flex flex-col justify-between transition-all duration-300
                    ${isHovered ? "shadow-lg -translate-y-1" : "shadow-md"}
                  `}
                  style={{
                    background:
                      "linear-gradient(135deg, #140905 0%, #8D6E63 100%)",
                  }}
                >
                  {/* Shine overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)",
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-20 flex flex-col h-full">
                    {/* Header row: name + icon */}
                    <div className="flex justify-between items-center mb-1">
                      <h3
                        className="text-[11px] font-bold text-white m-0 leading-tight"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
                      >
                        {stage.name}
                      </h3>
                      <Info
                        size={14}
                        className="text-white opacity-90 flex-shrink-0"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
                      />
                    </div>

                    {/* Count */}
                    <p
                      className="text-2xl font-extrabold text-white text-center mt-auto mb-0"
                      style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.3)" }}
                    >
                      {counts[stage.id] ?? 0}
                    </p>
                  </div>

                  {/* Decorative circle */}
                  <div
                    className={`
                      absolute w-10 h-10 rounded-full bg-white/10
                      -bottom-2.5 -right-2.5 transition-transform duration-300
                      ${isHovered ? "scale-110" : "scale-100"}
                    `}
                  />
                </div>

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 text-center pointer-events-none">
                    <div
                      className="bg-[#3e2723] text-white text-[11px] rounded-lg px-3 py-2 w-[140px] shadow-lg leading-tight"
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                    >
                      {stage.description}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2">
                      <div className="border-4 border-transparent border-t-[#3e2723]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}