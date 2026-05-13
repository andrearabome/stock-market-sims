type SeriesPoint = {
  label: string;
  value: number;
};

type ChartSeries = {
  label: string;
  color: string;
  points: SeriesPoint[];
};

type LineChartProps = {
  title: string;
  description?: string;
  series: ChartSeries[];
};

function buildPath(points: SeriesPoint[], width: number, height: number, padding: number, min: number, max: number) {
  if (points.length === 0) {
    return "";
  }

  const span = Math.max(max - min, 1);
  const xStep = points.length === 1 ? 0 : (width - padding * 2) / (points.length - 1);

  return points
    .map((point, index) => {
      const x = padding + index * xStep;
      const normalized = (point.value - min) / span;
      const y = height - padding - normalized * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildTicks(min: number, max: number) {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const range = upper - lower;

  if (range === 0) {
    return [lower, lower, lower];
  }

  return [0, 0.5, 1].map((fraction) => lower + range * fraction);
}

export function LineChart({ title, description, series }: LineChartProps) {
  const width = 1000;
  const height = 280;
  const padding = 34;
  const values = series.flatMap((item) => item.points.map((point) => point.value));
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const tickValues = buildTicks(min, max);

  return (
    <figure className="panel chart-panel">
      <div className="chart-header">
        <div>
          <h3>{title}</h3>
          {description ? <p className="section-note">{description}</p> : null}
        </div>

        <div className="chart-legend">
          {series.map((item) => (
            <span key={item.label} className="chart-legend-item">
              <span className="chart-swatch" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {tickValues.map((tick) => {
          const normalized = (tick - min) / Math.max(max - min, 1);
          const y = height - padding - normalized * (height - padding * 2);

          return (
            <g key={tick}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} className="chart-gridline" />
              <text x={padding - 8} y={y + 4} textAnchor="end" className="chart-axis-label">
                {Math.round(tick).toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        {series.map((item) => {
          const path = buildPath(item.points, width, height, padding, min, max);
          const fillPath = `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

          return (
            <g key={item.label}>
              <path d={fillPath} fill={item.color} opacity={0.08} />
              <path d={path} fill="none" stroke={item.color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>

      <div className="chart-footnote">
        <span>{series[0]?.points[0]?.label ?? ""}</span>
        <span>{series[0]?.points[series[0].points.length - 1]?.label ?? ""}</span>
      </div>
    </figure>
  );
}

export function SparklineChart({ points, color }: { points: SeriesPoint[]; color: string }) {
  const width = 320;
  const height = 84;
  const padding = 10;
  const values = points.map((point) => point.value);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const path = buildPath(points, width, height, padding, min, max);

  return (
    <figure className="sparkline-wrap" aria-label="Historical performance graph">
      <svg className="sparkline-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
        <path d={path} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </figure>
  );
}