import { NextRequest, NextResponse } from 'next/server';
import { getDb, getLastScrapedAt, getProductCount } from '@/lib/db';

// GET /api/scrape/status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const db = getDb();

    // 마지막 스크래핑 정보
    const stmt = db.prepare(`
      SELECT scraped_at, status, inserted_count, total_fetched
      FROM scrape_log
      ORDER BY scraped_at DESC
      LIMIT 1
    `);
    const lastLog = stmt.get() as unknown as {
      scraped_at: string;
      status: string;
      inserted_count: number;
      total_fetched: number;
    } | undefined;

    const lastScraped = lastLog?.scraped_at || null;
    const status = lastLog?.status || 'pending';
    const inserted = lastLog?.inserted_count || 0;
    const total = getProductCount();

    return NextResponse.json(
      {
        lastScraped,
        status,
        inserted,
        total
      },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('API 에러:', msg);

    return NextResponse.json(
      {
        lastScraped: null,
        status: 'error',
        inserted: 0,
        total: 0,
        error: msg
      },
      { status: 500 }
    );
  }
}
