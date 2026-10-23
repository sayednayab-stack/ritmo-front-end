import { useId } from 'react';

interface SparklineProps {
  values: number[];
  /** Any CSS colour; defaults to the brand navy. */
  color?: string;
  className?: string;
}

/** Tiny dependency-free area chart for stat cards. Decorative: the number beside it carries the meaning. */
export function Sparkline({ values, color = '#072D62', className }: SparklineProps) {
  const gid = useId();
  if (values.length < 2) return null;

  const W = 100;
  const H = 32;
  const max = Math.max(...values, 1);
  const step = W / (values.length - 1);
  const pts = values.map((v, i) => [i * step, H - 3 - (v / max) * (H - 8)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="2" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
