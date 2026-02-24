'use client'

import Link from 'next/link'

// 오늘 날짜를 한국어 포맷으로 (예: 2024년 3월 15일 금요일)
function formatKoreanDate(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}`
}

interface HeaderProps {
  date?: string
}

export default function Header({ date }: HeaderProps) {
  return (
    <header className="border-b border-gray-100 bg-background sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex flex-col">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-charcoal">
            오늘의 픽 100
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{formatKoreanDate(date)}</p>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-6">
          <Link
            href="/archive"
            className="text-sm text-gray-500 hover:text-charcoal transition-colors"
          >
            아카이브
          </Link>
          <Link
            href="/admin"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            관리
          </Link>
        </nav>
      </div>

      {/* 서브타이틀 */}
      <div className="max-w-6xl mx-auto px-4 pb-3">
        <p className="text-xs text-gray-400 font-sans">
          전 세계 감도 높은 쇼핑몰에서 엄선한 오늘의 인기 상품
        </p>
      </div>
    </header>
  )
}
