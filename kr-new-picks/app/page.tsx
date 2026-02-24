import { Suspense } from 'react';
import Header from '@/components/Header';
import FilterTabs from '@/components/FilterTabs';
import ProductGrid from '@/components/ProductGrid';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function ProductContent({ category, page }: { category?: string; page: number }) {
  const { products, total } = getProducts(page, 20, category);

  const totalPages = Math.ceil(total / 20);

  return <ProductGrid products={products} total={total} page={page} totalPages={totalPages} />;
}

export default async function Home({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const category = params.category;
  const page = Math.max(1, parseInt(params.page || '1'));

  return (
    <main>
      <Header />

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <FilterTabs currentCategory={category} />

        <Suspense fallback={<LoadingSkeleton />}>
          <ProductContent category={category} page={page} />
        </Suspense>
      </div>
    </main>
  );
}
