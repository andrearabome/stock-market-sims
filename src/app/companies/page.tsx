"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LineChart, SparklineChart } from "@/components/market-charts";
import { getLiveFallbackSnapshot, type LiveMarketSnapshot } from "@/lib/live-market";
import { formatCompactNumber, formatCurrency, formatPercent, refreshWindowMs } from "@/lib/market";

export default function CompaniesPage() {
  const [snapshot, setSnapshot] = useState<LiveMarketSnapshot>(() => getLiveFallbackSnapshot());
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    const loadSnapshot = async () => {
      try {
        const response = await fetch("/api/market", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load market data.");
        }

        const data = (await response.json()) as LiveMarketSnapshot;

        if (active) {
          setSnapshot(data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("The watchlist could not be refreshed. Showing the last available data.");
        }
      }
    };

    void loadSnapshot();

    const intervalId = window.setInterval(loadSnapshot, refreshWindowMs);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const lastUpdated = new Date(snapshot.generatedAt).toLocaleString();
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCompanies = snapshot.companies.filter((company) => {
    if (!normalizedQuery) {
      return true;
    }

    return [company.name, company.symbol, company.sector].some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  return (
    <main>
      <section className="panel article">
        <p className="kicker">The Donoteven Watchlist</p>
        <h1>Company stocks that refresh every 30 minutes.</h1>
        <p className="lede">
          A couple of highlighted companies to show current performance and trends of the market.
        </p>

        <LineChart
          title="Featured company performance"
          description="A historical view of the first three companies in the watchlist."
          series={snapshot.companies.slice(0, 3).map((company, index) => ({
            label: company.symbol,
            color: ["#77f0b4", "#8fb0ff", "#ff8d82"][index] ?? "#77f0b4",
            points: company.history,
          }))}
        />

        <div className="company-toolbar">
          <div>
            <h2 className="section-title">Current companies</h2>
            <p className="section-note">Last updated: {lastUpdated}</p>
          </div>

          <label className="search-box">
            <span className="search-label">Search ticker or sector</span>
            <input
              className="search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try NVDA, healthcare, or Apple"
            />
          </label>
        </div>

        <div className="section-header">
          <div />
          <p className="refresh-note">Auto-refresh window: 30 minutes</p>
        </div>

        {error ? <p className="negative">{error}</p> : null}

        <div className="company-grid">
          {filteredCompanies.map((company) => {
            const positive = company.change >= 0;

            return (
              <Link key={company.symbol} href={`/companies/${company.symbol}`} className="panel company-card company-link">
                <div className="company-topline">
                  <div>
                    <h3>{company.name}</h3>
                    <span className="symbol">{company.symbol}</span>
                  </div>
                  <div className={positive ? "positive" : "negative"}>{formatPercent(company.change)}</div>
                </div>

                <div className="company-metrics">
                  <div className="metric">
                    <div className="metric-label">Price</div>
                    <div className="metric-value">{formatCurrency(company.price)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Volume</div>
                    <div className="metric-value">{company.volume}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Market cap</div>
                    <div className="metric-value">{company.marketCap}</div>
                  </div>
                </div>

                <SparklineChart points={company.history} color={positive ? "#77f0b4" : "#ff8d82"} />

                <p className="small-copy">Sector: {company.sector} | Updates in {Math.round(refreshWindowMs / 60000)} minutes</p>
              </Link>
            );
          })}
        </div>

        {filteredCompanies.length === 0 ? <p className="small-copy">No companies match that search.</p> : null}
      </section>
    </main>
  );
}