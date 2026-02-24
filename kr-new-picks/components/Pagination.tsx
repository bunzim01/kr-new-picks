'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `?${params.toString()}`;
  };

  // 페이지 범위 (최대 5개)
  const pageRange = 2;
  const startPage = Math.max(1, currentPage - pageRange);
  const endPage = Math.min(totalPages, currentPage + pageRange);

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* 이전 */}
      {currentPage > 1 && (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
        >
          ← 이전
        </Link>
      )}

      {/* 페이지 번호 */}
      {startPage > 1 && (
        <>
          <Link
            href={getPageUrl(1)}
            className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            1
          </Link>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
        const page = startPage + i;
        const isActive = page === currentPage;

        return (
          <Link
            key={page}
            href={getPageUrl(page)}
            className={`px-3 py-2 rounded border ${
              isActive
                ? 'border-accent bg-accent text-white font-semibold'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {page}
          </Link>
        );
      })}

      {/* 다음 */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <Link
            href={getPageUrl(totalPages)}
            className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
        >
          다음 →
        </Link>
      )}
    </div>
  );
}
