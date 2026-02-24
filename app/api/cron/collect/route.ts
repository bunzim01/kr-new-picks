// POST /api/cron/collect — 수동 또는 cron 트리거
// ⚠️ Vercel serverless에서는 Playwright 실행 불가
// → 로컬에서 `npm run collect` 실행 후 DB에 저장된 데이터 조회
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Vercel에서는 크롤링이 불가능합니다.',
    guide: '로컬에서 "npm run collect"를 실행하세요.',
  }, { status: 400 })
}
