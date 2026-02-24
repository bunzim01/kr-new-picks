// POST /api/cron/collect — 수동 또는 cron 트리거
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { collect } from '@/lib/collect'

export const dynamic = 'force-dynamic'
// 크롤링은 오래 걸리므로 최대 실행 시간 연장
export const maxDuration = 300

export async function POST() {
  try {
    console.log('[API] 수동 수집 시작')
    const result = await collect()
    revalidatePath('/') // 메인 페이지 서버 컴포넌트 캐시 무효화
    return NextResponse.json({
      success: true,
      message: `${result.date} 수집 완료`,
      date: result.date,
      totalCrawled: result.total,
      saved: result.saved,
    })
  } catch (err) {
    console.error('[API /cron/collect]', err)
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
