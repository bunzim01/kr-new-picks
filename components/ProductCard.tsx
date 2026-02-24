'use client'

import { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discount_rate > 0
  const isNewArrival = product.score >= 30 && !hasDiscount

  return (
    <article className="product-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-50">
      {/* 이미지 영역 */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        {/* 순위 배지 */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`
            inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shadow-md
            ${product.rank <= 3
              ? 'bg-blush text-white'
              : product.rank <= 10
              ? 'bg-charcoal text-white'
              : 'bg-white text-charcoal border border-gray-200'
            }
          `}>
            {product.rank}
          </span>
        </div>

        {/* 배지 영역 (NEW / SALE) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
          {isNewArrival && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              NEW
            </span>
          )}
          {hasDiscount && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{Math.round(product.discount_rate)}%
            </span>
          )}
        </div>

        {/* 상품 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = `https://placehold.co/400x533/f5f5f3/999999?text=${encodeURIComponent(product.brand)}`
          }}
        />
      </div>

      {/* 상품 정보 */}
      <div className="p-4 flex flex-col gap-1.5">
        {/* 브랜드 + 출처 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide truncate">
            {product.brand}
          </span>
          <span className="text-[10px] text-gray-300 ml-2 shrink-0">
            {product.source_site}
          </span>
        </div>

        {/* 상품명 */}
        <h2 className="font-sans font-semibold text-sm text-charcoal leading-snug line-clamp-2">
          {product.title}
        </h2>

        {/* 설명 */}
        <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">
          {product.description}
        </p>

        {/* 가격 */}
        <div className="flex items-center gap-2 mt-1">
          {hasDiscount && product.original_price && (
            <span className="text-xs text-gray-300 line-through">
              {product.original_price}
            </span>
          )}
          <span className={`text-sm font-semibold ${hasDiscount ? 'text-rose-500' : 'text-charcoal'}`}>
            {product.price || '가격 문의'}
          </span>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 mt-3">
          <a
            href={product.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium py-2 px-3 bg-charcoal text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            구매하기 →
          </a>
          <a
            href={product.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium py-2 px-3 border border-gray-200 text-charcoal rounded-lg hover:border-blush hover:text-blush-dark transition-colors"
          >
            브랜드 보기
          </a>
        </div>
      </div>
    </article>
  )
}
