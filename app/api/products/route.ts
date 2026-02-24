// GET /api/products?date=&category=&page=&limit=20
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const category = searchParams.get('category') ?? ''
  const offset = (page - 1) * limit

  // date 미지정 시 가장 최신 날짜 사용
  let date = searchParams.get('date') ?? ''

  try {
    const db = getDb()

    if (!date) {
      const latest = db.prepare(
        'SELECT collected_date FROM products ORDER BY collected_date DESC LIMIT 1'
      ).get() as unknown as { collected_date: string } | undefined
      date = latest?.collected_date ?? ''
    }

    if (!date) {
      return NextResponse.json({
        products: [],
        total: 0,
        page: 1,
        totalPages: 0,
        date: '',
      })
    }

    const where = category
      ? `WHERE collected_date = ? AND category = ?`
      : `WHERE collected_date = ?`
    const params: string[] = category ? [date, category] : [date]

    const total = (db.prepare(
      `SELECT COUNT(*) as cnt FROM products ${where}`
    ).get(...params) as unknown as { cnt: number }).cnt

    const products = db.prepare(
      `SELECT * FROM products ${where} ORDER BY rank ASC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset)

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      date,
    })
  } catch (err) {
    console.error('[API /products]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
