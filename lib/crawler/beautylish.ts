// Beautylish 뷰티 크롤러 — New Arrivals & Best Sellers

import { Page } from 'playwright'
import { RawProduct } from '../types'
import { delay, generateDescription } from './utils'

export async function crawlBeautylish(page: Page): Promise<RawProduct[]> {
  const results: RawProduct[] = []

  try {
    await page.goto('https://www.beautylish.com/new-arrivals', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await delay()

    // 상품 카드 선택
    const cards = await page.locator('[data-testid="product-card"]').all()
    const limit = Math.min(cards.length, 30)

    for (let i = 0; i < limit; i++) {
      try {
        const card = cards[i]
        const title = await card.locator('[data-testid="product-title"]').textContent() ?? ''
        const priceEl = await card.locator('[data-testid="product-price"]').textContent() ?? ''
        const imgUrl = await card.locator('img').first().getAttribute('src') ?? ''
        const href = await card.locator('a').first().getAttribute('href') ?? ''

        if (!title.trim()) continue

        results.push({
          title: title.trim(),
          image_url: imgUrl.startsWith('http') ? imgUrl : `https://www.beautylish.com${imgUrl}`,
          price: priceEl.match(/\$[\d.]+/)?.[0] ?? '',
          original_price: '',
          discount_rate: 0,
          description: generateDescription(title, '뷰티'),
          product_url: href.startsWith('http') ? href : `https://www.beautylish.com${href}`,
          brand: 'Beautylish',
          source_site: 'Beautylish 🇺🇸',
          category: '뷰티',
          is_new_arrival: true,
          is_best_seller: false,
        })
      } catch {
        // 개별 카드 실패 시 건너뜀
      }
    }
  } catch (err) {
    console.error('[Beautylish] 크롤링 실패:', err)
  }

  return results
}
