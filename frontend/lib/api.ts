import { GexResponse, ExpirationFilter } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SchwabTokenStatus {
  state: "ok" | "expiring" | "expired" | "unknown";
  issued_at: string | null;
  expires_at: string | null;
  days_remaining: number | null;
}

export interface HealthResponse {
  status: string;
  data_source: string;
  schwab_token?: SchwabTokenStatus;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function fetchGex(
  symbol: string,
  expirationFilter: ExpirationFilter = "all"
): Promise<GexResponse> {
  const params = new URLSearchParams({ expiration_filter: expirationFilter });
  const res = await fetch(
    `${API_URL}/api/gex/${encodeURIComponent(symbol)}?${params}`
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export function formatGex(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// --- V2b API functions ---

export interface InterpretRequest {
  symbol: string;
  spot_price: number;
  regime: string;
  flip_point: number;
  total_gex: number;
  highest_positive_gex: { strike: number; gex: number };
  highest_negative_gex: { strike: number; gex: number };
  distance_from_flip: number;
  expiration_filter: string;
  top_strikes: { strike: number; net_gex: number }[];
}

export interface InterpretResponse {
  interpretation: string;
  cached: boolean;
}

/**
 * Stream the interpretation as it is generated. `onDelta` receives each text chunk;
 * resolves with {cached} when the server sends its done event. Pass an AbortSignal
 * to cancel (e.g. when the symbol changes mid-stream).
 */
export async function streamInterpretation(
  req: InterpretRequest,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<{ cached: boolean }> {
  const res = await fetch(`${API_URL}/api/interpret/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let cached = false;

  const handle = (line: string) => {
    if (!line.trim()) return;
    const ev = JSON.parse(line) as { delta?: string; done?: boolean; cached?: boolean; error?: string };
    if (ev.error) throw new Error(ev.error);
    if (ev.delta) onDelta(ev.delta);
    if (ev.done) cached = !!ev.cached;
  };

  // NDJSON: split on newlines, keep any partial trailing line in the buffer
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handle);
  }
  buffer += decoder.decode();
  if (buffer) handle(buffer);
  return { cached };
}

export async function fetchInterpretation(
  req: InterpretRequest
): Promise<InterpretResponse> {
  const res = await fetch(`${API_URL}/api/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export interface ScenarioRequest {
  question: string;
  current_data: {
    symbol: string;
    spot_price: number;
    regime: string;
    flip_point: number;
    highest_positive_gex: { strike: number; gex: number };
    highest_negative_gex: { strike: number; gex: number };
  };
}

export interface ScenarioResponse {
  answer: string;
}

export async function fetchScenario(
  req: ScenarioRequest
): Promise<ScenarioResponse> {
  const res = await fetch(`${API_URL}/api/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchHistoryDates(
  symbol: string
): Promise<{ symbol: string; dates: string[] }> {
  const res = await fetch(
    `${API_URL}/api/gex/${encodeURIComponent(symbol)}/history`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch history dates");
  }
  return res.json();
}

export interface ComparisonData {
  current: {
    date: string;
    flip_point: number;
    regime: string;
    total_gex: number;
    spot_price: number;
  };
  historical: {
    date: string;
    flip_point: number;
    regime: string;
    total_gex: number;
    spot_price: number;
  };
  changes: {
    flip_point_shift: number;
    regime_changed: boolean;
    total_gex_change: number;
    spot_change: number;
  };
  current_strikes: { strike: number; net_gex: number }[];
  historical_strikes: { strike: number; net_gex: number }[];
}

export async function fetchComparison(
  symbol: string,
  date: string
): Promise<ComparisonData> {
  const params = new URLSearchParams({ date });
  const res = await fetch(
    `${API_URL}/api/gex/${encodeURIComponent(symbol)}/compare?${params}`
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function saveSnapshot(symbol: string): Promise<void> {
  await fetch(`${API_URL}/api/gex/${encodeURIComponent(symbol)}/snapshot`, {
    method: "POST",
  });
}
