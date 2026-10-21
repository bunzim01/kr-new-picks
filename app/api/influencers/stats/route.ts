// GET /api/influencers/stats — 등급·접촉 단계별 인원
import { NextResponse } from 'next/server'
import { getInfluencerStats } from '@/lib/influencer-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(getInfluencerStats())
  } catch (err) {
    console.error('[API /influencers/stats]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
