// GET  /api/influencers/[id]  — 상세 (지표 이력·방송 성과·접촉 이력 포함)
// PATCH /api/influencers/[id] — 접촉 상태·채널·메모·동의 갱신
import { NextRequest, NextResponse } from 'next/server'
import {
  getInfluencerById, getSnapshots, getLives, getContactLogs, updateContact,
} from '@/lib/influencer-db'
import { CONTACT_STATUSES, ContactStatus } from '@/lib/influencer-types'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const numId = parseInt(id, 10)
  if (!Number.isFinite(numId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
  try {
    const influencer = getInfluencerById(numId)
    if (!influencer) return NextResponse.json({ error: '인플루언서를 찾을 수 없습니다' }, { status: 404 })
    return NextResponse.json({
      influencer,
      snapshots: getSnapshots(numId),
      lives: getLives(numId),
      logs: getContactLogs(numId),
    })
  } catch (err) {
    console.error('[API /influencers/id]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const numId = parseInt(id, 10)
  if (!Number.isFinite(numId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
  try {
    const body = await req.json() as Record<string, unknown>
    const status = body.contact_status
    if (status !== undefined && !CONTACT_STATUSES.includes(status as ContactStatus)) {
      return NextResponse.json({ error: `접촉 상태는 ${CONTACT_STATUSES.join('/')} 중 하나여야 합니다` }, { status: 400 })
    }
    const updated = updateContact(numId, {
      contact_status: status as ContactStatus | undefined,
      contact_channel: typeof body.contact_channel === 'string' ? body.contact_channel.slice(0, 200) : undefined,
      contact_note: typeof body.contact_note === 'string' ? body.contact_note.slice(0, 2000) : undefined,
      consent: typeof body.consent === 'boolean' ? body.consent : undefined,
    })
    if (!updated) return NextResponse.json({ error: '인플루언서를 찾을 수 없습니다' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[API PATCH /influencers/id]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
