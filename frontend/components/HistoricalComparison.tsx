"use client";

import { useState, useEffect } from "react";
import {
  fetchHistoryDates,
  fetchComparison,
  ComparisonData,
  formatGex,
} from "@/lib/api";

// --- Date Picker (goes in controls bar) ---

interface DatePickerProps {
  symbol: string;
  onComparisonChange: (data: ComparisonData | null) => void;
}

export default function HistoricalDatePicker({
  symbol,
  onComparisonChange,
}: DatePickerProps) {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistoryDates(symbol)
      .then((res) => setDates(res.dates))
      .catch(() => setDates([]));
    setSelectedDate("");
    onComparisonChange(null);
  }, [symbol]);

  useEffect(() => {
    if (!selectedDate) {
      onComparisonChange(null);
      return;
    }

    setLoading(true);
    fetchComparison(symbol, selectedDate)
      .then((data) => onComparisonChange(data))
      .catch(() => onComparisonChange(null))
      .finally(() => setLoading(false));
  }, [symbol, selectedDate]);

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  if (dates.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[var(--text-muted)]">Compare:</span>
      <select
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="px-2 py-1.5 rounded-md text-xs font-data bg-[var(--bg-elevated)] border border-white/[0.06] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50 cursor-pointer"
      >
        <option value="">None</option>
        {dates.map((d) => (
          <option key={d} value={d}>
            {formatDate(d)}
          </option>
        ))}
      </select>
      {loading && (
        <span className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

// --- Comparison Summary Card (goes in main flow) ---

interface SummaryProps {
  comparison: ComparisonData;
}

export function ComparisonSummary({ comparison }: SummaryProps) {
  const { current, historical, changes } = comparison;

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="card border-accent/25 p-4">
      <h4 className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-3">
        Changes Since {formatDate(historical.date)}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Flip Point
          </div>
          <div className="font-data text-sm text-[var(--text-primary)]">
            ${historical.flip_point.toFixed(0)} → ${current.flip_point.toFixed(0)}
          </div>
          <div
            className={`font-data text-xs ${
              changes.flip_point_shift >= 0 ? "text-[var(--gex-positive)]" : "text-[var(--gex-negative)]"
            }`}
          >
            {changes.flip_point_shift >= 0 ? "+" : ""}${changes.flip_point_shift.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Regime
          </div>
          <div className="font-data text-sm text-[var(--text-primary)] capitalize">
            {historical.regime} → {current.regime}
          </div>
          {changes.regime_changed ? (
            <div className="text-xs text-[var(--gex-flip)]">Shifted</div>
          ) : (
            <div className="text-xs text-[var(--text-muted)]">Unchanged</div>
          )}
        </div>
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Total GEX
          </div>
          <div className="font-data text-sm text-[var(--text-primary)]">
            {formatGex(historical.total_gex)} → {formatGex(current.total_gex)}
          </div>
          <div
            className={`font-data text-xs ${
              changes.total_gex_change >= 0 ? "text-[var(--gex-positive)]" : "text-[var(--gex-negative)]"
            }`}
          >
            {changes.total_gex_change >= 0 ? "+" : ""}
            {formatGex(changes.total_gex_change)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Spot Price
          </div>
          <div className="font-data text-sm text-[var(--text-primary)]">
            ${historical.spot_price.toFixed(2)} → ${current.spot_price.toFixed(2)}
          </div>
          <div
            className={`font-data text-xs ${
              changes.spot_change >= 0 ? "text-[var(--gex-positive)]" : "text-[var(--gex-negative)]"
            }`}
          >
            {changes.spot_change >= 0 ? "+" : ""}${changes.spot_change.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
