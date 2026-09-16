"use client";

import { useState, useCallback } from "react";
import { GexResponse } from "@/lib/types";
import { fetchScenario } from "@/lib/api";

interface Props {
  data: GexResponse;
}

const MAX_QUESTIONS = 10;

export default function ScenarioExplorer({ data }: Props) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const presetQuestions = [
    `What if ${data.symbol} drops below the flip point at $${data.flip_point.toFixed(0)}?`,
    `What if ${data.symbol} rallies to the call wall at $${data.key_levels.highest_positive_gex.strike.toFixed(0)}?`,
    `What happens at 0DTE expiration?`,
    `What if a large put position opens at $${data.key_levels.highest_negative_gex.strike.toFixed(0)}?`,
    `What if volatility spikes suddenly?`,
  ];

  const askQuestion = useCallback(
    async (question: string) => {
      if (questionsUsed >= MAX_QUESTIONS) return;

      setLoading(true);
      setError(null);
      setActiveQuestion(question);
      setAnswer(null);

      try {
        const result = await fetchScenario({
          question,
          current_data: {
            symbol: data.symbol,
            spot_price: data.spot_price,
            regime: data.regime.type,
            flip_point: data.flip_point,
            highest_positive_gex: {
              strike: data.key_levels.highest_positive_gex.strike,
              gex: data.key_levels.highest_positive_gex.gex ?? 0,
            },
            highest_negative_gex: {
              strike: data.key_levels.highest_negative_gex.strike,
              gex: data.key_levels.highest_negative_gex.gex ?? 0,
            },
          },
        });
        setAnswer(result.answer);
        setQuestionsUsed((prev) => prev + 1);
      } catch (err: any) {
        setError(err.message || "Failed to get scenario analysis");
      } finally {
        setLoading(false);
      }
    },
    [data, questionsUsed]
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      askQuestion(customQuestion.trim());
      setCustomQuestion("");
    }
  };

  const remaining = MAX_QUESTIONS - questionsUsed;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <h3 className="card-title">
            What Happens If...
          </h3>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          {remaining}/{MAX_QUESTIONS} questions remaining
        </span>
      </div>

      <div className="px-5 py-4">
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {presetQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => askQuestion(q)}
              disabled={loading || remaining <= 0}
              className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-white/[0.06] hover:text-[var(--text-primary)] hover:border-white/[0.12] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Custom question input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask your own scenario question..."
            disabled={remaining <= 0}
            className="flex-1 px-3 py-2 rounded-xl text-sm bg-[var(--bg-elevated)] border border-white/[0.06] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={loading || !customQuestion.trim() || remaining <= 0}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ask
          </button>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="space-y-3 py-2">
            <div className="text-xs text-[var(--text-muted)] mb-2">
              Analyzing: &quot;{activeQuestion}&quot;
            </div>
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-full" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-10/12" />
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-11/12" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-[var(--gex-negative)] py-2">{error}</div>
        )}

        {/* Answer */}
        {answer && !loading && (
          <div className="py-2">
            <div className="text-xs text-[var(--text-muted)] mb-3">
              Q: &quot;{activeQuestion}&quot;
            </div>
            <div className="space-y-3">
              {answer.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-fg-2">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        {remaining <= 0 && (
          <div className="text-xs text-[var(--gex-flip)] py-2">
            You've used all {MAX_QUESTIONS} scenario questions for this session.
            Refresh the page to reset.
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
