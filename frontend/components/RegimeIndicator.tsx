"use client";

import { Regime, KeyLevels } from "@/lib/types";
import { formatGex } from "@/lib/api";
import { tooltips } from "@/lib/educational-content";
import InfoTooltip from "./InfoTooltip";
import LevelStrip from "./LevelStrip";
import clsx from "clsx";

interface Props {
  symbol: string;
  regime: Regime;
  spotPrice: number;
  flipPoint: number;
  totalGex: number;
  keyLevels: KeyLevels;
}

function Kpi({
  label,
  value,
  sub,
  tone,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg" | "flip";
  tooltip?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] px-4 py-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-fg-3 font-medium">
        {label}
        {tooltip && <InfoTooltip content={tooltip} position="bottom" />}
      </div>
      <div
        className={clsx(
          "font-data text-lg font-semibold mt-1 truncate",
          tone === "pos" && "text-pos",
          tone === "neg" && "text-neg",
          tone === "flip" && "text-flip"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-fg-3 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

export default function RegimeIndicator({
  symbol,
  regime,
  spotPrice,
  flipPoint,
  totalGex,
  keyLevels,
}: Props) {
  const isPositive = regime.type === "positive";
  const distance = spotPrice - flipPoint;
  const distancePct = (distance / spotPrice) * 100;
  const nearFlip = Math.abs(distancePct) < 1;

  const callWall = {
    strike: keyLevels.highest_positive_gex.strike,
    gex: keyLevels.highest_positive_gex.gex ?? 0,
  };
  const putWall = {
    strike: keyLevels.highest_negative_gex.strike,
    gex: keyLevels.highest_negative_gex.gex ?? 0,
  };

  return (
    <section
      id="regime-indicator"
      className={clsx(
        "card relative overflow-hidden",
        isPositive ? "border-pos/25" : "border-neg/25"
      )}
    >
      {/* Tinted top glow */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{
          background: isPositive
            ? "radial-gradient(600px 160px at 20% 0%, rgba(52,211,153,0.18), transparent 70%)"
            : "radial-gradient(600px 160px at 20% 0%, rgba(248,113,113,0.18), transparent 70%)",
        }}
      />

      <div className="relative p-5 md:p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Regime headline */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span
                className={clsx(
                  "w-2.5 h-2.5 rounded-full",
                  isPositive ? "bg-pos animate-pulse-ring" : "bg-neg"
                )}
                style={!isPositive ? { animation: "pulse-ring 2s ease-out infinite", boxShadow: "0 0 0 0 rgba(248,113,113,0.5)" } : undefined}
              />
              <span className="text-[11px] uppercase tracking-[0.14em] text-fg-3 font-medium">
                {symbol} · Current regime
              </span>
            </div>
            <h2
              className={clsx(
                "text-2xl md:text-[28px] font-semibold tracking-tight leading-none",
                isPositive ? "text-pos" : "text-neg"
              )}
            >
              {isPositive ? "Positive" : "Negative"} Gamma
              <InfoTooltip
                content={isPositive ? tooltips.regime.positive : tooltips.regime.negative}
                position="bottom"
                className="ml-2 align-middle"
              />
            </h2>
            <p className="text-fg-2 text-[13.5px] mt-2 max-w-xl leading-relaxed">
              {regime.description}
            </p>
          </div>

          {/* Spot */}
          <div className="sm:text-right">
            <div className="text-[10.5px] uppercase tracking-wider text-fg-3 font-medium">Spot</div>
            <div className="font-data text-3xl md:text-4xl font-bold tracking-tight mt-0.5">
              ${spotPrice.toFixed(2)}
            </div>
            <div
              className={clsx(
                "text-[12px] mt-1 font-data",
                distance >= 0 ? "text-pos" : "text-neg"
              )}
            >
              {distance >= 0 ? "+" : "−"}${Math.abs(distance).toFixed(2)} ({Math.abs(distancePct).toFixed(2)}%){" "}
              <span className="text-fg-3">{distance >= 0 ? "above" : "below"} flip</span>
            </div>
          </div>
        </div>

        {/* Regime-change alert */}
        {nearFlip && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-flip/30 bg-flip/10 px-4 py-3 text-[13px] animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gex-flip)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0" aria-hidden>
              <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <div>
              <span className="text-flip font-semibold">Regime change watch.</span>{" "}
              <span className="text-fg-2">
                Spot is within 1% of the flip point. A move {distance >= 0 ? "below" : "above"} ${flipPoint} would shift dealers from{" "}
                {isPositive ? "dampening to amplifying" : "amplifying to dampening"} price moves.
              </span>
            </div>
          </div>
        )}

        {/* Level strip */}
        <div className="mt-6">
          <LevelStrip spot={spotPrice} flip={flipPoint} callWall={callWall} putWall={putWall} />
        </div>

        {/* KPI row */}
        <div id="key-levels" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <Kpi
            label="Total GEX"
            value={formatGex(totalGex)}
            sub={totalGex >= 0 ? "Dealers net long gamma" : "Dealers net short gamma"}
            tone={totalGex >= 0 ? "pos" : "neg"}
            tooltip={tooltips.keyLevels.totalGex}
          />
          <Kpi
            label="Flip point"
            value={`$${flipPoint}`}
            sub="Regime boundary"
            tone="flip"
            tooltip={tooltips.keyLevels.flipPoint}
          />
          <Kpi
            label="Call wall"
            value={`$${callWall.strike}`}
            sub={`${formatGex(callWall.gex)} · magnet / resistance`}
            tone="pos"
            tooltip={tooltips.keyLevels.highestPositive}
          />
          <Kpi
            label="Put wall"
            value={`$${putWall.strike}`}
            sub={`${formatGex(putWall.gex)} · support / acceleration`}
            tone="neg"
            tooltip={tooltips.keyLevels.highestNegative}
          />
        </div>
      </div>
    </section>
  );
}
