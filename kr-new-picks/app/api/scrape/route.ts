import { NextRequest, NextResponse } from 'next/server';
import { scrapeNewProducts } from '@/lib/scraper';

// POST /api/scrape - 수동 스크래핑 트리거
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📋 수동 스크래핑 요청');

    const result = await scrapeNewProducts();

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('API 에러:', msg);

    return NextResponse.json(
      {
        success: false,
        total: 0,
        inserted: 0,
        skipped: 0,
        scraped_at: new Date().toISOString(),
        error: msg
      },
      { status: 500 }
    );
  }
}
