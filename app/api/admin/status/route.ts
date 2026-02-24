// GET /api/admin/status — 마지막 수집 정보
import { NextResponse } from 'next/server'
import { getAvailableDates, getProductCount } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const dates = getAvailableDates()
    const lastDate = dates[0] ?? null
    const count = lastDate ? getProductCount(lastDate) : 0

    return NextResponse.json({
      lastDate,
      totalDates: dates.length,
      lastCount: count,
    })
  } catch (err) {
    console.error('[API /admin/status]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
