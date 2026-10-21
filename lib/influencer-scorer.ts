// 인플루언서 점수 계산 — 영향력 25 · 판매력 40 · 이슈력 20 · 신뢰도 15 = 100점
// 오늘의 픽 100 의 상품 점수(scorer.ts)와 같은 '가산식'이라 가중치를 바꾸며 튜닝할 수 있다.

import {
  RawInfluencer, ScoreBreakdown, ScoredInfluencer, Grade, Platform,
} from './influencer-types'
import {
  WEIGHTS, GRADE_CUTOFFS, EXCLUDE_RULES, ER_BENCHMARK, ER_PLATFORM_FACTOR,
} from './influencer-weights'

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

/**
 * 꺾은선 보간 — points 는 [x, y] 를 x 오름차순으로.
 * x 가 범위 밖이면 양 끝 값을 그대로 쓴다.
 */
function interp(x: number, points: Array<[number, number]>): number {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]
    if (x <= x1) {
      const [x0, y0] = points[i - 1]
      return y0 + (y1 - y0) * ((x - x0) / (x1 - x0))
    }
  }
  return points[points.length - 1][1]
}

/** 0~1 비율이 null 이면 '중립'(0.5) 로 본다 — 데이터가 없다고 불이익을 주지 않기 위해 */
function ratioOrNeutral(v: number | null): number {
  if (v === null || Number.isNaN(v)) return 0.5
  return clamp(v, 0, 1)
}

/** 팔로워 규모·플랫폼에 맞는 참여율 기준값(%) */
export function benchmarkEngagement(followers: number, platform: Platform): number {
  const row = ER_BENCHMARK.find(b => followers <= b.maxFollowers) ?? ER_BENCHMARK[ER_BENCHMARK.length - 1]
  return row.er * (ER_PLATFORM_FACTOR[platform] ?? 1)
}

/**
 * 비어 있는 값을 다른 값에서 유도한다.
 * - 참여율이 없고 평균 좋아요·댓글이 있으면 (좋아요+댓글)/팔로워 로 계산
 */
export function withDerived(r: RawInfluencer): RawInfluencer {
  const out = { ...r }
  if (
    (out.engagement_rate === null || out.engagement_rate === undefined) &&
    out.followers > 0 &&
    (out.avg_likes !== null || out.avg_comments !== null)
  ) {
    const interactions = (out.avg_likes ?? 0) + (out.avg_comments ?? 0)
    out.engagement_rate = round1((interactions / out.followers) * 1000) / 10
  }
  return out
}

/** 영향력 (최대 25): 도달 규모 + 여성 비중 + 20~40대 비중 */
export function scoreInfluence(r: RawInfluencer): number {
  const w = WEIGHTS.influence
  // 팔로워 1천 → 20%, 1만 → 50%, 10만 → 80%, 100만 → 100%
  const reach = interp(Math.log10(Math.max(1, r.followers)), [[3, 0.2], [4, 0.5], [5, 0.8], [6, 1]])
  const female = ratioOrNeutral(r.female_ratio)
  const age = ratioOrNeutral(r.age_20_40_ratio)
  return reach * w.reach + female * w.female + age * w.age2040
}

/** 판매력 (최대 40): 라이브 역량 25 + 커머스 신호 15 */
export function scoreSales(r: RawInfluencer): number {
  const w = WEIGHTS.sales
  // 90일 라이브 0회 → 0, 3회 → 60%, 6회 → 80%, 12회 이상 → 100%
  const liveCount = r.live_count_90d === null ? 0
    : interp(r.live_count_90d, [[0, 0], [3, 0.6], [6, 0.8], [12, 1]])
  // 평균 동시 시청 50명 → 30%, 200명 → 60%, 500명 → 80%, 2,000명 이상 → 100%
  const liveViewers = r.avg_live_viewers === null ? 0
    : interp(r.avg_live_viewers, [[0, 0], [50, 0.3], [200, 0.6], [500, 0.8], [2000, 1]])
  const reply = r.comment_reply_rate === null ? 0.4 : clamp(r.comment_reply_rate, 0, 1)
  const tiktokShop = r.is_tiktok_shop_seller ? 1 : 0
  const affiliate = r.has_affiliate_link ? 1 : 0
  // PR 투고 1건 → 40%, 3건 → 80%, 5건 이상 → 100%
  const pr = r.past_pr_posts === null ? 0
    : interp(r.past_pr_posts, [[0, 0], [1, 0.4], [3, 0.8], [5, 1]])

  return liveCount * w.liveCount
    + liveViewers * w.liveViewers
    + reply * w.replyRate
    + tiktokShop * w.tiktokShop
    + affiliate * w.affiliate
    + pr * w.prPosts
}

