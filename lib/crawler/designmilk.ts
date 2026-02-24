// Design Milk 디자인 아이디어 크롤러

import { Page } from 'playwright'
import { RawProduct } from '../types'
import { delay, generateDescription } from './utils'

export async function crawlDesignMilk(page: Page): Promise<RawProduct[]> {
  const results: RawProduct[] = []

  try {
    await page.goto('https://design-milk.com/category/design/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await delay()

    // 기사/제품 카드
    const cards = await page.locator('article, [class*="post"], [class*="card"]').all()
    const limit = Math.min(cards.length, 25)

    for (let i = 0; i < limit; i++) {
      try {
        const card = cards[i]
        const titleEl = await card.locator('h2, h3, a[rel="bookmark"]').first()
        const title = await titleEl.textContent() ?? ''
        const href = await card.locator('a').first().getAttribute('href') ?? ''
        const imgUrl = await card.locator('img').first().getAttribute('src') ?? ''

        if (!title.trim() || !href) continue

        results.push({
          title: title.trim(),
          image_url: imgUrl.startsWith('http') ? imgUrl : `https://design-milk.com${imgUrl}`,
          price: '',
          original_price: '',
          discount_rate: 0,
          description: generateDescription(title, '아이디어'),
          product_url: href.startsWith('http') ? href : `https://design-milk.com${href}`,
          brand: 'Design Milk',
          source_site: 'Design Milk 🇺🇸',
          category: '아이디어',
          is_new_arrival: true,
          is_best_seller: false,
        })
      } catch {
        // 개별 카드 실패 시 건너뜀
      }
    }
  } catch (err) {
    console.error('[Design Milk] 크롤링 실패:', err)
  }

  return results
}
