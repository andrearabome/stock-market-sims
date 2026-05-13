import { formatCompactNumber, formatPercent, getMarketSnapshot as getMockMarketSnapshot } from "@/lib/market";

export type MarketPoint = {
  label: string;
  value: number;
};

export type LiveMarketIndex = {
  label: string;
  value: number;
  change: number;
  direction: "up" | "down";
  history: MarketPoint[];
};

export type LiveCompanyQuote = {
  name: string;
  symbol: string;
  sector: string;
  price: number;
  change: number;
  volume: string;
  marketCap: string;
  history: MarketPoint[];
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
};

export type CompanyDetailSnapshot = {
  generatedAt: string;
  source: "mock" | "live";
  company: LiveCompanyQuote;
  history: MarketPoint[];
  highlights: string[];
};

export type LiveMarketSnapshot = Omit<ReturnType<typeof getMockMarketSnapshot>, "indexes" | "companies"> & {
  source: "mock" | "live";
  trend: MarketPoint[];
  indexes: LiveMarketIndex[];
  companies: LiveCompanyQuote[];
};

type CsvRow = Record<string, string>;
type FinnhubQuote = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

type FinnhubCandle = {
  c: number[];
  s: string;
  t: number[];
};

const liveIndexSymbols = [
  { label: "S&P 500", symbol: "^spx", fallbackValue: 5482.4 },
  { label: "Nasdaq", symbol: "^ndq", fallbackValue: 17124.8 },
  { label: "Dow Jones", symbol: "^dji", fallbackValue: 39746.3 },
];

const liveCompanyProfiles = [
  { name: "Nvidia", symbol: "NVDA", sector: "AI hardware", fallbackPrice: 124.6, marketCap: 3070 },
  { name: "Microsoft", symbol: "MSFT", sector: "Cloud software", fallbackPrice: 438.2, marketCap: 3250 },
  { name: "Apple", symbol: "AAPL", sector: "Consumer technology", fallbackPrice: 193.4, marketCap: 2970 },
  { name: "Amazon", symbol: "AMZN", sector: "E-commerce", fallbackPrice: 182.7, marketCap: 1890 },
  { name: "Alphabet", symbol: "GOOGL", sector: "Advertising and cloud", fallbackPrice: 176.8, marketCap: 2200 },
  { name: "JPMorgan Chase", symbol: "JPM", sector: "Financials", fallbackPrice: 201.3, marketCap: 586 },
  { name: "Eli Lilly", symbol: "LLY", sector: "Healthcare", fallbackPrice: 812.9, marketCap: 771 },
  { name: "Costco", symbol: "COST", sector: "Consumer staples", fallbackPrice: 807.4, marketCap: 358 },
  { name: "Broadcom", symbol: "AVGO", sector: "Semiconductors", fallbackPrice: 167.5, marketCap: 781 },
  { name: "Tesla", symbol: "TSLA", sector: "Electric vehicles", fallbackPrice: 184.2, marketCap: 588 },
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

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim();
    });

    return row;
  });
}

function createSeries(rng: () => number, baseValue: number, points = 30, volatility = 0.02) {
  const history: MarketPoint[] = [];
  let current = baseValue;

  for (let index = points - 1; index >= 0; index -= 1) {
    current = Math.max(1, current * (1 + (rng() - 0.5) * volatility));
    history.push({ label: `${points - index}d`, value: round(current, 2) });
  }

  return history;
}

function changeFromHistory(history: MarketPoint[]) {
  const latest = history[history.length - 1]?.value ?? 0;
  const previous = history[history.length - 2]?.value ?? latest;

  if (previous === 0) {
    return 0;
  }

  return round(((latest - previous) / previous) * 100, 2);
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toLowerCase();
}

function normalizeMarketSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function getFinnhubApiKey() {
  return process.env.FINNHUB_API_KEY?.trim() ?? "";
}

function hasFinnhubApiKey() {
  return getFinnhubApiKey().length > 0;
}