/** 이슈력 (최대 20): 성장세 10 + 화제성 10 */
export function scoreBuzz(r: RawInfluencer): number {
  const w = WEIGHTS.buzz
  // 90일 성장률 0% → 20%, +5% → 50%, +15% → 80%, +30% 이상 → 100%, 감소 → 0
  const growth = r.follower_growth_90d === null ? 0.2
    : interp(r.follower_growth_90d, [[-0.05, 0], [0, 0.2], [0.05, 0.5], [0.15, 0.8], [0.3, 1]])
  const viral = r.viral_posts_90d === null ? 0
    : interp(r.viral_posts_90d, [[0, 0], [1, 0.35], [3, 0.7], [5, 1]])
  const media = r.media_mentions === null ? 0
    : interp(r.media_mentions, [[0, 0], [1, 0.5], [3, 1]])
  return growth * w.growth + viral * w.viral + media * w.media
}

/** 신뢰도 (최대 15): 규모 보정 참여율 8 + 가짜 팔로워 4 + 炎上 없음 3 */
export function scoreTrust(r: RawInfluencer): number {
  const w = WEIGHTS.trust
  let engagement = 0.5 // 참여율을 모르면 중립
  if (r.engagement_rate !== null && r.followers > 0) {
    const bench = benchmarkEngagement(r.followers, r.platform)
    const ratio = r.engagement_rate / bench
    // 기준의 절반 이하 → 0, 기준 → 50%, 1.5배 → 75%, 2배 이상 → 100%
    engagement = interp(ratio, [[0.5, 0], [1, 0.5], [1.5, 0.75], [2, 1]])
  }
  const fake = r.fake_follower_ratio === null ? 0.5
    : interp(r.fake_follower_ratio, [[0.05, 1], [0.1, 0.8], [0.2, 0.4], [0.3, 0]])
  const enjo = r.enjo_history ? 0 : 1
  return engagement * w.engagement + fake * w.fake + enjo * w.enjo
}

/** 총점 → 등급 (제외 대상은 미분류) */
export function gradeOf(total: number, excluded: boolean): Grade {
  if (excluded) return '미분류'
  if (total >= GRADE_CUTOFFS.골드) return '골드'
  if (total >= GRADE_CUTOFFS.실버) return '실버'
  if (total >= GRADE_CUTOFFS.루키) return '루키'
  return '미분류'
}

/** 제외 규칙 검사 */
export function checkExclusion(r: RawInfluencer): { excluded: boolean; reason: string } {
  const reasons: string[] = []
  if (r.fake_follower_ratio !== null && r.fake_follower_ratio > EXCLUDE_RULES.fakeFollowerRatio) {
    reasons.push(`가짜 팔로워 ${Math.round(r.fake_follower_ratio * 100)}%`)
  }
  if (EXCLUDE_RULES.enjoHistory && r.enjo_history) {
    reasons.push('炎上 이력')
  }
  return { excluded: reasons.length > 0, reason: reasons.join(', ') }
}

/** 한 명의 점수 계산 */
export function calcScore(raw: RawInfluencer): ScoreBreakdown {
  const r = withDerived(raw)
  const influence = round1(scoreInfluence(r))
  const sales = round1(scoreSales(r))
  const buzz = round1(scoreBuzz(r))
  const trust = round1(scoreTrust(r))
  const total = round1(influence + sales + buzz + trust)
  const { excluded, reason } = checkExclusion(r)
  return {
    score_influence: influence,
    score_sales: sales,
    score_buzz: buzz,
    score_trust: trust,
    score: total,
    grade: gradeOf(total, excluded),
    excluded,
    exclude_reason: reason,
  }
}

/**
 * 목록 전체 점수 계산 + 순위 부여
 * 제외 대상은 순위 0 으로 두고 뒤로 보낸다.
 */
export function scoreAndRank(list: RawInfluencer[]): ScoredInfluencer[] {
  const scored: ScoredInfluencer[] = list.map(raw => {
    const r = withDerived(raw)
    return { ...r, ...calcScore(r), rank: 0 }
  })

  scored.sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1
    if (b.score !== a.score) return b.score - a.score
    return b.followers - a.followers
  })

  let rank = 0
  for (const s of scored) {
    if (!s.excluded) {
      rank += 1
      s.rank = rank
    }
  }
  return scored
}
