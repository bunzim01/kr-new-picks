import { ExtractedProduct, FilteredProduct, CategoryType } from './types';
import { includesKeyword } from './utils';

// 카테고리별 키워드 (우선순위 순서)
const CATEGORY_KEYWORDS: Record<CategoryType, string[]> = {
  Gadgets: [
    'gadget',
    'tech',
    'device',
    'smart',
    'wireless',
    'camera',
    'drone',
    'console',
    'headphone',
    'speaker',
    'screen',
    'computer',
    'phone',
    'tablet',
    'watch',
    'smartwatch',
    'robot',
    'wearable',
    'vr',
    'ar',
    'bluetooth'
  ],
  Home: [
    'home',
    'furniture',
    'decor',
    'decoration',
    'kitchen',
    'bed',
    'storage',
    'organizer',
    'lamp',
    'table',
    'chair',
    'shelf',
    'rug',
    'pillow',
    'sofa',
    'cabinet',
    'desk',
    'bookshelf',
    'mirror',
    'curtain'
  ],
  Beauty: [
    'beauty',
    'skincare',
    'makeup',
    'cosmetics',
    'haircare',
    'fragrance',
    'serum',
    'cream',
    'lotion',
    'perfume',
    'cleanser',
    'mask',
    'treatment',
    'moisturizer',
    'sunscreen',
    'foundation',
    'lipstick',
    'eyeshadow',
    'blush',
    'shampoo'
  ],
  Fashion: [
    'fashion',
    'clothing',
    'apparel',
    'bag',
    'shoe',
    'accessory',
    'dress',
    'jacket',
    'shirt',
    'pants',
    'hat',
    'jewelry',
    'scarf',
    'sweater',
    'coat',
    'boots',
    'sneaker',
    'sandal',
    'gloves',
    'belt'
  ],
  Food: [
    'food',
    'beverage',
    'snack',
    'coffee',
    'tea',
    'chocolate',
    'recipe',
    'cookware',
    'utensil',
    'drink',
    'candy',
    'wine',
    'beer',
    'kitchen gadget',
    'blender',
    'mixer',
    'cooker',
    'grinder',
    'infuser',
    'dispenser'
  ],
  Other: []
};

// 텍스트 점수화 (매칭된 키워드 수)
function scoreCategory(text: string, keywords: string[]): number {
  let score = 0;
  const lower = text.toLowerCase();

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      score++;
    }
  }

  return score;
}

// 카테고리 분류
export function classifyCategory(product: ExtractedProduct): CategoryType {
  const text = `${product.title} ${product.description}`;

  const scores: Record<CategoryType, number> = {
    Gadgets: scoreCategory(text, CATEGORY_KEYWORDS.Gadgets),
    Home: scoreCategory(text, CATEGORY_KEYWORDS.Home),
    Beauty: scoreCategory(text, CATEGORY_KEYWORDS.Beauty),
    Fashion: scoreCategory(text, CATEGORY_KEYWORDS.Fashion),
    Food: scoreCategory(text, CATEGORY_KEYWORDS.Food),
    Other: 0
  };

  // 최고 점수 카테고리 찾기
  let maxScore = 0;
  let bestCategory: CategoryType = 'Other';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as CategoryType;
    }
  }

  // 최소 1개 키워드 매칭 필요
  return maxScore > 0 ? bestCategory : 'Other';
}

// 여러 상품 분류
export function classifyProducts(products: ExtractedProduct[]): FilteredProduct[] {
  return products.map((product) => ({
    ...product,
    category: classifyCategory(product)
  }));
}

// 카테고리별 상품 그룹핑
export function groupByCategory(products: FilteredProduct[]): Record<CategoryType, FilteredProduct[]> {
  const grouped: Record<CategoryType, FilteredProduct[]> = {
    Gadgets: [],
    Home: [],
    Beauty: [],
    Fashion: [],
    Food: [],
    Other: []
  };

  for (const product of products) {
    grouped[product.category].push(product);
  }

  return grouped;
}

// 카테고리 통계
export function getCategoryStats(products: FilteredProduct[]): Record<CategoryType, number> {
  const stats: Record<CategoryType, number> = {
    Gadgets: 0,
    Home: 0,
    Beauty: 0,
    Fashion: 0,
    Food: 0,
    Other: 0
  };

  for (const product of products) {
    stats[product.category]++;
  }

  return stats;
}
