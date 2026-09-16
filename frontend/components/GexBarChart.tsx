"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { StrikeGex } from "@/lib/types";
import { formatGex, formatNumber } from "@/lib/api";
import { tooltips } from "@/lib/educational-content";
import InfoTooltip from "./InfoTooltip";

interface Props {
  strikes: StrikeGex[];
  spotPrice: number;
  flipPoint: number;
  historicalStrikes?: { strike: number; net_gex: number }[];
  historicalDate?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-elevated/95 backdrop-blur border border-line-strong rounded-xl p-3 text-sm shadow-2xl min-w-[200px]">
      <div className="font-data font-bold text-base mb-2">
        Strike ${d.strike}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-fg-2">Net GEX</span>
        <span className={`font-data font-medium ${d.net_gex >= 0 ? "text-pos" : "text-neg"}`}>
          {formatGex(d.net_gex)}
        </span>
        {d.historical_gex !== undefined && d.historical_gex !== null && (
          <>
            <span className="text-fg-2">Historical</span>
            <span className="font-data text-accent">
              {formatGex(d.historical_gex)}
            </span>
          </>
        )}
        {d.call_gex !== undefined && (
          <>
            <span className="text-fg-2">Call GEX</span>
            <span className="font-data text-pos">{formatGex(d.call_gex)}</span>
            <span className="text-fg-2">Put GEX</span>
            <span className="font-data text-neg">{formatGex(d.put_gex)}</span>
            <span className="text-fg-2">Call OI</span>
            <span className="font-data">{formatNumber(d.call_oi)}</span>
            <span className="text-fg-2">Put OI</span>
            <span className="font-data">{formatNumber(d.put_oi)}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function GexBarChart({
  strikes,
  spotPrice,
  flipPoint,
  historicalStrikes,
  historicalDate,
}: Props) {
  const hasHistorical = historicalStrikes && historicalStrikes.length > 0;

  // Filter to show strikes within a reasonable range of spot
  const filtered = strikes.filter(
    (s) => s.strike >= spotPrice - 30 && s.strike <= spotPrice + 30
  );

  // Merge historical data if available
  const chartData = filtered.map((s) => {
    const hist = hasHistorical
      ? historicalStrikes.find((h) => h.strike === s.strike)
      : null;
    return {
      ...s,
      historical_gex: hist ? hist.net_gex : null,
    };
  });

  const maxPos = strikes.reduce((a, b) => (b.net_gex > a.net_gex ? b : a), strikes[0])?.strike;
  const maxNeg = strikes.reduce((a, b) => (b.net_gex < a.net_gex ? b : a), strikes[0])?.strike;

  const formatHistDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div id="gex-chart" className="card overflow-hidden">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <h3 className="card-title">GEX Profile by Strike</h3>
          <span className="text-[11px] text-fg-3 hidden sm:inline">±$30 around spot</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-fg-3 flex-wrap">
          {hasHistorical && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent/40" /> {formatHistDate(historicalDate!)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-pos" /> +GEX
            <InfoTooltip content={tooltips.chart.positiveBar} position="left" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-neg" /> −GEX
            <InfoTooltip content={tooltips.chart.negativeBar} position="left" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-white rounded" /> Spot
            <InfoTooltip content={tooltips.chart.spotPrice} position="left" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0 border-t-2 border-dashed border-flip" /> Flip
            <InfoTooltip content={tooltips.chart.flipPoint} position="left" />
          </span>
        </div>
      </div>
      <div className="p-3 md:p-4">
      <ResponsiveContainer width="100%" height={520}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id="gex-pos" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.95} />
            </linearGradient>
            <linearGradient id="gex-neg" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(255,255,255,0.05)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={(v) => formatGex(v)}
            stroke="rgba(255,255,255,0.08)"
            tick={{ fill: "#5b6078", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="strike"
            type="category"
            width={52}
            stroke="rgba(255,255,255,0.08)"
            tick={{ fill: "#9096ab", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            reversed
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <ReferenceLine
            y={Math.round(spotPrice)}
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeOpacity={0.9}
            label={{
              value: `Spot ${spotPrice.toFixed(2)}`,
              position: "insideTopRight",
              fill: "#FFFFFF",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          />
          <ReferenceLine
            y={Math.round(flipPoint)}
            stroke="#fbbf24"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            label={{
              value: `Flip ${flipPoint}`,
              position: "insideBottomRight",
              fill: "#fbbf24",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          />
          {/* Historical bars behind current */}
          {hasHistorical && (
            <Bar dataKey="historical_gex" radius={[0, 3, 3, 0]} fillOpacity={0.3} fill="#5b8cff" />
          )}
          <Bar dataKey="net_gex" radius={[0, 3, 3, 0]} maxBarSize={14}>
            {chartData.map((entry, i) => {
              const isWall = entry.strike === maxPos || entry.strike === maxNeg;
              return (
                <Cell
                  key={i}
                  fill={entry.net_gex >= 0 ? "url(#gex-pos)" : "url(#gex-neg)"}
                  stroke={isWall ? (entry.net_gex >= 0 ? "#34d399" : "#f87171") : "none"}
                  strokeWidth={isWall ? 1.5 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
