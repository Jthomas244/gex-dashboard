export interface StrikeGex {
  strike: number;
  call_gex: number;
  put_gex: number;
  net_gex: number;
  call_oi: number;
  put_oi: number;
  call_gamma: number;
  put_gamma: number;
}

export interface KeyLevel {
  strike: number;
  gex?: number;
  interpretation: string;
}

export interface Regime {
  type: "positive" | "negative";
  description: string;
}

export interface KeyLevels {
  highest_positive_gex: KeyLevel;
  highest_negative_gex: KeyLevel;
  flip_point: KeyLevel;
}

export interface GexResponse {
  symbol: string;
  spot_price: number;
  timestamp: string;
  data_source: string;
  regime: Regime;
  flip_point: number;
  total_gex: number;
  key_levels: KeyLevels;
  strikes: StrikeGex[];
}

export type ExpirationFilter = "0dte" | "weekly" | "monthly" | "all";
