// 수집 오케스트레이터 — 크롤링 → 스코어링 → DB 저장

import { runAllCrawlers } from './crawler/index'
import { scoreAndRank } from './scorer'
import { upsertProducts } from './db'

export async function collect(): Promise<{
  date: string
  total: number
  saved: number
}> {
  // 오늘 날짜 (KST 기준 YYYY-MM-DD)
  const now = new Date()
  // UTC+9 보정
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const date = kst.toISOString().slice(0, 10)

  console.log(`📅 수집 날짜: ${date}`)

  // 1. 크롤링
  const raw = await runAllCrawlers()
  console.log(`📊 수집된 원본 상품: ${raw.length}개`)

  // 2. 스코어링 + TOP 100
  const ranked = scoreAndRank(raw, date)
  console.log(`🏆 TOP ${ranked.length} 선정 완료`)

  // 3. 기존 전체 삭제 후 새 데이터 저장
  upsertProducts(ranked)
  console.log(`💾 DB 저장 완료 (기존 데이터 전체 교체)`)

  return { date, total: raw.length, saved: ranked.length }
}
