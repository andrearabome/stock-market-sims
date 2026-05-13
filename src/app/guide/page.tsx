export default function GuidePage() {
  return (
    <main>
      <section className="guide-grid">
        <article className="panel article">
          <p className="kicker">Investing 101</p>
          <h1>How to invest in stocks, why it can help, and why it still carries risk.</h1>
          <p>
            Stocks can help your money grow because you are buying a share of a real business. If the company earns more,
            expands its customer base, or pays dividends, your investment can benefit over time.
          </p>
          <p>
            The tradeoff is volatility. Stock prices can fall because of earnings misses, interest-rate changes, bad news,
            or general market fear. Even strong companies can drop hard in the short term.
          </p>

          <h2>Best beginner approach</h2>
          <ul>
            <li>Start with broad index funds or ETFs before trying to pick lots of individual stocks.</li>
            <li>Invest regularly with dollar-cost averaging instead of trying to time every move.</li>
            <li>Diversify across sectors so one bad company does not ruin the whole plan.</li>
            <li>Keep an emergency fund first so you are not forced to sell during a dip.</li>
            <li>Use a long time horizon and ignore short-term noise when possible.</li>
          </ul>
        </article>

        <div className="guide-stack">
          <section className="panel risk-card">
            <h2>Why investing can be good</h2>
            <p>
              Historically, stocks have offered stronger long-term growth than cash alone because ownership in successful
              companies can compound over many years. That makes them useful for retirement, long-term goals, and building wealth.
            </p>
          </section>

          <section className="panel risk-card">
            <h2>Why investing is risky</h2>
            <div className="risk-list">
              <div>
                <strong>Price swings:</strong>
                <p>Markets can move sharply in both directions, especially when fear or speculation takes over.</p>
              </div>
              <div>
                <strong>Company risk:</strong>
                <p>A single business can fail even if the wider market is healthy.</p>
              </div>
              <div>
                <strong>Behavior risk:</strong>
                <p>Buying after hype and selling after panic is one of the fastest ways beginners lose money.</p>
              </div>
            </div>
          </section>

          <section className="panel risk-card">
            <h2>Simple starter plan</h2>
            <p>
              Build a small monthly habit, keep costs low, and focus on learning how a few high-quality businesses behave
              before making the portfolio more complex.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}