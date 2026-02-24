'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 표시할 페이지 번호 범위 계산
  const range: number[] = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)
  for (let i = start; i <= end; i++) range.push(i)

  return (
    <nav className="flex items-center justify-center gap-1 mt-12 pb-12">
      {/* 이전 */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm text-gray-400 hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← 이전
      </button>

      {/* 첫 페이지 */}
      {start > 1 && (
        <>
          <PageBtn page={1} current={currentPage} onClick={goToPage} />
          {start > 2 && <span className="text-gray-300 px-1">···</span>}
        </>
      )}

      {/* 페이지 범위 */}
      {range.map(p => (
        <PageBtn key={p} page={p} current={currentPage} onClick={goToPage} />
      ))}

      {/* 마지막 페이지 */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-300 px-1">···</span>}
          <PageBtn page={totalPages} current={currentPage} onClick={goToPage} />
        </>
      )}

      {/* 다음 */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm text-gray-400 hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        다음 →
      </button>
    </nav>
  )
}

function PageBtn({
  page,
  current,
  onClick,
}: {
  page: number
  current: number
  onClick: (p: number) => void
}) {
  const isActive = page === current
  return (
    <button
      onClick={() => onClick(page)}
      className={`w-9 h-9 rounded-full text-sm transition-all duration-200 ${
        isActive
          ? 'bg-charcoal text-white font-semibold'
          : 'text-gray-400 hover:text-charcoal hover:bg-gray-100'
      }`}
    >
      {page}
    </button>
  )
}
