/**
 * GEX 101 — a first-principles walkthrough for traders who have never
 * looked at a gamma exposure chart. Each step pairs a short explanation
 * with an illustration. Content is deliberately plain-English.
 */

import type { ReactNode } from "react";

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface TutorialStep {
  id: string;
  eyebrow: string;
  title: string;
  body: ReactNode;
  illustration: ReactNode;
  takeaway?: string;
}

const P = "var(--gex-positive)";
const N = "var(--gex-negative)";
const F = "var(--gex-flip)";
const A = "var(--accent)";
const M = "var(--text-muted)";
const T = "var(--text-secondary)";

/* ── Illustrations ────────────────────────────────────────── */

function IlloWelcome() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="tw-g" x1="0" x2="1">
          <stop offset="0" stopColor={N} stopOpacity="0.9" />
          <stop offset="0.5" stopColor={F} stopOpacity="0.9" />
          <stop offset="1" stopColor={P} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {[...Array(14)].map((_, i) => {
        const y = 18 + i * 11;
        const v = Math.sin(i / 2.2) * 60 + (i - 7) * 8;
        const w = Math.abs(v);
        const x = v >= 0 ? 160 : 160 - w;
        return <rect key={i} x={x} y={y} width={w} height={7} rx={2} fill={v >= 0 ? P : N} opacity={0.85} />;
      })}
      <line x1="160" y1="10" x2="160" y2="172" stroke={M} strokeWidth="1" />
      <line x1="40" y1="96" x2="290" y2="96" stroke="#fff" strokeWidth="1.5" />
      <text x="294" y="99" fontSize="9" fill="#fff" fontFamily="var(--font-mono)">spot</text>
      <line x1="40" y1="118" x2="290" y2="118" stroke={F} strokeWidth="1.2" strokeDasharray="4 3" />
      <text x="294" y="121" fontSize="9" fill={F} fontFamily="var(--font-mono)">flip</text>
    </svg>
  );
}

function IlloDeltaGamma() {
  // Delta curve (S-shape) with tangent slope = gamma
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <line x1="30" y1="150" x2="300" y2="150" stroke={M} strokeWidth="1" />
      <line x1="30" y1="150" x2="30" y2="20" stroke={M} strokeWidth="1" />
      <text x="292" y="165" fontSize="9" fill={T} fontFamily="var(--font-mono)">price →</text>
      <text x="14" y="26" fontSize="9" fill={T} fontFamily="var(--font-mono)" transform="rotate(-90 14 26)"></text>
      <text x="34" y="30" fontSize="9" fill={T} fontFamily="var(--font-mono)">delta 1.0</text>
      <text x="34" y="146" fontSize="9" fill={T} fontFamily="var(--font-mono)">delta 0</text>
      <path d="M40 146 C 120 146, 140 140, 165 85 S 220 26, 290 24" fill="none" stroke={A} strokeWidth="2.5" />
      {/* tangent at the money */}
      <line x1="120" y1="135" x2="210" y2="35" stroke={F} strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="165" cy="85" r="4" fill={F} />
      <text x="172" y="72" fontSize="10" fill={F} fontFamily="var(--font-mono)">gamma = slope</text>
      <text x="172" y="84" fontSize="9" fill={T}>(steepest at-the-money)</text>
      <text x="60" y="128" fontSize="9" fill={T}>far OTM: delta barely moves</text>
      <text x="200" y="46" fontSize="9" fill={T}>deep ITM: delta ≈ 1</text>
    </svg>
  );
}

function IlloDealer() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      {/* trader */}
      <rect x="20" y="60" width="80" height="60" rx="10" fill="rgba(255,255,255,0.04)" stroke={M} />
      <text x="60" y="86" fontSize="11" fill="#fff" textAnchor="middle" fontWeight="600">You</text>
      <text x="60" y="102" fontSize="9" fill={T} textAnchor="middle">buy a call</text>
      {/* dealer */}
      <rect x="120" y="50" width="80" height="80" rx="10" fill="rgba(91,140,255,0.08)" stroke={A} />
      <text x="160" y="80" fontSize="11" fill="#fff" textAnchor="middle" fontWeight="600">Dealer</text>
      <text x="160" y="96" fontSize="9" fill={T} textAnchor="middle">sells you the call</text>
      <text x="160" y="110" fontSize="9" fill={T} textAnchor="middle">→ now short delta</text>
      {/* shares */}
      <rect x="220" y="60" width="80" height="60" rx="10" fill="rgba(52,211,153,0.08)" stroke={P} />
      <text x="260" y="86" fontSize="11" fill="#fff" textAnchor="middle" fontWeight="600">Stock</text>
      <text x="260" y="102" fontSize="9" fill={T} textAnchor="middle">buys shares to hedge</text>
      <path d="M100 90 H118" stroke={M} strokeWidth="1.5" markerEnd="url(#arr)" />
      <path d="M200 90 H218" stroke={P} strokeWidth="1.5" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 z" fill={M} />
        </marker>
      </defs>
      <text x="160" y="152" fontSize="10" fill={T} textAnchor="middle">As price moves, gamma changes their delta —</text>
      <text x="160" y="166" fontSize="10" fill={T} textAnchor="middle">so they must keep re-hedging.</text>
    </svg>
  );
}

