'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = ['All', 'Gadgets', 'Home', 'Beauty', 'Fashion', 'Food', 'Other'];

interface FilterTabsProps {
  currentCategory?: string;
}

export default function FilterTabs({ currentCategory = 'All' }: FilterTabsProps) {
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORIES.map((category) => {
        const isActive = (currentCategory === category) || (!currentCategory && category === 'All');
        const params = new URLSearchParams(searchParams);

        if (category === 'All') {
          params.delete('category');
        } else {
          params.set('category', category);
        }
        params.set('page', '1'); // 필터 변경 시 첫 페이지로

        return (
          <Link
            key={category}
            href={`?${params.toString()}`}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              isActive
                ? 'bg-accent text-text'
                : 'bg-gray-200 text-text hover:bg-gray-300'
            }`}
          >
            {category}
          </Link>
        );
      })}
    </div>
  );
}
