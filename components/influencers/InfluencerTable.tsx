import Link from 'next/link'
import { Influencer, PLATFORM_LABELS } from '@/lib/influencer-types'
import GradeBadge from './GradeBadge'
import StatusBadge from './StatusBadge'

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '–'
  return n.toLocaleString('ko-KR')
}

export default function InfluencerTable({ influencers }: { influencers: Influencer[] }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
            <th className="px-3 py-3 text-right font-medium">순위</th>
            <th className="px-3 py-3 text-left font-medium">인플루언서</th>
            <th className="px-3 py-3 text-left font-medium">플랫폼</th>
            <th className="px-3 py-3 text-right font-medium">팔로워</th>
            <th className="px-3 py-3 text-right font-medium">참여율</th>
            <th className="px-3 py-3 text-right font-medium">총점</th>
            <th className="px-3 py-3 text-right font-medium" title="영향력 25 · 판매력 40 · 이슈력 20 · 신뢰도 15">영향·판매·이슈·신뢰</th>
            <th className="px-3 py-3 text-left font-medium">등급</th>
            <th className="px-3 py-3 text-left font-medium">접촉</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {influencers.map(inf => (
            <tr key={inf.id} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-3 py-3 text-right text-gray-400 tabular-nums">{inf.rank > 0 ? inf.rank : '–'}</td>
              <td className="px-3 py-3">
                <Link href={`/influencers/${inf.id}`} className="font-medium text-charcoal hover:text-blush-dark">
                  {inf.display_name || inf.handle}
                </Link>
                <div className="text-xs text-gray-400">
                  @{inf.handle}
                  {inf.agency && <span className="ml-2">· {inf.agency}</span>}
                </div>
                {inf.category_tags && (
                  <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[16rem]">{inf.category_tags}</div>
                )}
              </td>
              <td className="px-3 py-3 text-gray-600">{PLATFORM_LABELS[inf.platform] ?? inf.platform}</td>
              <td className="px-3 py-3 text-right tabular-nums">{fmt(inf.followers)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{inf.engagement_rate === null ? '–' : `${inf.engagement_rate.toFixed(2)}%`}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums text-charcoal">{inf.score.toFixed(1)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-500">
                {inf.score_influence.toFixed(0)} · {inf.score_sales.toFixed(0)} · {inf.score_buzz.toFixed(0)} · {inf.score_trust.toFixed(0)}
              </td>
              <td className="px-3 py-3"><GradeBadge grade={inf.grade} excluded={inf.excluded} /></td>
              <td className="px-3 py-3"><StatusBadge status={inf.contact_status} /></td>
              <td className="px-3 py-3 text-right">
                <Link href={`/influencers/${inf.id}`} className="text-xs text-blush-dark hover:underline whitespace-nowrap">상세 →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
