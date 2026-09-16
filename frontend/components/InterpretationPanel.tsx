"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GexResponse } from "@/lib/types";
import { fetchInterpretation, InterpretRequest } from "@/lib/api";

interface Props {
  data: GexResponse;
  expirationFilter: string;
}

export default function InterpretationPanel({ data, expirationFilter }: Props) {
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef<string>("");

  const buildRequest = useCallback((): InterpretRequest => {
    const sortedStrikes = [...data.strikes].sort(
      (a, b) => Math.abs(b.net_gex) - Math.abs(a.net_gex)
    );
    const topStrikes = sortedStrikes.slice(0, 5).map((s) => ({
      strike: s.strike,
      net_gex: s.net_gex,
    }));

    return {
      symbol: data.symbol,
      spot_price: data.spot_price,
      regime: data.regime.type,
      flip_point: data.flip_point,
      total_gex: data.total_gex,
      highest_positive_gex: {
        strike: data.key_levels.highest_positive_gex.strike,
        gex: data.key_levels.highest_positive_gex.gex ?? 0,
      },
      highest_negative_gex: {
        strike: data.key_levels.highest_negative_gex.strike,
        gex: data.key_levels.highest_negative_gex.gex ?? 0,
      },
      distance_from_flip: Math.abs(data.spot_price - data.flip_point),
      expiration_filter: expirationFilter,
      top_strikes: topStrikes,
    };
  }, [data, expirationFilter]);

  const generate = useCallback(
    async (force = false) => {
      const key = `${data.symbol}:${expirationFilter}:${data.regime.type}:${data.flip_point}`;
      // Skip if this key is already in flight or resolved (guards React strict-mode
      // double effects and redundant re-renders). `force` bypasses for manual refresh.
      if (!force && key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      setLoading(true);
      setError(null);
      try {
        const result = await fetchInterpretation(buildRequest());
        setInterpretation(result.interpretation);
      } catch (err: any) {
        // Clear the key so the next data change retries instead of being deduped
        lastKeyRef.current = "";
        setError(err.message || "Failed to generate analysis");
      } finally {
        setLoading(false);
      }
    },
    [data, expirationFilter, buildRequest]
  );

  // Auto-generate on data change
  useEffect(() => {
    generate();
  }, [data.symbol, expirationFilter, data.regime.type]);

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <h3 className="card-title">
            Market Structure Analysis
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            AI-powered
          </span>
        </div>
        <button
          onClick={() => generate(true)}
          disabled={loading}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--bg-elevated)] border border-white/[0.06] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Refresh Analysis"}
        </button>
      </div>

      <div className="px-5 py-5">
        {loading && !interpretation && (
          <div className="space-y-3">
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-full" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-11/12" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-10/12" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-0" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-full" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-9/12" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-11/12" />
          </div>
        )}

        {error && (
          <div className="text-sm text-[var(--gex-negative)]">
            {error}
            <button
              onClick={() => generate(true)}
              className="ml-3 text-[var(--accent)] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {interpretation && (
          <div className={`space-y-4 ${loading ? "opacity-50" : ""}`}>
            {interpretation.split("\n\n").map((para, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-fg-2"
              >
                {para}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <p className="text-[10px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
          This analysis is educational and not financial advice. GEX is one tool
          among many. Always do your own research and manage risk appropriately.
        </p>
        <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-4">
          Powered by Claude
        </span>
      </div>
    </div>
  );
}
