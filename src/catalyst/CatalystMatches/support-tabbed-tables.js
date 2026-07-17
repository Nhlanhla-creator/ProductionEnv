"use client";

import { SupportSMETable } from "./support-sme-table";

// ─── Main Component ──────────────────────────────────────────────────────────
const SupportTabbedTables = ({ filters, stageFilter, loading, onStageOverride }) => {
  return (
    <div className="w-full">
      {/* Directly render the SME table without tabs */}
      <div className="bg-white rounded-2xl border border-[#E8D5C4] shadow-lg">
        <SupportSMETable
          filters={filters}
          stageFilter={stageFilter}
          onStageOverride={onStageOverride}
        />
      </div>
    </div>
  );
};

export default SupportTabbedTables;