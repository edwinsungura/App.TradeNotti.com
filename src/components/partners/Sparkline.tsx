const W = 120;
const H = 40;

export default function Sparkline({
  points,
  positive,
}: {
  points: number[];
  positive: boolean;
}) {
  if (points.length < 2) {
    return <div className="h-10 w-[120px]" />;
  }
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 0);
  const span = max - min || 1;
  const stroke = positive ? "rgb(13,157,102)" : "rgb(226,59,59)";
  const fill = positive ? "rgba(13,157,102,0.12)" : "rgba(226,59,59,0.12)";

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - 4 - ((p - min) / span) * (H - 8);
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-10 w-[120px]">
      <path d={area} fill={fill} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
