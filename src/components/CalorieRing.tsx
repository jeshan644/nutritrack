
interface Props {
  consumed: number;
  goal: number;
  size?: number;
}

export default function CalorieRing({ consumed, goal, size = 160 }: Props) {
  const strokeWidth = size <= 160 ? 12 : 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const dashOffset = circumference * (1 - progress);
  const remaining = goal - consumed;
  const isOver = remaining < 0;
  const cx = size / 2;
  const cy = size / 2;

  const compact = size <= 160;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#3d3d3d" strokeWidth={strokeWidth} />
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={isOver ? '#ef4444' : '#d97706'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 600ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold font-tabular"
            style={{
              fontFamily: 'Plus Jakarta Sans',
              color: '#ececec',
              fontSize: compact ? 28 : 36,
              lineHeight: 1.1,
            }}
          >
            {Math.round(consumed).toLocaleString()}
          </span>
          <span style={{ color: '#9b9b9b', fontSize: compact ? 11 : 12, marginTop: 2 }}>
            of {goal.toLocaleString()} kcal
          </span>
        </div>
      </div>
      <div className="mt-1 text-center">
        <span style={{ fontSize: 13, fontWeight: 600, color: isOver ? '#ef4444' : '#d97706' }}>
          {isOver
            ? `${Math.abs(Math.round(remaining)).toLocaleString()} kcal over`
            : `${Math.round(remaining).toLocaleString()} kcal remaining`}
        </span>
      </div>
    </div>
  );
}
