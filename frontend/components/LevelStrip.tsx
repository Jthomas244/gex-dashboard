"use client";

import { formatGex } from "@/lib/api";

interface Props {
  spot: number;
  flip: number;
  callWall: { strike: number; gex: number };
  putWall: { strike: number; gex: number };
}

/**
 * One-line map of the levels that matter: put wall → flip → spot → call wall.
 * Left of the flip is the negative-gamma zone, right of it positive.
 */
export default function LevelStrip({ spot, flip, callWall, putWall }: Props) {
  const levels = [spot, flip, callWall.strike, putWall.strike];
  const lo = Math.min(...levels);
  const hi = Math.max(...levels);
  const pad = Math.max((hi - lo) * 0.18, spot * 0.004);
  const min = lo - pad;
  const max = hi + pad;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const flipPct = pct(flip);
  const spotPct = pct(spot);

  const markers = [
    {
      key: "put",
      label: "Put wall",
      value: putWall.strike,
      sub: formatGex(putWall.gex),
      pct: pct(putWall.strike),
      color: "var(--gex-negative)",
      row: 0,
    },
    {
      key: "call",
      label: "Call wall",
      value: callWall.strike,
      sub: formatGex(callWall.gex),
      pct: pct(callWall.strike),
      color: "var(--gex-positive)",
      row: 0,
    },
    {
      key: "flip",
      label: "Flip",
      value: flip,
      sub: "regime boundary",
      pct: flipPct,
      color: "var(--gex-flip)",
      row: 1,
    },
  ];

  return (
    <div id="level-strip" className="relative select-none">
      {/* Zone labels */}
      <div className="flex justify-between text-[10px] uppercase tracking-wider font-medium mb-2">
        <span className="text-neg/80">← Negative gamma zone</span>
        <span className="text-pos/80">Positive gamma zone →</span>
      </div>

      {/* Track */}
      <div className="relative h-16">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full overflow-hidden bg-white/[0.04] border border-line">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${flipPct}%`,
              background: "linear-gradient(90deg, rgba(248,113,113,0.05), rgba(248,113,113,0.35))",
            }}
          />
          <div
            className="absolute inset-y-0 right-0"
            style={{
              width: `${100 - flipPct}%`,
              background: "linear-gradient(90deg, rgba(52,211,153,0.35), rgba(52,211,153,0.05))",
            }}
          />
        </div>

        {/* Level markers */}
        {markers.map((m) => (
          <div
            key={m.key}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${m.pct}%`, transform: "translateX(-50%)" }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
              style={{ background: m.color, boxShadow: `0 0 10px ${m.color}66` }}
            />
            <div
              className={`absolute ${m.row === 0 ? "top-0" : "bottom-0"} text-center whitespace-nowrap`}
            >
              <div className="text-[10px] uppercase tracking-wider" style={{ color: m.color }}>
                {m.label}
              </div>
              <div className="font-data text-[12.5px] font-semibold text-fg">${m.value}</div>
            </div>
          </div>
        ))}

        {/* Spot marker (prominent) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10"
          style={{ left: `${spotPct}%`, transform: "translate(-50%, -50%)" }}
        >
          <div
            className="relative w-4 h-4 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.15),0_0_18px_rgba(255,255,255,0.5)]"
            title={`Spot $${spot.toFixed(2)}`}
          />
        </div>
      </div>
    </div>
  );
}
