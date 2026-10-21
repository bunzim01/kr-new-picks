import { Grade } from '@/lib/influencer-types'

const STYLES: Record<Grade, string> = {
  골드: 'bg-amber-100 text-amber-800 border-amber-200',
  실버: 'bg-gray-100 text-gray-700 border-gray-200',
  루키: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  미분류: 'bg-white text-gray-400 border-gray-200',
}

export default function GradeBadge({ grade, excluded }: { grade: Grade; excluded?: boolean }) {
  if (excluded) {
    return <span className="inline-block text-[11px] px-2 py-0.5 rounded-full border bg-rose-50 text-rose-600 border-rose-200">제외</span>
  }
  return (
    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${STYLES[grade] ?? STYLES.미분류}`}>
      {grade}
    </span>
  )
}
