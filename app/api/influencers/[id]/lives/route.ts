// POST /api/influencers/[id]/lives — 라이브 방송 성과 기록 (리그 참가 동의 후)
import { NextRequest, NextResponse } from 'next/server'
import { addLive, getInfluencerById } from '@/lib/influencer-db'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const numId = parseInt(id, 10)
  if (!Number.isFinite(numId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
  try {
    const current = getInfluencerById(numId)
    if (!current) return NextResponse.json({ error: '인플루언서를 찾을 수 없습니다' }, { status: 404 })
    if (!current.consent) {
      return NextResponse.json({ error: '동의 전에는 방송 성과를 기록할 수 없습니다 (개인정보 보호)' }, { status: 403 })
    }
    const body = await req.json() as Record<string, unknown>
    if (typeof body.live_date !== 'string') return NextResponse.json({ error: 'live_date 가 필요합니다' }, { status: 400 })
    const live = addLive(numId, {
      live_date: body.live_date,
      platform: typeof body.platform === 'string' ? body.platform : undefined,
      viewers_peak: num(body.viewers_peak),
      viewers_avg: num(body.viewers_avg),
      duration_min: num(body.duration_min),
      sales_jpy: num(body.sales_jpy),
      orders: num(body.orders),
      note: typeof body.note === 'string' ? body.note.slice(0, 1000) : '',
    })
    return NextResponse.json(live, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '서버 오류'
    console.error('[API POST /influencers/id/lives]', err)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