function IlloPositive() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <rect x="30" y="60" width="260" height="60" rx="8" fill="rgba(52,211,153,0.08)" />
      <line x1="30" y1="90" x2="290" y2="90" stroke={P} strokeWidth="1" strokeDasharray="3 3" />
      <path d="M30 90 C 60 60, 80 120, 110 90 S 160 60, 190 90 S 250 115, 290 90" fill="none" stroke="#fff" strokeWidth="2" />
      {/* arrows pushing back */}
      <path d="M75 62 v18" stroke={P} strokeWidth="1.5" markerEnd="url(#arrP)" />
      <path d="M95 118 v-18" stroke={P} strokeWidth="1.5" markerEnd="url(#arrP)" />
      <path d="M160 62 v18" stroke={P} strokeWidth="1.5" markerEnd="url(#arrP)" />
      <path d="M245 118 v-18" stroke={P} strokeWidth="1.5" markerEnd="url(#arrP)" />
      <defs>
        <marker id="arrP" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
          <path d="M0 0 L6 0 L3 6 z" fill={P} />
        </marker>
      </defs>
      <text x="160" y="40" fontSize="11" fill={P} textAnchor="middle" fontWeight="600">Price up → dealers sell · Price down → dealers buy</text>
      <text x="160" y="150" fontSize="10" fill={T} textAnchor="middle">Hedging pushes price back toward the middle. Range-bound, calmer.</text>
    </svg>
  );
}

function IlloNegative() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <rect x="30" y="30" width="260" height="120" rx="8" fill="rgba(248,113,113,0.08)" />
      <line x1="30" y1="90" x2="290" y2="90" stroke={N} strokeWidth="1" strokeDasharray="3 3" />
      <path d="M30 90 C 60 82, 80 100, 110 78 S 160 112, 190 60 S 250 130, 290 40" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M110 70 v-22" stroke={N} strokeWidth="1.5" markerEnd="url(#arrN)" />
      <path d="M150 112 v22" stroke={N} strokeWidth="1.5" markerEnd="url(#arrN)" />
      <path d="M190 52 v-22" stroke={N} strokeWidth="1.5" markerEnd="url(#arrN)" />
      <path d="M240 122 v20" stroke={N} strokeWidth="1.5" markerEnd="url(#arrN)" />
      <defs>
        <marker id="arrN" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
          <path d="M0 0 L6 0 L3 6 z" fill={N} />
        </marker>
      </defs>
      <text x="160" y="20" fontSize="11" fill={N} textAnchor="middle" fontWeight="600">Price up → dealers buy · Price down → dealers sell</text>
      <text x="160" y="168" fontSize="10" fill={T} textAnchor="middle">Hedging pushes price further the same way. Trending, faster, wider.</text>
    </svg>
  );
}

function IlloFlip() {
  const bars = [-70, -95, -60, -40, -25, -12, 8, 30, 55, 80, 65, 40];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <line x1="160" y1="14" x2="160" y2="150" stroke={M} strokeWidth="1" />
      {bars.map((v, i) => {
        const y = 16 + i * 11;
        const w = Math.abs(v);
        return <rect key={i} x={v >= 0 ? 160 : 160 - w} y={y} width={w} height={8} rx={2} fill={v >= 0 ? P : N} opacity="0.85" />;
      })}
      <line x1="40" y1="84" x2="290" y2="84" stroke={F} strokeWidth="1.5" strokeDasharray="5 3" />
      <text x="294" y="87" fontSize="9" fill={F} fontFamily="var(--font-mono)">flip</text>
      <text x="40" y="30" fontSize="9" fill={N}>below: put-heavy, negative GEX</text>
      <text x="168" y="146" fontSize="9" fill={P}>above: call-heavy, positive GEX</text>
      <text x="160" y="170" fontSize="9.5" fill={T} textAnchor="middle">GEX per strike = gamma × OI × 100 × spot (calls +, puts −)</text>
    </svg>
  );
}

