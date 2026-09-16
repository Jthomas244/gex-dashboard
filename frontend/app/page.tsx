"use client";

import { useState, useEffect, useCallback } from "react";
import { GexResponse, ExpirationFilter } from "@/lib/types";
import { fetchGex, fetchHealth, saveSnapshot, ComparisonData, SchwabTokenStatus } from "@/lib/api";
import TopBar from "@/components/TopBar";
import RegimeIndicator from "@/components/RegimeIndicator";
import GexBarChart from "@/components/GexBarChart";
import StrikeTable from "@/components/StrikeTable";
import RefreshControl from "@/components/RefreshControl";
import LearnPanel from "@/components/LearnPanel";
import OnboardingTour from "@/components/OnboardingTour";
import Tutorial from "@/components/Tutorial";
import InterpretationPanel from "@/components/InterpretationPanel";
import ScenarioExplorer from "@/components/ScenarioExplorer";
import HistoricalDatePicker, { ComparisonSummary } from "@/components/HistoricalComparison";

const TUTORIAL_KEY = "gex-tutorial-done";
const TOUR_KEY = "gex-tour-seen";

function readFlag(storage: Storage, key: string) {
  try {
    return !!storage.getItem(key);
  } catch {
    return false;
  }
}
function writeFlag(storage: Storage, key: string) {
  try {
    storage.setItem(key, "1");
  } catch {
    /* private mode etc. */
  }
}

