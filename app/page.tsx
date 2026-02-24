import { Suspense } from 'react'
import Header from '@/components/Header'

// router.refresh() 호출 시 항상 최신 DB 데이터를 반환하도록 동적 렌더링 강제
export const dynamic = 'force-dynamic'

import CategoryTabs from '@/components/CategoryTabs'
import CollectButton from '@/components/CollectButton'
import ProductCard from '@/components/ProductCard'
import Pagination from '@/components/Pagination'
import { SkeletonGrid } from '@/components/SkeletonCard'
import { Product, ProductsResponse } from '@/lib/types'

interface SearchParams {
  category?: string
  page?: string
  date?: string
}

async function fetchProducts(params: SearchParams): Promise<ProductsResponse> {
  const qs = new URLSearchParams()
  if (params.category) qs.set('category', params.category)
  if (params.page) qs.set('page', params.page)
  if (params.date) qs.set('date', params.date)

  // 서버 컴포넌트에서 직접 DB 접근 (API 라우트 대신)
  const { getDb } = await import('@/lib/db')
  const db = getDb()

  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const category = params.category ?? ''

  // 최신 날짜 조회
  let date = params.date ?? ''
  if (!date) {
    const latest = db.prepare(
      'SELECT collected_date FROM products ORDER BY collected_date DESC LIMIT 1'
    ).get() as unknown as { collected_date: string } | undefined
    date = latest?.collected_date ?? ''
  }

  if (!date) {
    return { products: [], total: 0, page: 1, totalPages: 0, date: '' }
  }

  const where = category
    ? `WHERE collected_date = ? AND category = ?`
    : `WHERE collected_date = ?`
  const bindParams: (string | number)[] = category ? [date, category] : [date]

  const total = (db.prepare(
    `SELECT COUNT(*) as cnt FROM products ${where}`
  ).get(...bindParams) as unknown as { cnt: number }).cnt

  // node:sqlite 반환 객체는 null-prototype → plain object로 변환
  const products = (db.prepare(
    `SELECT * FROM products ${where} ORDER BY rank ASC LIMIT ? OFFSET ?`
  ).all(...bindParams, limit, offset) as unknown as Product[]).map(r => ({ ...r }))

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    date,
  }
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

async function fetchCategoryCounts(date: string): Promise<Record<string, number>> {
  if (!date) return {}
  const { getDb } = await import('@/lib/db')
  const db = getDb()

  // 카테고리별 상품 수 집계 (전체 포함)
  const rows = (db.prepare(
    `SELECT category, COUNT(*) as cnt FROM products WHERE collected_date = ? GROUP BY category`
  ).all(date) as unknown as Array<{ category: string; cnt: number }>)

  const counts: Record<string, number> = { '': 0 }
  for (const row of rows) {
    counts[row.category] = row.cnt
    counts[''] += row.cnt
  }
  return counts
}

export default async function HomePage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise
  const data = await fetchProducts(searchParams)
  const category = searchParams.category ?? ''

  // 카테고리 탭에 표시할 상품 수 집계
  const categoryCounts = await fetchCategoryCounts(data.date)

  return (
    <div className="min-h-screen bg-background">
      <Header date={data.date} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 카테고리 탭 + 추가수집 버튼 */}
        <div className="flex items-start justify-between gap-4">
          <Suspense>
            <CategoryTabs current={category} counts={categoryCounts} />
          </Suspense>
          <CollectButton />
        </div>

        {/* 상품 없음 처리 */}
        {data.products.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* 결과 수 표시 */}
            <p className="text-xs text-gray-400 mb-6">
              총 <strong className="text-charcoal">{data.total}</strong>개 상품
            </p>

            {/* 상품 그리드 */}
            <Suspense fallback={<SkeletonGrid />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Suspense>

            {/* 페이지네이션 */}
            <Suspense>
              <Pagination
                currentPage={data.page}
                totalPages={data.totalPages}
              />
            </Suspense>
          </>
        )}
      </main>

      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-300 font-sans">
            © 오늘의 픽 100 — 매일 오전 9시 자동 업데이트
          </p>
        </div>
      </footer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-4xl mb-4">🌸</div>
      <h2 className="font-serif text-xl text-charcoal mb-2">
        오늘의 데이터를 수집 중입니다
      </h2>
      <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
        매일 오전 9시에 전 세계 감도 높은 쇼핑몰에서 상품을 수집합니다.
        잠시 후 다시 확인해 주세요.
      </p>
      <a
        href="/admin"
        className="mt-6 inline-block text-xs text-blush-dark border border-blush rounded-full px-5 py-2 hover:bg-blush-light transition-colors"
      >
        지금 수집하기 →
      </a>
    </div>
  )
}
