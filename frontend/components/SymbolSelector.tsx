"use client";

import { useState } from "react";

const SYMBOLS = ["SPY", "QQQ", "IWM", "SPX"];

interface Props {
  value: string;
  onChange: (symbol: string) => void;
}

export default function SymbolSelector({ value, onChange }: Props) {
  const [custom, setCustom] = useState("");
  const isCustom = !SYMBOLS.includes(value);

  return (
    <div className="flex items-center gap-2">
      <div className="seg" role="tablist" aria-label="Symbol">
        {SYMBOLS.map((sym) => (
          <button
            key={sym}
            role="tab"
            aria-selected={value === sym}
            data-active={value === sym}
            onClick={() => onChange(sym)}
            className="seg-item font-data"
          >
            {sym}
          </button>
        ))}
        {isCustom && (
          <span data-active="true" className="seg-item font-data">
            {value}
          </span>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (custom.trim()) {
            onChange(custom.trim().toUpperCase());
            setCustom("");
          }
        }}
      >
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Ticker…"
          aria-label="Custom ticker"
          className="w-24 px-3 py-[6px] rounded-[9px] text-[12.5px] font-data bg-white/[0.03] border border-line text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 focus:bg-white/[0.05] transition-colors"
        />
      </form>
    </div>
  );
}
