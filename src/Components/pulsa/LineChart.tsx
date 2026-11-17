type Props = {
  values: number[];
  width?: number;
  height?: number;
  /** seconds before the line starts drawing */
  delay?: number;
  label: string;
  showArea?: boolean;
  strokeWidth?: number;
};

/** Smooth coral line that draws itself (stroke-dashoffset via pathLength=1), with a soft area fill. */
export default function LineChart({ values, width = 260, height = 90, delay = 1, label, showArea = true, strokeWidth = 3 }: Props) {
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    pad + (i * (width - pad * 2)) / Math.max(1, values.length - 1),
    pad + (1 - (v - min) / span) * (height - pad * 2),
  ]);

  // Catmull-Rom -> cubic Bézier for a smooth curve through every point.
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  const area = `${d} L${last[0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const gid = `lc-${values.length}-${Math.round(values[0])}-${width}`;

  return (
    <div className="line-chart" style={{ ["--draw-delay" as string]: `${delay}s` }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff6a55" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ff6a55" stopOpacity="0" />
          </linearGradient>
        </defs>
        {showArea && <path d={area} fill={`url(#${gid})`} className="area" />}
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke="#ff6a55"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="draw"
        />
        <circle cx={last[0]} cy={last[1]} r={4.5} fill="#ff6a55" className="end-ring" />
        <circle cx={last[0]} cy={last[1]} r={4.5} fill="#fff" stroke="#ff6a55" strokeWidth={2.5} className="end-dot" />
      </svg>
    </div>
  );
}