function IlloWalls() {
  const bars = [-20, -35, -150, -30, -15, 10, 25, 45, 160, 40, 20, 10];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <line x1="160" y1="14" x2="160" y2="150" stroke={M} strokeWidth="1" />
      {bars.map((v, i) => {
        const y = 16 + i * 11;
        const w = Math.abs(v) * 0.8;
        const wall = Math.abs(v) >= 150;
        return (
          <rect
            key={i}
            x={v >= 0 ? 160 : 160 - w}
            y={y}
            width={w}
            height={8}
            rx={2}
            fill={v >= 0 ? P : N}
            opacity={wall ? 1 : 0.6}
            stroke={wall ? "#fff" : "none"}
            strokeWidth={wall ? 1 : 0}
          />
        );
      })}
      <text x="36" y="44" fontSize="10" fill={N} fontWeight="600">Put wall</text>
      <text x="36" y="56" fontSize="9" fill={T}>support — or an acceleration</text>
      <text x="36" y="66" fontSize="9" fill={T}>zone if it breaks</text>
      <text x="200" y="118" fontSize="10" fill={P} fontWeight="600">Call wall</text>
      <text x="200" y="130" fontSize="9" fill={T}>magnet + resistance;</text>
      <text x="200" y="140" fontSize="9" fill={T}>rallies stall here</text>
      <line x1="40" y1="96" x2="290" y2="96" stroke="#fff" strokeWidth="1.5" />
      <text x="294" y="99" fontSize="9" fill="#fff" fontFamily="var(--font-mono)">spot</text>
    </svg>
  );
}

function IlloDashboard() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <rect x="16" y="12" width="288" height="28" rx="6" fill="rgba(255,255,255,0.04)" stroke={M} />
      <text x="26" y="30" fontSize="9" fill="#fff" fontWeight="600">① Regime + spot</text>
      <rect x="16" y="46" width="288" height="18" rx="6" fill="rgba(251,191,36,0.08)" stroke={F} />
      <text x="26" y="58" fontSize="9" fill={F} fontWeight="600">② Level strip: put wall · flip · spot · call wall</text>
      <rect x="16" y="70" width="188" height="98" rx="6" fill="rgba(255,255,255,0.03)" stroke={M} />
      <text x="26" y="84" fontSize="9" fill="#fff" fontWeight="600">③ GEX profile by strike</text>
      {[...Array(7)].map((_, i) => {
        const v = [-40, -60, -25, 10, 35, 70, 30][i];
        const y = 92 + i * 10;
        return <rect key={i} x={v >= 0 ? 110 : 110 + v} y={y} width={Math.abs(v)} height={6} rx={1.5} fill={v >= 0 ? P : N} opacity="0.8" />;
      })}
      <rect x="212" y="70" width="92" height="46" rx="6" fill="rgba(91,140,255,0.08)" stroke={A} />
      <text x="220" y="84" fontSize="9" fill="#fff" fontWeight="600">④ AI analysis</text>
      <text x="220" y="96" fontSize="8" fill={T}>plain-English read</text>
      <text x="220" y="106" fontSize="8" fill={T}>+ what-if scenarios</text>
      <rect x="212" y="122" width="92" height="46" rx="6" fill="rgba(255,255,255,0.03)" stroke={M} />
      <text x="220" y="136" fontSize="9" fill="#fff" fontWeight="600">⑤ Filters</text>
      <text x="220" y="148" fontSize="8" fill={T}>0DTE · 7 days · monthly</text>
      <text x="220" y="158" fontSize="8" fill={T}>compare to past days</text>
    </svg>
  );
}

