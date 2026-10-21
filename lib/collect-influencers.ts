// 인플루언서 수집 오케스트레이터 — 소스 실행 → 점수 계산 → DB 저장
// 오늘의 픽 100 의 collect.ts 와 같은 흐름이다.

import { runSources, SourceOptions, SourceReport } from './sources/index'
import { scoreAndRank } from './influencer-scorer'
import { upsertInfluencers } from './influencer-db'
import { ScoredInfluencer } from './influencer-types'

export interface CollectInfluencersResult {
  date: string
  collected: number
  inserted: number
  updated: number
  excluded: number
  report: SourceReport[]
  top: ScoredInfluencer[]
}

/** 오늘 날짜 (KST 기준 YYYY-MM-DD) */
export function todayKst(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

export async function collectInfluencers(opts: SourceOptions = {}): Promise<CollectInfluencersResult> {
  const date = todayKst()
  console.log(`📅 인플루언서 수집 날짜: ${date}`)

  // 1. 소스 수집
  const { rows, report } = await runSources(opts)
  for (const r of report) {
    console.log(`  📥 ${r.source}: ${r.count}명`)
    for (const n of r.notes) console.log(`     · ${n}`)
  }
  console.log(`📊 수집된 후보: ${rows.length}명`)

  // 2. 점수 계산 + 순위
  const scored = scoreAndRank(rows)
  const excluded = scored.filter(s => s.excluded).length
  console.log(`🏆 점수 계산 완료 (제외 ${excluded}명)`)

  // 3. 저장 (접촉 정보는 유지, 지표·점수만 갱신)
  const { inserted, updated } = upsertInfluencers(scored, date)
  console.log(`💾 DB 저장 완료 — 신규 ${inserted}명, 갱신 ${updated}명`)

  return {
    date,
    collected: rows.length,
    inserted,
    updated,
    excluded,
    report,
    top: scored.filter(s => !s.excluded).slice(0, 10),
  }
}
