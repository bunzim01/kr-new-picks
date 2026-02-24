import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getLastScrapedAt } from '@/lib/db';

// GET /api/products?page=1&limit=20&category=Gadgets
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const category = searchParams.get('category') || undefined;

    // 유효성 검사
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: '잘못된 페이지네이션 파라미터' },
        { status: 400 }
      );
    }

    // 데이터 조회
    const { products, total } = getProducts(page, limit, category);

    // 마지막 스크래핑 시각
    const lastScrapedAt = getLastScrapedAt();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        products,
        total,
        page,
        totalPages,
        lastScrapedAt
      },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('API 에러:', msg);

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
