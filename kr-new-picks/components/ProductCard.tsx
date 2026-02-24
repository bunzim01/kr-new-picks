'use client';

import Image from 'next/image';
import { Product } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="20"%3EImage not available%3C/text%3E%3C/svg%3E';

export default function ProductCard({ product }: ProductCardProps) {
  const categoryColor = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      {/* 이미지 */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        <Image
          src={product.image_url || PLACEHOLDER}
          alt={product.title}
          fill
          className="object-cover"
          priority={false}
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
        />
      </div>

      {/* 내용 */}
      <div className="p-4">
        {/* 카테고리 배지 */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${categoryColor.bg} ${categoryColor.text}`}
          >
            {product.category}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="font-noto-serif text-sm font-semibold line-clamp-2 text-text mb-2 leading-snug">
          {product.title}
        </h3>

        {/* 설명 */}
        <p className="font-noto-sans text-xs text-gray-600 line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* 가격 및 브랜드 */}
        <div className="flex justify-between items-center mb-3 text-xs">
          <span className="text-gray-500">{product.brand || 'Unknown'}</span>
          {product.price && <span className="font-semibold text-accent">{product.price}</span>}
        </div>

        {/* 출처 */}
        <div className="text-xs text-gray-400 mb-3">
          출처: {product.source_site}
        </div>

        {/* 버튼 */}
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 px-3 bg-text text-bg text-center text-sm font-semibold rounded hover:bg-accent hover:text-text transition-colors"
        >
          상품 보기
        </a>
      </div>
    </div>
  );
}