export default function Dashboard() {
  const [symbol, setSymbol] = useState("SPY");
  const [filter, setFilter] = useState<ExpirationFilter>("all");
  const [data, setData] = useState<GexResponse | null>(null);
  // The filter that produced `data` — `filter` can be ahead of it while a fetch is in flight
  const [loadedFilter, setLoadedFilter] = useState<ExpirationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Educational layer
  const [learnOpen, setLearnOpen] = useState(false);
  const [learnDismissedPermanently, setLearnDismissedPermanently] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [onboarded, setOnboarded] = useState(true); // assume true until storage is read

  // V2b state
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [tokenStatus, setTokenStatus] = useState<SchwabTokenStatus | null>(null);

  // Token lifecycle from the backend (refreshed alongside data loads)
  const loadHealth = useCallback(() => {
    fetchHealth()
      .then((h) => setTokenStatus(h.schwab_token ?? null))
      .catch(() => setTokenStatus(null));
  }, []);

  // Read persisted onboarding flags on mount
  useEffect(() => {
    setOnboarded(readFlag(localStorage, TUTORIAL_KEY));
    if (readFlag(sessionStorage, "gex-learn-dismissed")) setLearnDismissedPermanently(true);
  }, []);

  // First visit: open GEX 101 once data is on screen behind it
  useEffect(() => {
    if (data && !onboarded && !tutorialOpen) setTutorialOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, onboarded]);

  const finishTutorial = useCallback((thenTour: boolean) => {
    writeFlag(localStorage, TUTORIAL_KEY);
    setOnboarded(true);
    setTutorialOpen(false);
    if (thenTour) setShowTour(true);
  }, []);

  const completeTour = useCallback(() => {
    setShowTour(false);
    writeFlag(sessionStorage, TOUR_KEY);
  }, []);

  const toggleLearn = useCallback(() => {
    if (learnDismissedPermanently) return;
    setLearnOpen((v) => !v);
  }, [learnDismissedPermanently]);

  const dismissLearnPermanently = useCallback(() => {
    setLearnOpen(false);
    setLearnDismissedPermanently(true);
    writeFlag(sessionStorage, "gex-learn-dismissed");
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGex(symbol, filter);
      setData(result);
      setLoadedFilter(filter);
    } catch (err: any) {
      setError(err.message || "Failed to load GEX data");
      setData(null); // never show a stale symbol's chart under an error
    } finally {
      setLoading(false);
    }
  }, [symbol, filter]);

  useEffect(() => {
    loadData();
    loadHealth();
  }, [loadData, loadHealth]);

  // Auto-save snapshot once per day when live data loads
  useEffect(() => {
    if (!data || data.data_source !== "schwab") return;
    const key = `gex-snapshot-${data.symbol}-${new Date().toISOString().slice(0, 10)}`;
    if (!readFlag(sessionStorage, key)) {
      saveSnapshot(data.symbol)
        .then(() => writeFlag(sessionStorage, key))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.symbol, data?.data_source]);

  const handleComparisonChange = useCallback((c: ComparisonData | null) => {
    setComparison(c);
  }, []);

  return (
    <>
      <main
        className={`min-h-screen px-4 md:px-6 lg:px-8 pb-10 max-w-[1440px] mx-auto transition-[margin] duration-300 ${
          learnOpen ? "lg:mr-[380px]" : ""
        }`}
      >
        <TopBar
          symbol={symbol}
          onSymbolChange={setSymbol}
          dataSource={data?.data_source || "sample"}
          timestamp={data?.timestamp || ""}
          loading={loading}
          onRefresh={loadData}
          onLearnToggle={toggleLearn}
          learnOpen={learnOpen}
          onTutorial={() => setTutorialOpen(true)}
          tokenStatus={tokenStatus}
        />

        {/* Secondary toolbar */}
        <div className="mb-4">
          <RefreshControl expirationFilter={filter} onFilterChange={setFilter}>
            <HistoricalDatePicker symbol={symbol} onComparisonChange={handleComparisonChange} />
          </RefreshControl>
        </div>

        {/* Error */}
        {error && (
          <div className="card border-neg/30 p-5 mb-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-6 h-6 rounded-full bg-neg/15 text-neg flex items-center justify-center text-sm font-bold flex-shrink-0">
                !
              </span>
              <div>
                <div className="text-fg font-medium mb-1">Couldn&apos;t load {symbol}</div>
                <p className="text-[13.5px] text-fg-2 leading-relaxed">{error}</p>
                {/re-authorize|refresh token/i.test(error) && (
                  <pre className="mt-3 rounded-lg border border-line bg-black/30 px-3 py-2 text-[12px] font-data text-fg overflow-x-auto">
                    cd backend && python -m app.auth_flow
                  </pre>
                )}
                <button onClick={loadData} className="btn mt-3">
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && !error && (
          <div className="space-y-4">
            <div className="skeleton h-[300px]" />
            <div className="skeleton h-[560px]" />
            <div className="skeleton h-[220px]" />
          </div>
        )}

        {/* Dashboard */}
        {data && (
          <div className={`space-y-4 stagger transition-opacity ${loading ? "opacity-60" : ""}`}>
            <RegimeIndicator
              symbol={data.symbol}
              regime={data.regime}
              spotPrice={data.spot_price}
              flipPoint={data.flip_point}
              totalGex={data.total_gex}
              keyLevels={data.key_levels}
            />

            <GexBarChart
              strikes={data.strikes}
              spotPrice={data.spot_price}
              flipPoint={data.flip_point}
              historicalStrikes={comparison?.historical_strikes}
              historicalDate={comparison?.historical.date}
            />

            {comparison && <ComparisonSummary comparison={comparison} />}

            <div className="grid lg:grid-cols-2 gap-4 items-start">
              <InterpretationPanel data={data} expirationFilter={loadedFilter} />
              <ScenarioExplorer data={data} />
            </div>

            <StrikeTable strikes={data.strikes} spotPrice={data.spot_price} />

            <footer className="pt-4 text-center text-[11px] text-fg-3">
              Educational tool — not financial advice. GEX assumes dealers are long calls and short puts; open
              interest is as of the prior close.
            </footer>
          </div>
        )}
      </main>

      <LearnPanel open={learnOpen} onClose={() => setLearnOpen(false)} onDismissPermanently={dismissLearnPermanently} />

      <Tutorial
        open={tutorialOpen}
        onClose={() => finishTutorial(false)}
        onStartTour={() => finishTutorial(true)}
      />

      <OnboardingTour active={showTour} onComplete={completeTour} />
    </>
  );
}
