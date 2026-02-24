// 스코어링 알고리즘 — TOP 100 상품 선별

import { RawProduct } from './types'

interface ScoredProduct extends RawProduct {
  score: number
  rank: number
  collected_date: string
}

/**
 * 가격 문자열 → 달러 숫자 (파싱 실패 시 0)
 */
function parsePriceDollar(price: string): number {
  const match = price.match(/[\d,.]+/)
  if (!match) return 0
  return parseFloat(match[0].replace(',', ''))
}

/**
 * 브랜드명 기준 멀티소스 출현 카운트
 */
function buildBrandCount(products: RawProduct[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const p of products) {
    const key = p.brand.toLowerCase().trim()
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

/**
 * 점수 계산
 * - 신상품(New Arrivals): +30
 * - 베스트셀러(Best Sellers): +20
 * - 할인율: discount% × 0.5
 * - 멀티소스(같은 브랜드가 여러 사이트): +10
 * - 중간 가격대($30~$200): +5
 */
function calcScore(product: RawProduct, brandCount: Map<string, number>): number {
  let score = 0

  if (product.is_new_arrival) score += 30
  if (product.is_best_seller) score += 20

  score += product.discount_rate * 0.5

  const brandKey = product.brand.toLowerCase().trim()
  if ((brandCount.get(brandKey) ?? 0) > 1) score += 10

  const dollar = parsePriceDollar(product.price)
  if (dollar >= 30 && dollar <= 200) score += 5

  return score
}

/**
 * 원본 상품 목록 → TOP 100 스코어링 + 순위 부여
 */
export function scoreAndRank(
  products: RawProduct[],
  date: string
): ScoredProduct[] {
  const brandCount = buildBrandCount(products)

  const scored = products.map(p => ({
    ...p,
    score: calcScore(p, brandCount),
    rank: 0,
    collected_date: date,
  }))

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.score - a.score)

  // TOP 100 슬라이싱 + 순위 부여
  const top100 = scored.slice(0, 100)
  top100.forEach((p, i) => {
    p.rank = i + 1
  })

  return top100
}
