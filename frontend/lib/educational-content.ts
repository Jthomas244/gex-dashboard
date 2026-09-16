// All educational content centralized for easy editing

export const tooltips = {
  chart: {
    positiveBar:
      "Positive GEX at this strike. Dealers are positioned in a way that dampens price movement near this level — think of it as a magnet that pulls price back.",
    negativeBar:
      "Negative GEX at this strike. Dealers here would amplify price movement — if price reaches this zone, expect faster, more volatile moves.",
    spotPrice:
      "The current price of the underlying asset. Everything on this chart is relative to where price is right now.",
    flipPoint:
      "The gamma flip point — the most important level on the chart. Above this line, dealer hedging slows price down. Below it, dealer hedging speeds price up.",
  },
  regime: {
    positive:
      "The market is in positive gamma territory. Dealers are long gamma, which means their hedging activity pushes price back toward equilibrium. Expect lower volatility and price tending to 'pin' near high-GEX strikes. This environment favors mean-reversion strategies (selling rips, buying dips).",
    negative:
      "The market is in negative gamma territory. Dealers are short gamma, which means their hedging activity amplifies price moves in both directions. Expect higher volatility and trending moves. This environment favors momentum strategies (following the trend).",
  },
  keyLevels: {
    totalGex:
      "The sum of net GEX across every strike in view — a dollar estimate of how much dealers must hedge per $1 move in the underlying. Positive means dealers are net long gamma (stabilizing); negative means net short (amplifying).",
    highestPositive:
      "This strike has the largest positive dealer gamma exposure. Price tends to gravitate toward this level because dealer hedging creates a 'magnetic' effect. It often acts as support if price is above it, or a target if price is below it.",
    highestNegative:
      "This strike has the largest negative dealer gamma exposure. If price reaches this area, expect acceleration — moves get bigger, not smaller. Think of it as a zone where the floor (or ceiling) drops out.",
    flipPoint:
      "The strike where dealer gamma exposure crosses from positive to negative. This is the critical boundary. Above it, the market behaves differently than below it. Many traders watch this level as closely as traditional support/resistance.",
  },
  strikeTable: {
    netGex:
      "The combined gamma exposure from calls and puts at this strike. Positive means dealers dampen moves here. Negative means they amplify moves.",
    callOi:
      "Open Interest — the total number of outstanding call option contracts at this strike. Higher OI means more dealer hedging activity at this price level.",
    putOi:
      "Open Interest — the total number of outstanding put option contracts at this strike. Higher OI means more dealer hedging activity at this price level.",
    gamma:
      "Gamma measures how much an option's delta changes when the underlying price moves $1. Higher gamma = more hedging required = more market impact.",
  },
  expirationFilter: {
    "0dte":
      "Zero Days To Expiration — options expiring today. These have extremely high gamma near the money, which can dominate intraday price action. 0DTE GEX is most relevant for day trading.",
    weekly:
      "Options expiring within the next 7 days. Captures near-term positioning that affects price action over the next few days.",
    monthly:
      "Standard monthly expiration options. These represent longer-term positioning and tend to be more stable.",
    all: "Combined GEX across all expirations. Gives the fullest picture of dealer positioning but can mask short-term dynamics.",
  },
} as const;

export const glossary: Record<string, string> = {
  gamma:
    "How much an option's sensitivity to price (delta) changes when the underlying moves $1. High gamma = the option's behavior changes rapidly with small price moves.",
  delta:
    "How much an option's price changes when the underlying moves $1. Dealers hedge based on delta, and gamma tells them how fast delta is changing.",
  "open interest":
    "The total number of outstanding option contracts at a given strike and expiration. More open interest = more dealer hedging activity.",
  gex: "A dollar-weighted measure of how much dealer hedging will occur at each strike price. Positive GEX = stabilizing hedging. Negative GEX = amplifying hedging.",
  "gamma exposure":
    "A dollar-weighted measure of how much dealer hedging will occur at each strike price. Positive GEX = stabilizing hedging. Negative GEX = amplifying hedging.",
  "market maker":
    "The institution on the other side of your option trade. They don't bet on direction — they hedge mechanically based on their exposure. This hedging is what creates the GEX effect.",
  dealer:
    "The institution on the other side of your option trade. They don't bet on direction — they hedge mechanically based on their exposure. This hedging is what creates the GEX effect.",
  "flip point":
    "The strike price where aggregate dealer gamma crosses from positive to negative. The most watched level in GEX analysis.",
  "call wall":
    "The strike with the highest call-side gamma exposure. Often acts as resistance because dealer hedging sells into rallies approaching this level.",
  "put wall":
    "The strike with the highest put-side gamma exposure. Often acts as support because dealer hedging buys into dips approaching this level.",
  "0dte":
    "Zero Days To Expiration — options expiring the same day. These have extreme gamma near the money and can dominate short-term price action.",
  "pin risk":
    "The tendency for price to 'pin' or gravitate toward strikes with high open interest, especially near expiration, due to dealer hedging dynamics.",
  "volatility compression":
    "When positive gamma hedging reduces the range of price movement. Common above the flip point.",
  "volatility expansion":
    "When negative gamma hedging increases the range of price movement. Common below the flip point.",
  "mean reversion":
    "The tendency for price to return to an average or key level. Positive gamma environments favor mean-reversion strategies.",
  momentum:
    "The tendency for price to continue moving in the same direction. Negative gamma environments favor momentum strategies.",
};

