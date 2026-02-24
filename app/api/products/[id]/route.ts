// GET /api/products/[id]
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const db = getDb()
    const product = db.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).get(parseInt(id)) as unknown as Record<string, unknown> | undefined

    if (!product) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (err) {
    console.error('[API /products/id]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
