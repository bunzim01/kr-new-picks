// GET /api/influencers?platform=&grade=&status=&q=&page=&limit=&excluded=1
import { NextRequest, NextResponse } from 'next/server'
import { listInfluencers } from '@/lib/influencer-db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  try {
    const data = listInfluencers({
      platform: sp.get('platform') ?? undefined,
      grade: sp.get('grade') ?? undefined,
      status: sp.get('status') ?? undefined,
      q: sp.get('q') ?? undefined,
      includeExcluded: sp.get('excluded') === '1',
      page: parseInt(sp.get('page') ?? '1', 10) || 1,
      limit: parseInt(sp.get('limit') ?? '50', 10) || 50,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API /influencers]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
