"use client";

import SymbolSelector from "./SymbolSelector";
import { formatTimestamp } from "@/lib/api";

interface Props {
  symbol: string;
  onSymbolChange: (s: string) => void;
  dataSource: string;
  timestamp: string;
  loading: boolean;
  onRefresh: () => void;
  onLearnToggle: () => void;
  learnOpen: boolean;
  onTutorial: () => void;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-8 h-8 rounded-[10px] bg-gradient-to-br from-accent to-accent-strong shadow-[0_6px_16px_-6px_rgba(59,108,255,0.8)] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M3 12 L7 7 L10 10 L15 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 14.5 H15" stroke="white" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight">GEX Terminal</div>
        <div className="text-[10.5px] text-fg-3 tracking-wide uppercase">Dealer Gamma Exposure</div>
      </div>
    </div>
  );
}

export default function TopBar({
  symbol,
  onSymbolChange,
  dataSource,
  timestamp,
  loading,
  onRefresh,
  onLearnToggle,
  learnOpen,
  onTutorial,
}: Props) {
  const live = dataSource === "schwab";
  return (
    <header className="md:sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-3 mb-5 backdrop-blur-xl bg-bg/70 border-b border-line">
      <div className="flex items-center gap-4 flex-wrap">
        <Logo />

        <div className="hidden md:block h-6 w-px bg-line" />

        <SymbolSelector value={symbol} onChange={onSymbolChange} />

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span
            className={`pill ${
              live
                ? "text-pos border-pos/30 bg-pos/10"
                : "text-flip border-flip/30 bg-flip/10"
            }`}
            title={live ? "Live Schwab data" : "Static sample data — not live"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${live ? "bg-pos animate-pulse-ring" : "bg-flip"}`}
            />
            {live ? "Live" : "Sample"}
          </span>
          {timestamp && (
            <span className="hidden sm:inline text-[11px] text-fg-3 font-data">
              {formatTimestamp(timestamp)}
            </span>
          )}

          <button onClick={onRefresh} disabled={loading} className="btn" aria-label="Refresh data">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? "animate-spin" : ""}
              aria-hidden
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 3v6h-6" />
            </svg>
            <span className="hidden sm:inline">{loading ? "Loading" : "Refresh"}</span>
          </button>

          <button onClick={onTutorial} className="btn" id="tutorial-button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            GEX 101
          </button>

          <button
            id="learn-button"
            onClick={onLearnToggle}
            className={`btn ${learnOpen ? "btn-active" : ""}`}
          >
            {learnOpen ? "✕ Close" : "Reference"}
          </button>
        </div>
      </div>
    </header>
  );
}
