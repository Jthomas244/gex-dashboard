"use client";

import { ExpirationFilter } from "@/lib/types";
import { tooltips } from "@/lib/educational-content";
import InfoTooltip from "./InfoTooltip";

interface Props {
  expirationFilter: ExpirationFilter;
  onFilterChange: (filter: ExpirationFilter) => void;
  children?: React.ReactNode;
}

const FILTERS: { value: ExpirationFilter; label: string; tooltipKey: keyof typeof tooltips.expirationFilter }[] = [
  { value: "all", label: "All", tooltipKey: "all" },
  { value: "0dte", label: "0DTE", tooltipKey: "0dte" },
  { value: "weekly", label: "7 Days", tooltipKey: "weekly" },
  { value: "monthly", label: "Monthly", tooltipKey: "monthly" },
];

/** Secondary toolbar: expiration window + historical compare. */
export default function RefreshControl({ expirationFilter, onFilterChange, children }: Props) {
  const current = FILTERS.find((f) => f.value === expirationFilter);

  return (
    <div id="controls-bar" className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-fg-3 font-medium">Expirations</span>
        <div className="seg" role="tablist" aria-label="Expiration window">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={expirationFilter === f.value}
              data-active={expirationFilter === f.value}
              onClick={() => onFilterChange(f.value)}
              className="seg-item"
            >
              {f.label}
            </button>
          ))}
        </div>
        {current && (
          <InfoTooltip content={tooltips.expirationFilter[current.tooltipKey]} position="bottom" />
        )}
      </div>
      {children}
    </div>
  );
}
