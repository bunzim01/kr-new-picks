import { RawProduct } from './types';
import { includesKeyword } from './utils';

// 제외 키워드 (이 중 하나라도 포함하면 스킵)
const EXCLUDE_KEYWORDS = [
  'funding',
  'raises',
  'series a',
  'series b',
  'series c',
  'b2b',
  'enterprise',
  'platform',
  'service',
  'app',
  'software',
  'startup',
  'saas',
  'acquisition',
  'ipo',
  'investment',
  'press release',
  'partnership',
  'acquisition',
  'merge',
  'report'
];

// 포함 키워드 (이 중 최소 하나 이상 포함해야 함)
const INCLUDE_KEYWORDS = [
  'new product',
  'launch',
  'release',
  'now available',
  'buy',
  'price',
  'pre-order',
  'coming soon',
  'available',
  'limited edition',
  'exclusive',
  'deal',
  'first look',
  'review'
];

// 제외 키워드 필터
export function filterByExcludeKeywords(product: RawProduct): boolean {
  const text = `${product.title} ${product.description || ''}`.toLowerCase();

  for (const keyword of EXCLUDE_KEYWORDS) {
    if (text.includes(keyword)) {
      return false;
    }
  }

  return true;
}

// 포함 키워드 필터 (최소 하나 이상)
export function filterByIncludeKeywords(product: RawProduct): boolean {
  const text = `${product.title} ${product.description || ''}`;

  return includesKeyword(text, INCLUDE_KEYWORDS);
}

// 복합 필터 (제외 + 포함)
export function applyFilters(products: RawProduct[]): RawProduct[] {
  return products
    .filter(filterByExcludeKeywords) // 제외 키워드 체크
    .filter(filterByIncludeKeywords); // 포함 키워드 체크
}

// 필터링 통계
export function getFilterStats(
  original: RawProduct[],
  filtered: RawProduct[]
): { excluded: number; percentage: number } {
  const excluded = original.length - filtered.length;
  const percentage = original.length > 0 ? Math.round((excluded / original.length) * 100) : 0;
  return { excluded, percentage };
}
