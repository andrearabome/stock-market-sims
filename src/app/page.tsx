"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LineChart } from "@/components/market-charts";
import { getLiveFallbackSnapshot, type LiveMarketSnapshot } from "@/lib/live-market";
import { formatCurrency, formatPercent, refreshWindowMs } from "@/lib/market";

export default function HomePage() {
  const [snapshot, setSnapshot] = useState<LiveMarketSnapshot>(() => getLiveFallbackSnapshot());

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
        }
      } catch {
        if (active) {
          setSnapshot(getLiveFallbackSnapshot());
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

  return (
    <main>
      <section className="hero">
        <div className="panel hero-copy">
          <p className="kicker">Current market snapshot</p>
          <h1>Follow the market with a clean, live-style view.</h1>
          <p className="lede">
            {snapshot.headline} {snapshot.overview}
          </p>

          <div className="hero-actions">
            <Link className="button primary" href="/companies">
              Explore companies
            </Link>
            <Link className="button secondary" href="/guide">
              Learn how to invest
            </Link>
          </div>

          <p className="small-copy">Data source: {snapshot.source === "live" ? "live market feed" : "generated fallback feed"}</p>
        </div>

        <aside className="panel hero-side">
          <div>
            <p className="hero-panel-title">Market indexes</p>
            <p className="panel-note">Updated for the current 30-minute market window.</p>
          </div>

          <div className="stats-grid">
            {snapshot.indexes.map((index) => (
              <div key={index.label} className="stat">
                <div className="stat-label">{index.label}</div>
                <div className="stat-value">{formatCurrency(index.value)}</div>
                <div className={`stat-change ${index.direction === "up" ? "positive" : "negative"}`}>
                  {formatPercent(index.change)}
                </div>
              </div>
            ))}
          </div>

          <div className="stat">
            <div className="stat-label">Snapshot time</div>
            <div className="stat-value">{new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
            <div className="small-copy">This site uses generated market data unless a real data source is connected later.</div>
          </div>
        </aside>
      </section>

      <section className="section">
        <LineChart
          title="Historical market performance"
          description="A 30-day line chart for the major indexes shows the market trend at a glance."
          series={snapshot.indexes.map((index, indexNumber) => ({
            label: index.label,
            color: ["#77f0b4", "#8fb0ff", "#ff8d82"][indexNumber] ?? "#77f0b4",
            points: index.history,
          }))}
        />
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">5 best places to invest</h2>
            <p className="section-note">Illustrative rankings that favor durable growth, diversification, and strong demand.</p>
          </div>
        </div>

        <div className="theme-grid">
          <div className="panel theme-card best-card">
            <p className="hero-panel-title">Best opportunities</p>
            <div className="theme-list">
              {snapshot.opportunities.best.map((theme) => (
                <div key={theme.label} className="theme-row">
                  <div className="theme-topline">
                    <span>{theme.label}</span>
                    <span className="theme-score">Score {theme.score}/100</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${theme.score}%` }} />
                  </div>
                  <p className="panel-note">{theme.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel theme-card worst-card">
            <p className="hero-panel-title">Worst places to invest</p>
            <div className="theme-list">
              {snapshot.opportunities.worst.map((theme) => (
                <div key={theme.label} className="theme-row">
                  <div className="theme-topline">
                    <span>{theme.label}</span>
                    <span className="theme-score">Risk score {theme.score}/100</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill danger" style={{ width: `${theme.score}%` }} />
                  </div>
                  <p className="panel-note">{theme.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}