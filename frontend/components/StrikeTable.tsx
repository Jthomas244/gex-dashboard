"use client";

import { useState } from "react";
import { StrikeGex } from "@/lib/types";
import { formatGex, formatNumber } from "@/lib/api";
import { tooltips } from "@/lib/educational-content";
import InfoTooltip from "./InfoTooltip";
import clsx from "clsx";

interface Props {
  strikes: StrikeGex[];
  spotPrice: number;
}

type SortKey = "strike" | "net_gex" | "call_gex" | "put_gex" | "call_oi" | "put_oi";

export default function StrikeTable({ strikes, spotPrice }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("strike");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "strike");
    }
  };

  // Strikes with no open interest carry no information — keep the table to what matters
  const active = strikes.filter((s) => s.call_oi + s.put_oi > 0);

  const sorted = [...active].sort((a, b) => {
    const mult = sortAsc ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * mult;
  });

  const closestStrike = strikes.reduce((prev, curr) =>
    Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice)
      ? curr
      : prev
  );

  const columns: { key: SortKey; label: string; tooltip?: string }[] = [
    { key: "strike", label: "Strike" },
    { key: "net_gex", label: "Net GEX", tooltip: tooltips.strikeTable.netGex },
    { key: "call_gex", label: "Call GEX" },
    { key: "put_gex", label: "Put GEX" },
    { key: "call_oi", label: "Call OI", tooltip: tooltips.strikeTable.callOi },
    { key: "put_oi", label: "Put OI", tooltip: tooltips.strikeTable.putOi },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">
          Strike Detail
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.tooltip && (
                      <InfoTooltip content={col.tooltip} position="bottom" />
                    )}
                    {sortKey === col.key && (
                      <span className="text-[var(--accent)]">
                        {sortAsc ? "\u2191" : "\u2193"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  Call {"\u0393"}
                  <InfoTooltip content={tooltips.strikeTable.gamma} position="bottom" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  Put {"\u0393"}
                  <InfoTooltip content={tooltips.strikeTable.gamma} position="bottom" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const isClosest = s.strike === closestStrike.strike;
              return (
                <tr
                  key={s.strike}
                  className={clsx(
                    "border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors",
                    isClosest && "bg-[var(--accent)]/10 border-[var(--accent)]/20"
                  )}
                >
                  <td className="px-4 py-2.5 font-data font-medium">
                    {isClosest && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] mr-2" />
                    )}
                    ${s.strike}
                  </td>
                  <td
                    className={clsx(
                      "px-4 py-2.5 font-data font-medium",
                      s.net_gex >= 0 ? "text-[var(--gex-positive)]" : "text-[var(--gex-negative)]"
                    )}
                  >
                    {formatGex(s.net_gex)}
                  </td>
                  <td className="px-4 py-2.5 font-data text-[var(--gex-positive)]/80">
                    {formatGex(s.call_gex)}
                  </td>
                  <td className="px-4 py-2.5 font-data text-[var(--gex-negative)]/80">
                    {formatGex(s.put_gex)}
                  </td>
                  <td className="px-4 py-2.5 font-data text-[var(--text-secondary)]">
                    {formatNumber(s.call_oi)}
                  </td>
                  <td className="px-4 py-2.5 font-data text-[var(--text-secondary)]">
                    {formatNumber(s.put_oi)}
                  </td>
                  <td className="px-4 py-2.5 font-data text-[var(--text-muted)]">
                    {s.call_gamma.toFixed(4)}
                  </td>
                  <td className="px-4 py-2.5 font-data text-[var(--text-muted)]">
                    {s.put_gamma.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
