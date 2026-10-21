// 일본 인플루언서 후보 목록 — 서버 컴포넌트에서 DB 직접 조회
import { Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Pagination from '@/components/Pagination'
import InfluencerFilters from '@/components/influencers/InfluencerFilters'
import InfluencerTable from '@/components/influencers/InfluencerTable'
import { listInfluencers, getInfluencerStats } from '@/lib/influencer-db'

export const dynamic = 'force-dynamic'

interface SearchParams {
  platform?: string
  grade?: string
  status?: string
  q?: string
  excluded?: string
  page?: string
}

export default async function InfluencersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const includeExcluded = sp.excluded === '1'

  const data = listInfluencers({
    platform: sp.platform || undefined,
    grade: sp.grade || undefined,
    status: sp.status || undefined,
    q: sp.q || undefined,
    includeExcluded,
    page,
    limit: 50,
  })
  const stats = getInfluencerStats()
  const pipeline = (['접촉', '응답', '동의', '제안', '계약'] as const).map(s => ({ label: s, count: stats.byStatus[s] }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl text-charcoal mb-1">일본 인플루언서 후보</h2>
            <p className="text-sm text-gray-400">
              영향력 25 · 판매력 40 · 이슈력 20 · 신뢰도 15 = 100점
              {stats.lastSourceDate && <span className="ml-2">· 마지막 수집 {stats.lastSourceDate}</span>}
            </p>
          </div>
          <Link href="/influencers/guide" className="text-xs text-blush-dark border border-blush rounded-full px-4 py-1.5 hover:bg-blush-light transition-colors">
            수집 방법 안내 →
          </Link>
        </div>

        {/* 현황 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <StatCard label="후보 전체" value={stats.total - stats.excluded} />
          <StatCard label="골드" value={stats.byGrade.골드} />
          <StatCard label="실버" value={stats.byGrade.실버} />
          <StatCard label="루키" value={stats.byGrade.루키} />
          {pipeline.slice(0, 4).map(p => <StatCard key={p.label} label={p.label} value={p.count} />)}
        </div>

        <InfluencerFilters
          platform={sp.platform ?? ''}
          grade={sp.grade ?? ''}
          status={sp.status ?? ''}
          q={sp.q ?? ''}
          excluded={includeExcluded}
        />

        {data.influencers.length === 0 ? (
          <EmptyState hasAny={stats.total > 0} />
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">
              총 <strong className="text-charcoal">{data.total}</strong>명
              {stats.excluded > 0 && !includeExcluded && <span className="ml-2">(제외 {stats.excluded}명 숨김)</span>}
            </p>
            <InfluencerTable influencers={data.influencers} />
            <Suspense>
              <Pagination currentPage={data.page} totalPages={data.totalPages} />
            </Suspense>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm text-center">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-semibold text-charcoal text-sm tabular-nums">{value.toLocaleString('ko-KR')}</p>
    </div>
  )
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-4xl mb-4">🔎</div>
      <h3 className="font-serif text-xl text-charcoal mb-2">
        {hasAny ? '조건에 맞는 후보가 없습니다' : '아직 수집된 후보가 없습니다'}
      </h3>
      <p className="text-sm text-gray-400 max-w-md leading-relaxed">
        {hasAny
          ? '필터를 바꾸거나 초기화해 보세요.'
          : 'CSV 파일을 data/influencers 폴더에 넣고 로컬에서 수집 명령을 실행하면 여기에 나타납니다.'}
      </p>
      {!hasAny && (
        <code className="mt-4 block bg-white text-charcoal text-xs p-3 rounded border border-gray-100 font-mono">
          npm run collect:influencers
        </code>
      )}
    </div>
  )
}
