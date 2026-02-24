'use client';

import { Product } from '@/lib/types';
import ProductCard from './ProductCard';
import Pagination from './Pagination';

interface ProductGridProps {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ProductGrid({
  products,
  total,
  page,
  totalPages
}: ProductGridProps) {
  return (
    <div>
      {/* 상품 수 표시 */}
      <div className="mb-4 text-sm text-gray-600">
        총 {total}개 상품 중 {(page - 1) * 20 + 1}~{Math.min(page * 20, total)}개 표시
      </div>

      {/* 상품 그리드 */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product) => (
              <ProductCard key={product.product_url} product={product} />
            ))}
          </div>

          {/* 페이지네이션 */}
          <Pagination currentPage={page} totalPages={totalPages} />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">상품이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
