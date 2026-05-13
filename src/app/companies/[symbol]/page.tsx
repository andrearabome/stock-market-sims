import Link from "next/link";
import { notFound } from "next/navigation";
import { LineChart } from "@/components/market-charts";
import { loadCompanyDetail } from "@/lib/live-market";
import { formatCurrency, formatPercent, formatCompactNumber } from "@/lib/market";

type CompanyDetailPageProps = {
  params: Promise<{ symbol: string }>;
};

function formatMaybeCurrency(value: number | undefined) {
  return typeof value === "number" ? formatCurrency(value) : "Not available";
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const resolvedParams = await params;

  try {
    const detail = await loadCompanyDetail(resolvedParams.symbol);
    const company = detail.company;

    return (
      <main>
        <section className="panel article company-detail">
          <Link className="back-link" href="/companies">
            Back to companies
          </Link>

          <p className="kicker">Ticker detail</p>
          <h1>
            {company.name} <span className="symbol symbol-inline">{company.symbol}</span>
          </h1>
          <p className="lede">{company.sector} | {detail.source === "live" ? "Live key-backed market data" : "Generated fallback market data"}</p>

          <div className="detail-stats">
            <div className="stat">
              <div className="stat-label">Price</div>
              <div className="stat-value">{formatCurrency(company.price)}</div>
              <div className={company.change >= 0 ? "positive" : "negative"}>{formatPercent(company.change)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Open</div>
              <div className="stat-value">{formatMaybeCurrency(company.open)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">High</div>
              <div className="stat-value">{formatMaybeCurrency(company.high)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Low</div>
              <div className="stat-value">{formatMaybeCurrency(company.low)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Previous close</div>
              <div className="stat-value">{formatMaybeCurrency(company.previousClose)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Volume</div>
              <div className="stat-value">{company.volume}</div>
            </div>
          </div>

          <LineChart
            title={`${company.symbol} historical performance`}
            description="A recent daily trend line helps beginners see direction without reading a wall of numbers."
            series={[
              {
                label: company.symbol,
                color: company.change >= 0 ? "#77f0b4" : "#ff8d82",
                points: detail.history,
              },
            ]}
          />

          <div className="detail-grid">
            <section className="panel detail-copy">
              <h2>Why people watch this stock</h2>
              <p>
                This page is meant to help you compare company size, momentum, and basic price behavior before making any
                decisions. It is educational only and not a recommendation.
              </p>
              <ul>
                {detail.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>

            <section className="panel detail-copy">
              <h2>Quick read for beginners</h2>
              <p>
                If you are new to stocks, compare a company like this against the broader market instead of judging it by a
                single trading day. Large moves can look exciting, but steady businesses are often easier to learn from.
              </p>
              <p className="small-copy">Market cap: {company.marketCap} | Current snapshot: {detail.generatedAt}</p>
              <p className="small-copy">Approximate chart points: {formatCompactNumber(detail.history.length)}</p>
            </section>
          </div>
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}