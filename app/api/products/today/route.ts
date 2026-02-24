// 수집 전 초기화 — 기존 전체 데이터 삭제
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function DELETE() {
  try {
    const db = getDb()
    db.exec('DELETE FROM products')

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}
