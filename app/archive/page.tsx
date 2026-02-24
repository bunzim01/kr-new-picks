'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import Pagination from '@/components/Pagination'
import { SkeletonGrid } from '@/components/SkeletonCard'
import { Product } from '@/lib/types'

function formatKoreanDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`
}

function ArchiveContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') ?? '')
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'))
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  // 날짜 목록 로드
  useEffect(() => {
    fetch('/api/dates')
      .then(r => r.json())
      .then(data => {
        setDates(data.dates ?? [])
        if (!selectedDate && data.dates?.length > 0) {
          setSelectedDate(data.dates[0])
        }
      })
  }, [])

  // 상품 로드
  useEffect(() => {
    if (!selectedDate) return

    setLoading(true)
    const qs = new URLSearchParams({
      date: selectedDate,
      page: String(page),
      limit: '20',
    })

    fetch(`/api/products?${qs}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 0)
      })
      .finally(() => setLoading(false))
  }, [selectedDate, page])

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setPage(1)
    router.replace(`/archive?date=${date}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h2 className="font-serif text-2xl text-charcoal mb-1">아카이브</h2>
          <p className="text-sm text-gray-400">지난 날짜의 TOP 100을 다시 확인해보세요</p>
        </div>

        {/* 날짜 선택 */}
        <div className="mb-8">
          <label className="block text-xs text-gray-400 mb-2">날짜 선택</label>
          <select
            value={selectedDate}
            onChange={e => handleDateChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-blush transition-colors"
          >
            {dates.map(d => (
              <option key={d} value={d}>
                {formatKoreanDate(d)}
              </option>
            ))}
          </select>
          {total > 0 && (
            <span className="ml-3 text-xs text-gray-400">
              총 {total}개 상품
            </span>
          )}
        </div>

        {/* 상품 목록 */}
        {loading ? (
          <SkeletonGrid />
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            해당 날짜의 데이터가 없습니다
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} />
          </>
        )}
      </main>
    </div>
  )
}

export default function ArchivePage() {
  return (
    <Suspense fallback={<SkeletonGrid />}>
      <ArchiveContent />
    </Suspense>
  )
}
