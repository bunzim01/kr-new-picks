// GET /api/dates — 수집된 날짜 목록
import { NextResponse } from 'next/server'
import { getAvailableDates } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const dates = getAvailableDates()
    return NextResponse.json({ dates })
  } catch (err) {
    console.error('[API /dates]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
