export const refreshWindowMs = 30 * 60 * 1000;

export type MarketIndex = {
  label: string;
  value: number;
  change: number;
  direction: "up" | "down";
};

export type CompanyQuote = {
  name: string;
  symbol: string;
  sector: string;
  price: number;
  change: number;
  volume: string;
  marketCap: string;
};

export type Opportunity = {
  label: string;
  score: number;
  summary: string;
};

export type MarketSnapshot = {
  generatedAt: string;
  headline: string;
  overview: string;
  indexes: MarketIndex[];
  companies: CompanyQuote[];
  opportunities: {
    best: Opportunity[];
    worst: Opportunity[];
  };
};

const baseIndexes = [
  { label: "S&P 500", value: 5482.4, baseChange: 0.68 },
  { label: "Nasdaq", value: 17124.8, baseChange: 1.12 },
  { label: "Dow Jones", value: 39746.3, baseChange: 0.41 },
];

const companyProfiles = [
  { name: "Nvidia", symbol: "NVDA", sector: "AI hardware", basePrice: 124.6, marketCap: 3070 },
  { name: "Microsoft", symbol: "MSFT", sector: "Cloud software", basePrice: 438.2, marketCap: 3250 },
  { name: "Apple", symbol: "AAPL", sector: "Consumer technology", basePrice: 193.4, marketCap: 2970 },
  { name: "Amazon", symbol: "AMZN", sector: "E-commerce", basePrice: 182.7, marketCap: 1890 },
  { name: "Alphabet", symbol: "GOOGL", sector: "Advertising and cloud", basePrice: 176.8, marketCap: 2200 },
  { name: "JPMorgan Chase", symbol: "JPM", sector: "Financials", basePrice: 201.3, marketCap: 586 },
  { name: "Eli Lilly", symbol: "LLY", sector: "Healthcare", basePrice: 812.9, marketCap: 771 },
  { name: "Costco", symbol: "COST", sector: "Consumer staples", basePrice: 807.4, marketCap: 358 },
  { name: "Broadcom", symbol: "AVGO", sector: "Semiconductors", basePrice: 167.5, marketCap: 781 },
  { name: "Tesla", symbol: "TSLA", sector: "Electric vehicles", basePrice: 184.2, marketCap: 588 },
];

const bestThemes = [
  { label: "AI infrastructure", bias: 95, summary: "Strong demand for chips, cloud capacity, and model training tools." },
  { label: "Healthcare innovation", bias: 92, summary: "Defensive demand with long-term growth from drugs and devices." },
  { label: "Cybersecurity", bias: 89, summary: "Security spending tends to stay resilient even when markets slow." },
  { label: "Broad market ETFs", bias: 87, summary: "Diversified exposure with lower company-specific risk." },
  { label: "Dividend growers", bias: 84, summary: "Income plus quality businesses with steady cash flow." },
];

const worstThemes = [
  { label: "Highly leveraged speculation", bias: 28, summary: "Small moves can turn into large losses very quickly." },
  { label: "Unprofitable hype stocks", bias: 34, summary: "Valuations can fall hard when the story cools off." },
  { label: "Thinly traded microcaps", bias: 39, summary: "Low liquidity makes entries and exits difficult." },
  { label: "Options-only bets", bias: 43, summary: "Time decay and leverage can work against beginners." },
  { label: "Distressed businesses", bias: 47, summary: "Turnaround stories can fail before recovery arrives." },
];

function createRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function toCompactBillions(value: number) {
  return `${round(value, 0).toLocaleString("en-US")}B`;
}

function describeHeadline(averageChange: number) {
  if (averageChange > 0.75) {
    return "Stocks are leaning higher with broad participation across the major indexes.";
  }

  if (averageChange > 0) {
    return "The market is trading with a modest bullish tone and selective strength.";
  }

  if (averageChange > -0.75) {
    return "The market is mixed, with buyers and sellers keeping the session balanced.";
  }

  return "Risk appetite is softer right now, and traders are rotating toward defensive names.";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getMarketSnapshot(now = new Date()): MarketSnapshot {
  const bucket = Math.floor(now.getTime() / refreshWindowMs);
  const rng = createRng(bucket + 17);

  const indexes = baseIndexes.map((index) => {
    const swing = round((rng() - 0.45) * 1.4, 2);
    const change = round(index.baseChange + swing, 2);

    return {
      label: index.label,
      value: round(index.value * (1 + change / 100), 2),
      change,
      direction: change >= 0 ? "up" : "down",
    } as MarketIndex;
  });

  const companies = companyProfiles.map((company) => {
    const priceSwing = (rng() - 0.5) * 0.12;
    const change = round((rng() - 0.43) * 6.4, 2);

    return {
      name: company.name,
      symbol: company.symbol,
      sector: company.sector,
      price: round(company.basePrice * (1 + priceSwing), 2),
      change,
      volume: formatCompactNumber(2_000_000 + Math.floor(rng() * 18_000_000)),
      marketCap: toCompactBillions(company.marketCap + round((rng() - 0.5) * 36, 1)),
    } satisfies CompanyQuote;
  });

  const averageChange = round(
    companies.reduce((sum, company) => sum + company.change, 0) / companies.length,
    2,
  );

  const best = bestThemes.map((theme, index) => ({
    label: theme.label,
    score: Math.min(100, Math.max(0, Math.round(theme.bias - index + rng() * 4))),
    summary: theme.summary,
  }));

  const worst = worstThemes.map((theme, index) => ({
    label: theme.label,
    score: Math.min(100, Math.max(0, Math.round(theme.bias + index + rng() * 5))),
    summary: theme.summary,
  }));

  return {
    generatedAt: now.toISOString(),
    headline: describeHeadline(averageChange),
    overview: `Average movement across the watchlist is ${formatPercent(averageChange)} right now.`,
    indexes,
    companies,
    opportunities: {
      best,
      worst,
    },
  };
}