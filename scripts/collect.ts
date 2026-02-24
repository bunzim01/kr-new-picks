#!/usr/bin/env node
// 수동 수집 스크립트 — npm run collect 으로 실행

import { collect } from '../lib/collect'

;(async () => {
  console.log('=== 오늘의 픽 100 — 수동 수집 시작 ===')
  const result = await collect()
  console.log(`=== 완료: ${result.date}, 수집 ${result.total}개 → 저장 ${result.saved}개 ===`)
  process.exit(0)
})().catch(err => {
  console.error('수집 실패:', err)
  process.exit(1)
})
