// 점수 막대 — 축별 점수를 최대값 대비 길이로 보여준다

interface ScoreBarProps {
  label: string
  value: number
  max: number
}

export default function ScoreBar({ label, value, max }: ScoreBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-14 text-gray-500">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blush-dark rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 text-right text-charcoal tabular-nums">{value.toFixed(1)} / {max}</span>
    </div>
  )
}
