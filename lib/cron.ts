// node-cron 스케줄러 — 매일 KST 09:00 자동 수집
// Next.js 서버 시작 시 instrumentation.ts에서 호출

import cron from 'node-cron'
import { collect } from './collect'

let initialized = false

export function startCron() {
  if (initialized) return
  initialized = true

  // KST 09:00 = UTC 00:00 (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] 🕐 매일 자동 수집 시작 (KST 09:00)')
    try {
      const result = await collect()
      console.log(`[Cron] ✅ 완료 — 날짜: ${result.date}, 저장: ${result.saved}개`)
    } catch (err) {
      console.error('[Cron] ❌ 수집 실패:', err)
    }
  }, {
    timezone: 'UTC',
  })

  console.log('[Cron] ✅ 스케줄러 등록 완료 (매일 UTC 00:00 = KST 09:00)')
}