function extractHistory(rows: CsvRow[], fallbackLabel: string, fallbackBaseValue: number) {
  const history = rows
    .map((row) => {
      const close = Number(row.Close ?? row.close ?? row.CLOSE);
      const label = row.Date ?? row.date ?? row.DATE ?? fallbackLabel;

      if (!Number.isFinite(close)) {
        return null;
      }

      return {
        label,
        value: round(close, 2),
      } satisfies MarketPoint;
    })
    .filter((point): point is MarketPoint => point !== null);

  if (history.length === 0) {
    return createSeries(createRng(Math.floor(fallbackBaseValue * 10)), fallbackBaseValue);
  }

  return history.slice(-30);
}

async function fetchHistoricalSeries(symbol: string, fallbackBaseValue: number) {
  const response = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(normalizeSymbol(symbol))}&i=d`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch historical data for ${symbol}.`);
  }

  return extractHistory(parseCsv(await response.text()), symbol.toUpperCase(), fallbackBaseValue);
}

async function fetchFinnhubQuote(symbol: string) {
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(normalizeMarketSymbol(symbol))}&token=${encodeURIComponent(getFinnhubApiKey())}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Finnhub quote for ${symbol}.`);
  }

  const quote = (await response.json()) as FinnhubQuote;

  if (!Number.isFinite(quote.c)) {
    throw new Error(`Finnhub quote payload was invalid for ${symbol}.`);
  }

  return quote;
}

async function fetchFinnhubHistory(symbol: string, fallbackBaseValue: number) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromSeconds = nowSeconds - 60 * 60 * 24 * 45;
  const response = await fetch(
    `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(normalizeMarketSymbol(symbol))}&resolution=D&from=${fromSeconds}&to=${nowSeconds}&token=${encodeURIComponent(getFinnhubApiKey())}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Finnhub candles for ${symbol}.`);
  }

  const candle = (await response.json()) as FinnhubCandle;

  if (candle.s !== "ok" || candle.c.length === 0 || candle.t.length === 0) {
    throw new Error(`Finnhub candle payload was invalid for ${symbol}.`);
  }

  const history = candle.t.map((timestamp, index) => ({
    label: new Date(timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: round(candle.c[index] ?? fallbackBaseValue, 2),
  }));

  return history.slice(-30);
}

async function fetchCompanyMarketData(marketSymbol: string, stooqSymbol: string, fallbackBaseValue: number) {
  if (hasFinnhubApiKey()) {
    try {
      const [quote, history] = await Promise.all([
        fetchFinnhubQuote(marketSymbol),
        fetchFinnhubHistory(marketSymbol, fallbackBaseValue),
      ]);

      const price = quote.c > 0 ? quote.c : history[history.length - 1]?.value ?? fallbackBaseValue;

      return {
        history,
        price: round(price, 2),
        change: Number.isFinite(quote.dp) ? round(quote.dp, 2) : changeFromHistory(history),
        open: Number.isFinite(quote.o) ? round(quote.o, 2) : undefined,
        high: Number.isFinite(quote.h) ? round(quote.h, 2) : undefined,
        low: Number.isFinite(quote.l) ? round(quote.l, 2) : undefined,
        previousClose: Number.isFinite(quote.pc) ? round(quote.pc, 2) : undefined,
        source: "live" as const,
      };
    } catch {
      // Fall through to the no-key data path.
    }
  }

  const history = await fetchHistoricalSeries(stooqSymbol, fallbackBaseValue);

  return {
    history,
    price: history[history.length - 1]?.value ?? fallbackBaseValue,
    change: changeFromHistory(history),
    source: "mock" as const,
  };
}

function enrichMockSnapshot(now = new Date()): LiveMarketSnapshot {
  const baseSnapshot = getMockMarketSnapshot(now);
  const rng = createRng(Math.floor(now.getTime() / 1000));

  const indexes = baseSnapshot.indexes.map((index) => {
    const history = createSeries(rng, index.value, 30, 0.008);
    const change = changeFromHistory(history);

    return {
      label: index.label,
      value: history[history.length - 1]?.value ?? index.value,
      change,
      direction: change >= 0 ? "up" : "down",
      history,
    } satisfies LiveMarketIndex;
  });

  const companies = baseSnapshot.companies.map((company) => {
    const history = createSeries(rng, company.price, 30, 0.03);
    const price = history[history.length - 1]?.value ?? company.price;
    const change = changeFromHistory(history);

    return {
      ...company,
      price,
      change,
      history,
    } satisfies LiveCompanyQuote;
  });

  const averageChange = round(companies.reduce((sum, company) => sum + company.change, 0) / companies.length, 2);

  return {
    ...baseSnapshot,
    generatedAt: now.toISOString(),
    source: "mock",
    headline: describeHeadline(averageChange),
    overview: `Average movement across the watchlist is ${formatPercent(averageChange)} right now.`,
    trend: indexes[0]?.history ?? [],
    indexes,
    companies,
  };
}

export function getLiveFallbackSnapshot(now = new Date()): LiveMarketSnapshot {
  return enrichMockSnapshot(now);
}

export async function loadLiveMarketSnapshot(now = new Date()): Promise<LiveMarketSnapshot> {
  try {
    const indexResults = await Promise.all(
      liveIndexSymbols.map(async (definition) => ({
        definition,
        history: await fetchHistoricalSeries(definition.symbol, definition.fallbackValue),
      })),
    );

    const indexes = indexResults.map(({ definition, history }) => {
      const change = changeFromHistory(history);

      return {
        label: definition.label,
        value: history[history.length - 1]?.value ?? definition.fallbackValue,
        change,
        direction: change >= 0 ? "up" : "down",
        history,
      } satisfies LiveMarketIndex;
    });

    const companies = await Promise.all(
      liveCompanyProfiles.map(async (company) => {
        const marketData = await fetchCompanyMarketData(company.symbol, `${company.symbol}.us`, company.fallbackPrice);

        return {
          name: company.name,
          symbol: company.symbol,
          sector: company.sector,
          price: marketData.price,
          change: marketData.change,
          volume: formatCompactNumber(2_000_000 + Math.floor(Math.abs(marketData.price) * 9000)),
          marketCap: `${company.marketCap}B`,
          history: marketData.history,
          open: marketData.open,
          high: marketData.high,
          low: marketData.low,
          previousClose: marketData.previousClose,
        } satisfies LiveCompanyQuote;
      }),
    );

    const averageChange = round(companies.reduce((sum, company) => sum + company.change, 0) / companies.length, 2);

    return {
      ...getMockMarketSnapshot(now),
      generatedAt: now.toISOString(),
      source: "live",
      headline: describeHeadline(averageChange),
      overview: `Average movement across the watchlist is ${formatPercent(averageChange)} right now.`,
      trend: indexes[0]?.history ?? [],
      indexes,
      companies,
    };
  } catch {
    return enrichMockSnapshot(now);
  }
}

function buildHighlights(company: LiveCompanyQuote) {
  const marketCapText = company.marketCap;

  return [
    `${company.name} is grouped in the ${company.sector} sector and is shown here for educational tracking only.`,
    `The current watchlist price is ${company.price.toFixed(company.price >= 100 ? 0 : 2)} per share, with a ${formatPercent(company.change)} move in the latest refresh window.`,
    `A market cap near ${marketCapText} and a ${company.volume} trading volume label help beginners compare scale and activity.`,
  ];
}

export async function loadCompanyDetail(symbol: string, now = new Date()): Promise<CompanyDetailSnapshot> {
  const normalized = normalizeMarketSymbol(symbol);
  const snapshot = await loadLiveMarketSnapshot(now);
  const company = snapshot.companies.find((entry) => entry.symbol === normalized);

  if (!company) {
    throw new Error(`Unknown company symbol: ${symbol}`);
  }

  return {
    generatedAt: snapshot.generatedAt,
    source: snapshot.source,
    company,
    history: company.history,
    highlights: buildHighlights(company),
  };
}