export const learnSections = [
  {
    id: "what-is-gex",
    title: "What is Gamma Exposure?",
    content: `Gamma Exposure (GEX) measures how much options dealers (market makers) need to buy or sell the underlying stock to stay hedged as price moves.

When you buy an option, a dealer sells it to you. To manage their risk, dealers continuously hedge by trading the underlying stock. The SIZE of that hedging is determined by gamma.

Why does this matter? Because dealer hedging is a massive, mechanical force in the market. It's not based on opinion — it's math. Understanding where dealers are positioned tells you where the market is likely to slow down, speed up, or reverse.`,
  },
  {
    id: "positive-vs-negative",
    title: "Positive vs. Negative Gamma",
    content: `POSITIVE GAMMA (dealers are long gamma)
When dealers are long gamma, they hedge BY buying dips and selling rips. This is a stabilizing force — it compresses volatility and makes price "sticky" near high-GEX strikes.

What it feels like: Choppy, range-bound markets. Price keeps getting pulled back to the same level. Breakouts fail. Boring but predictable.

NEGATIVE GAMMA (dealers are short gamma)
When dealers are short gamma, they hedge BY selling into dips and buying into rips. This is a destabilizing force — it amplifies moves and creates trending behavior.

What it feels like: Fast, directional moves. Volatility spikes. Once price starts moving, it keeps going. Exciting but dangerous.`,
  },
  {
    id: "reading-dashboard",
    title: "Reading This Dashboard",
    content: `THE BAR CHART shows GEX at every strike price. Green bars are positive (stabilizing), red bars are negative (amplifying). The tallest green bar is where price is most likely to gravitate.

THE FLIP POINT (amber line) is the critical boundary. It answers one question: are dealers helping or hurting right now? If spot price is above the flip point, you're in positive gamma (calm). Below it, negative gamma (volatile).

KEY LEVELS are the strikes that matter most:
• Highest +GEX: The "magnet" — price gets pulled here
• Highest -GEX: The "accelerator" — price speeds up here
• Flip Point: The boundary between calm and chaos

THE REGIME INDICATOR at the top tells you the current state in plain English so you don't have to figure it out yourself.`,
  },
  {
    id: "how-traders-use",
    title: "How Traders Use GEX",
    content: `GEX doesn't tell you which direction the market will go. It tells you HOW the market is likely to MOVE.

In positive gamma:
- Expect mean-reversion (price comes back to the magnet)
- Selling options can work well (volatility is compressed)
- Breakout trades are harder (moves get faded)

In negative gamma:
- Expect momentum (moves follow through)
- Buying options can work well (volatility is expanding)
- Trend-following strategies shine
- Risk management is critical — moves are larger than normal

The flip point is the level most traders watch. A move from positive to negative gamma (dropping below the flip) is often when markets transition from calm to volatile.

IMPORTANT: GEX is one tool among many. It describes market mechanics, not certainties. Always combine with other analysis and proper risk management.`,
  },
] as const;

export const tourSteps = [
  {
    id: "welcome",
    title: "60-second tour of the controls",
    body: "You know the concepts — here's where everything lives on screen. Six quick stops.",
    target: null, // full page modal
  },
  {
    id: "regime",
    title: "Regime banner",
    body: "The current market state at a glance: green means dealers are dampening moves, red means they're amplifying them. Spot price and distance to the flip are on the right, and a yellow alert appears when spot is within 1% of flipping.",
    target: "regime-indicator",
  },
  {
    id: "levels",
    title: "Level strip",
    body: "Put wall, flip point, spot and call wall on one line. Left of the flip is the negative-gamma zone, right of it positive. The white dot is where price is now.",
    target: "level-strip",
  },
  {
    id: "key-levels",
    title: "Key numbers",
    body: "Total GEX (dealers' net position), the flip point, and the two walls with their dollar exposure. Hover any '?' for a one-line explanation.",
    target: "key-levels",
  },
  {
    id: "chart",
    title: "GEX profile",
    body: "Every strike within $30 of spot. Green bars slow price down, red bars speed it up, and the outlined bars are the walls. Hover a bar for call/put breakdown and open interest.",
    target: "gex-chart",
  },
  {
    id: "controls",
    title: "Expiration window",
    body: "0DTE isolates today's contracts (extreme gamma, intraday pins). 7 Days covers the week. Monthly shows the standard third-Friday expiration. All is the full picture. Use Compare to overlay a previous day.",
    target: "controls-bar",
  },
  {
    id: "learn",
    title: "Reference & GEX 101",
    body: "The Reference panel holds a glossary and deeper reading. GEX 101 reopens the tutorial any time. That's it — you're set.",
    target: "learn-button",
  },
] as const;
