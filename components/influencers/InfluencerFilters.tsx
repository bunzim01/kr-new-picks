// 필터 — 자바스크립트 없이 동작하는 GET 폼 (주소에 조건이 남아 공유 가능)
import { PLATFORMS, PLATFORM_LABELS, GRADES, CONTACT_STATUSES } from '@/lib/influencer-types'

interface FiltersProps {
  platform: string
  grade: string
  status: string
  q: string
  excluded: boolean
}

const select = 'border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-charcoal focus:outline-none focus:border-blush-dark'

export default function InfluencerFilters({ platform, grade, status, q, excluded }: FiltersProps) {
  return (
    <form method="get" className="flex flex-wrap items-center gap-2 mb-6">
      <select name="platform" defaultValue={platform} className={select} aria-label="플랫폼">
        <option value="">모든 플랫폼</option>
        {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
      </select>
      <select name="grade" defaultValue={grade} className={select} aria-label="등급">
        <option value="">모든 등급</option>
        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      <select name="status" defaultValue={status} className={select} aria-label="접촉 상태">
        <option value="">모든 접촉 상태</option>
        {CONTACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="계정·이름·태그·사무소 검색"
        className={`${select} w-56`}
        aria-label="검색"
      />
      <label className="flex items-center gap-1.5 text-xs text-gray-500 px-1">
        <input type="checkbox" name="excluded" value="1" defaultChecked={excluded} />
        제외 대상 포함
      </label>
      <button type="submit" className="text-sm px-4 py-2 rounded-lg bg-charcoal text-white hover:bg-gray-800 transition-colors">
        적용
      </button>
      <a href="/influencers" className="text-xs text-gray-400 hover:text-charcoal px-2">초기화</a>
    </form>
  )
}