function IlloPlaybook() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden>
      <rect x="16" y="14" width="138" height="150" rx="10" fill="rgba(52,211,153,0.07)" stroke={P} />
      <text x="85" y="36" fontSize="11" fill={P} textAnchor="middle" fontWeight="700">POSITIVE</text>
      {["Fade extremes", "Expect pins near walls", "Tighter ranges", "Vol tends to compress"].map((t, i) => (
        <text key={t} x="30" y={60 + i * 22} fontSize="9.5" fill="#fff">• {t}</text>
      ))}
      <rect x="166" y="14" width="138" height="150" rx="10" fill="rgba(248,113,113,0.07)" stroke={N} />
      <text x="235" y="36" fontSize="11" fill={N} textAnchor="middle" fontWeight="700">NEGATIVE</text>
      {["Respect momentum", "Wider stops", "Moves overshoot", "Vol tends to expand"].map((t, i) => (
        <text key={t} x="180" y={60 + i * 22} fontSize="9.5" fill="#fff">• {t}</text>
      ))}
    </svg>
  );
}

/* ── Steps ────────────────────────────────────────────────── */

export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    eyebrow: "GEX 101",
    title: "Read the market's hidden hedging flows",
    body: (
      <>
        <p>
          Every options trade has a dealer on the other side, and dealers hedge mechanically. Their
          hedging is one of the biggest sources of buying and selling in the index — and it&apos;s
          predictable if you know where the options are.
        </p>
        <p>
          This 5-minute walkthrough explains what gamma exposure is, why it moves price, and how to
          read this dashboard. No prior options knowledge needed.
        </p>
      </>
    ),
    illustration: <IlloWelcome />,
    takeaway: "GEX turns dealer hedging into a map of where price is likely to stall or accelerate.",
  },
  {
    id: "delta-gamma",
    eyebrow: "Step 1 · The two Greeks that matter",
    title: "Delta and gamma",
    body: (
      <>
        <p>
          <strong>Delta</strong> is how much an option&apos;s price moves for a $1 move in the stock.
          A 0.50-delta call gains about $0.50 when the stock rises $1.
        </p>
        <p>
          <strong>Gamma</strong> is how fast delta itself changes. It&apos;s the slope of the delta curve
          — highest for options right at the money and close to expiration, tiny for options far
          out of the money.
        </p>
        <p>
          High gamma means an option&apos;s behaviour changes quickly as price moves. That&apos;s
          exactly what forces dealers to keep adjusting their hedges.
        </p>
      </>
    ),
    illustration: <IlloDeltaGamma />,
    takeaway: "Gamma = how quickly a hedge goes stale. More gamma, more re-hedging.",
  },
  {
    id: "dealers",
    eyebrow: "Step 2 · Who hedges, and why",
    title: "Dealers don't bet on direction",
    body: (
      <>
        <p>
          When you buy a call, a market maker (the &ldquo;dealer&rdquo;) sells it to you. They
          don&apos;t want to be short the stock, so they buy shares to neutralise their delta.
        </p>
        <p>
          As the stock moves, gamma changes the option&apos;s delta, so the hedge is no longer
          balanced. The dealer must buy or sell more shares to stay neutral — and with millions of
          contracts outstanding, that flow moves the market.
        </p>
        <p>
          The key question is <em>which way</em> they hedge when price moves. That depends on whether
          dealers are net <strong>long</strong> or <strong>short</strong> gamma.
        </p>
      </>
    ),
    illustration: <IlloDealer />,
    takeaway: "Dealer hedging is forced, not discretionary — which is why it's predictable.",
  },
  {
    id: "positive",
    eyebrow: "Step 3 · Regime one",
    title: "Positive gamma: the thermostat",
    body: (
      <>
        <p>
          When dealers are <strong>long gamma</strong> (typically because customers have sold them
          calls), their hedge works against the move: price rises → they sell shares; price falls →
          they buy.
        </p>
        <p>
          That constant leaning-against dampens volatility. Price tends to mean-revert, chop inside a
          range, and &ldquo;pin&rdquo; near strikes with the most open interest — especially into
          expiration.
        </p>
      </>
    ),
    illustration: <IlloPositive />,
    takeaway: "Positive gamma = dips get bought, rips get sold. Calm, range-bound tape.",
  },
  {
    id: "negative",
    eyebrow: "Step 4 · Regime two",
    title: "Negative gamma: the feedback loop",
    body: (
      <>
        <p>
          When dealers are <strong>short gamma</strong> (typically because customers have bought
          puts for protection), their hedge goes <em>with</em> the move: price falls → they must sell
          more; price rises → they must buy more.
        </p>
        <p>
          Now hedging amplifies every move. Sell-offs accelerate, squeezes overshoot, and volatility
          expands. This is the regime where crashes and V-shaped rallies happen.
        </p>
      </>
    ),
    illustration: <IlloNegative />,
    takeaway: "Negative gamma = moves feed on themselves. Trending, fast, wide.",
  },
  {
    id: "gex-flip",
    eyebrow: "Step 5 · Putting a number on it",
    title: "GEX and the flip point",
    body: (
      <>
        <p>
          <strong>Gamma exposure (GEX)</strong> estimates how many dollars of stock dealers must
          trade per $1 move, at each strike: gamma × open interest × 100 shares × spot price. Calls
          count as positive (dealers assumed long), puts as negative (dealers assumed short).
        </p>
        <p>
          Sum it across strikes and you get the profile on this dashboard. The price where the
          running total crosses zero is the <strong>flip point</strong>: above it dealers are net
          long gamma (thermostat), below it net short (feedback loop).
        </p>
      </>
    ),
    illustration: <IlloFlip />,
    takeaway: "The flip point is the single most important level — it's where the market's behaviour changes.",
  },
  {
    id: "walls",
    eyebrow: "Step 6 · The levels that matter",
    title: "Call walls and put walls",
    body: (
      <>
        <p>
          The strike with the largest <strong>positive</strong> GEX is the <strong>call wall</strong>.
          Dealer hedging sells into rallies approaching it, so it acts as resistance and a magnet —
          price often grinds toward it and stalls.
        </p>
        <p>
          The strike with the largest <strong>negative</strong> GEX is the <strong>put wall</strong>.
          It often acts as support while price is above it, but if price breaks through, hedging
          flips to selling and the move can accelerate.
        </p>
      </>
    ),
    illustration: <IlloWalls />,
    takeaway: "Call wall = ceiling & magnet. Put wall = floor — until it isn't.",
  },
  {
    id: "dashboard",
    eyebrow: "Step 7 · This dashboard",
    title: "How the screen is laid out",
    body: (
      <>
        <p>
          <strong>① Regime banner</strong> tells you which mode the market is in and how far spot is
          from the flip. A yellow alert appears when spot is within 1% of flipping.
        </p>
        <p>
          <strong>② Level strip</strong> maps put wall, flip, spot and call wall on one line.{" "}
          <strong>③ GEX profile</strong> shows every strike; the outlined bars are the walls.
        </p>
        <p>
          <strong>④ AI analysis</strong> writes a plain-English read of the profile and lets you ask
          &ldquo;what if&rdquo; questions. <strong>⑤ Filters</strong> switch between 0DTE, the next 7
          days, the monthly expiration, or everything — and compare against past days.
        </p>
      </>
    ),
    illustration: <IlloDashboard />,
  },
  {
    id: "playbook",
    eyebrow: "Step 8 · Using it — and its limits",
    title: "A regime-aware playbook",
    body: (
      <>
        <p>
          <strong>Positive regime:</strong> favour mean-reversion. Fade moves into the call wall, expect
          pins near big strikes into expiry, and don&apos;t chase breakouts that lack a catalyst.
        </p>
        <p>
          <strong>Negative regime:</strong> respect momentum. Give trades room, expect overshoots, and
          treat a break of the put wall as a potential acceleration, not a bargain.
        </p>
        <p className="text-fg-3">
          Limits: GEX assumes dealers are long calls and short puts (not always true), open interest
          is from the prior close, and it says nothing about <em>why</em> price is moving. It is one
          lens — combine it with your own analysis. Nothing here is financial advice.
        </p>
      </>
    ),
    illustration: <IlloPlaybook />,
    takeaway: "Know the regime before you pick a strategy. The same setup behaves differently in each.",
  },
];

export const quiz: QuizQuestion[] = [
  {
    q: "Spot is above the flip point. Price starts rallying hard. What do dealers most likely do?",
    options: ["Buy shares, pushing the rally further", "Sell shares, slowing the rally", "Nothing — they only hedge at expiration"],
    answer: 1,
    why: "Above the flip, dealers are net long gamma. Their hedge leans against the move, so they sell into strength.",
  },
  {
    q: "Which level most often acts as a magnet and resistance?",
    options: ["The put wall", "The flip point", "The call wall"],
    answer: 2,
    why: "The call wall has the largest positive GEX. Dealer selling into rallies near it makes price stall and gravitate there.",
  },
  {
    q: "Price breaks below the put wall in a negative-gamma regime. What should you expect?",
    options: ["A quick bounce — it's support", "Acceleration — hedging flips to selling", "Volatility to compress"],
    answer: 1,
    why: "Below the put wall in negative gamma, dealers must sell as price falls, feeding the move rather than absorbing it.",
  },
];
