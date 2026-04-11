
interface Props {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  bgColor: string;
  unit?: string;
}

export default function MacroPill({ label, consumed, goal, color, unit = 'g' }: Props) {
  const pct = Math.min((consumed / Math.max(goal, 1)) * 100, 100);

  return (
    <div className="flex-1 rounded-card" style={{ background: '#242424', border: '1px solid #3d3d3d', padding: '8px 8px 7px' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold" style={{ fontSize: 11, color }}>{label}</span>
        <span className="font-tabular" style={{ fontSize: 10, color: '#9b9b9b' }}>
          {Math.round(consumed)}<span className="opacity-60">/{goal}{unit}</span>
        </span>
      </div>
      <div className="rounded-pill overflow-hidden" style={{ height: 4, background: '#3d3d3d' }}>
        <div
          className="h-full rounded-pill transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
