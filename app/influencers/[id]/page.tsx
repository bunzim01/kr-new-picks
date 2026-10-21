// 인플루언서 상세 — 점수 내역, 원본 지표, 접촉 관리, 방송 성과, 지표 이력
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import GradeBadge from '@/components/influencers/GradeBadge'
import StatusBadge from '@/components/influencers/StatusBadge'
import ScoreBar from '@/components/influencers/ScoreBar'
import ContactPanel from '@/components/influencers/ContactPanel'
import LiveForm from '@/components/influencers/LiveForm'
import { getInfluencerById, getSnapshots, getLives, getContactLogs } from '@/lib/influencer-db'
import { benchmarkEngagement } from '@/lib/influencer-scorer'
import { PLATFORM_LABELS } from '@/lib/influencer-types'

export const dynamic = 'force-dynamic'

function fmt(n: number | null | undefined, suffix = ''): string {
  if (n === null || n === undefined) return '–'
  return `${n.toLocaleString('ko-KR')}${suffix}`
}

function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '–'
  return `${Math.round(n * 100)}%`
}

function yn(v: boolean): string {
  return v ? '있음' : '없음'
}

export default async function InfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseInt(id, 10)
  if (!Number.isFinite(numId)) notFound()

  const inf = getInfluencerById(numId)
  if (!inf) notFound()

  const snapshots = getSnapshots(numId)
  const lives = getLives(numId)
  const logs = getContactLogs(numId)
  const erBench = benchmarkEngagement(inf.followers, inf.platform)

  const metrics: Array<[string, string]> = [
    ['팔로워', fmt(inf.followers)],
    ['게시물 수', fmt(inf.posts_count)],
    ['참여율', inf.engagement_rate === null ? '–' : `${inf.engagement_rate.toFixed(2)}% (기준 ${erBench.toFixed(2)}%)`],
    ['평균 좋아요 / 댓글', `${fmt(inf.avg_likes)} / ${fmt(inf.avg_comments)}`],
    ['평균 조회수', fmt(inf.avg_views)],
    ['여성 비중 / 20~40대 비중', `${pct(inf.female_ratio)} / ${pct(inf.age_20_40_ratio)}`],
    ['최근 90일 라이브', fmt(inf.live_count_90d, '회')],
    ['라이브 평균 동시 시청', fmt(inf.avg_live_viewers, '명')],
    ['댓글 응답 비율', pct(inf.comment_reply_rate)],
    ['제휴 링크 / TikTok Shop', `${yn(inf.has_affiliate_link)} / ${yn(inf.is_tiktok_shop_seller)}`],
    ['과거 PR 투고', fmt(inf.past_pr_posts, '건')],
    ['90일 팔로워 성장', inf.follower_growth_90d === null ? '–' : `${(inf.follower_growth_90d * 100).toFixed(1)}%`],
    ['바이럴 게시물 / 미디어 노출', `${fmt(inf.viral_posts_90d)} / ${fmt(inf.media_mentions)}`],
    ['가짜 팔로워 비율', pct(inf.fake_follower_ratio)],
    ['炎上 이력', yn(inf.enjo_history)],
    ['사무소', inf.agency || '–'],
    ['연락처', inf.contact_email || inf.contact_url || '–'],
    ['데이터 출처 / 수집일', `${inf.source || '–'} / ${inf.source_date || '–'}`],
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/influencers" className="text-xs text-gray-400 hover:text-charcoal">← 후보 목록</Link>

        {/* 머리 */}
        <div className="flex flex-wrap items-start justify-between gap-4 mt-3 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-serif text-2xl text-charcoal">{inf.display_name || inf.handle}</h2>
              <GradeBadge grade={inf.grade} excluded={inf.excluded} />
              <StatusBadge status={inf.contact_status} />
            </div>
            <p className="text-sm text-gray-400">
              {PLATFORM_LABELS[inf.platform] ?? inf.platform} · @{inf.handle}
              {inf.profile_url && (
                <a href={inf.profile_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blush-dark hover:underline">프로필 열기 ↗</a>
              )}
            </p>
            {inf.category_tags && <p className="text-xs text-gray-400 mt-1">{inf.category_tags}</p>}
            {inf.excluded && <p className="text-xs text-rose-600 mt-2">제외 사유: {inf.exclude_reason}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">총점 · 순위</p>
            <p className="font-serif text-3xl text-charcoal">
              {inf.score.toFixed(1)}
              <span className="text-sm text-gray-400 ml-2">{inf.rank > 0 ? `${inf.rank}위` : '순위 없음'}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 점수·지표 */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-medium text-charcoal text-sm mb-4">점수 내역</h3>
              <div className="space-y-2">
                <ScoreBar label="영향력" value={inf.score_influence} max={25} />
                <ScoreBar label="판매력" value={inf.score_sales} max={40} />
                <ScoreBar label="이슈력" value={inf.score_buzz} max={20} />
                <ScoreBar label="신뢰도" value={inf.score_trust} max={15} />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-medium text-charcoal text-sm mb-4">원본 지표</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {metrics.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-gray-50">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="text-charcoal text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-medium text-charcoal text-sm mb-4">방송 성과 {lives.length > 0 && <span className="text-gray-400">({lives.length}회)</span>}</h3>
              {lives.length > 0 && (
                <table className="w-full text-xs mb-5">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="py-2 text-left font-medium">방송일</th>
                      <th className="py-2 text-right font-medium">최고/평균 시청</th>
                      <th className="py-2 text-right font-medium">시간</th>
                      <th className="py-2 text-right font-medium">매출(엔)</th>
                      <th className="py-2 text-right font-medium">주문</th>
                      <th className="py-2 text-left font-medium pl-3">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lives.map(l => (
                      <tr key={l.id} className="border-b border-gray-50">
                        <td className="py-2">{l.live_date}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(l.viewers_peak)} / {fmt(l.viewers_avg)}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(l.duration_min, '분')}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(l.sales_jpy)}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(l.orders)}</td>
                        <td className="py-2 pl-3 text-gray-500">{l.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <LiveForm id={inf.id} consent={inf.consent} />
            </section>

            {snapshots.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-medium text-charcoal text-sm mb-4">지표 이력</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="py-2 text-left font-medium">수집일</th>
                      <th className="py-2 text-right font-medium">팔로워</th>
                      <th className="py-2 text-right font-medium">참여율</th>
                      <th className="py-2 text-right font-medium">90일 라이브</th>
                      <th className="py-2 text-right font-medium">총점</th>
                      <th className="py-2 text-left font-medium pl-3">등급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map(s => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="py-2">{s.snapshot_date}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(s.followers)}</td>
                        <td className="py-2 text-right tabular-nums">{s.engagement_rate === null ? '–' : `${s.engagement_rate.toFixed(2)}%`}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(s.live_count_90d)}</td>
                        <td className="py-2 text-right tabular-nums">{s.score.toFixed(1)}</td>
                        <td className="py-2 pl-3">{s.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>

          {/* 오른쪽: 접촉 관리 */}
          <div className="space-y-6">
            <ContactPanel
              id={inf.id}
              status={inf.contact_status}
              channel={inf.contact_channel}
              note={inf.contact_note}
              consent={inf.consent}
              consentDate={inf.consent_date}
            />
            <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-medium text-charcoal text-sm mb-3">접촉 이력</h3>
              {logs.length === 0 ? (
                <p className="text-xs text-gray-400">아직 이력이 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {logs.map(l => (
                    <li key={l.id} className="text-xs border-l-2 border-blush pl-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={l.status} />
                        <span className="text-gray-400">{l.logged_at}</span>
                        {l.channel && <span className="text-gray-500">· {l.channel}</span>}
                      </div>
                      {l.note && <p className="text-gray-600 mt-1 whitespace-pre-wrap">{l.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
