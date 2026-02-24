'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = [
  { label: '전체', value: '', icon: '✨' },
  { label: '뷰티', value: '뷰티', icon: '🌸' },
  { label: '라이프스타일', value: '라이프스타일', icon: '🌿' },
  { label: '아이디어', value: '아이디어', icon: '💡' },
]

interface CategoryTabsProps {
  current: string
  counts: Record<string, number>
}

export default function CategoryTabs({ current, counts }: CategoryTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('category', value)
    } else {
      params.delete('category')
    }
    params.delete('page') // 카테고리 변경 시 페이지 초기화
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORIES.map(cat => {
        const isActive = current === cat.value
        const count = counts[cat.value] ?? 0

        return (
          <button
            key={cat.value}
            onClick={() => handleClick(cat.value)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium
              border transition-all duration-200
              ${isActive
                ? 'bg-charcoal text-white border-charcoal shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-charcoal'
              }
            `}
          >
            <span className="text-base leading-none">{cat.icon}</span>
            <span>{cat.label}</span>
            {count > 0 && (
              <span className={`
                text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none
                ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-400'
                }
              `}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
