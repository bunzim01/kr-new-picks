// Goop 라이프스타일 큐레이션 크롤러

import { Page } from 'playwright'
import { RawProduct } from '../types'
import { delay, generateDescription } from './utils'

export async function crawlGoop(page: Page): Promise<RawProduct[]> {
  const results: RawProduct[] = []

  try {
    await page.goto('https://goop.com/collections', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await delay()

    // 제품 아이템 선택
    const items = await page.locator('[data-test-id="collection-item"]').all()
    const limit = Math.min(items.length, 25)

    for (let i = 0; i < limit; i++) {
      try {
        const item = items[i]
        const titleEl = await item.locator('h3, h2, [class*="title"]').first()
        const title = await titleEl.textContent() ?? ''
        const linkEl = await item.locator('a').first()
        const href = await linkEl.getAttribute('href') ?? ''
        const imgUrl = await item.locator('img').first().getAttribute('src') ?? ''

        if (!title.trim()) continue

        results.push({
          title: title.trim(),
          image_url: imgUrl.startsWith('http') ? imgUrl : `https://goop.com${imgUrl}`,
          price: '',
          original_price: '',
          discount_rate: 0,
          description: generateDescription(title, '라이프스타일'),
          product_url: href.startsWith('http') ? href : `https://goop.com${href}`,
          brand: 'Goop',
          source_site: 'Goop 🇺🇸',
          category: '라이프스타일',
          is_new_arrival: true,
          is_best_seller: false,
        })
      } catch {
        // 개별 아이템 실패 시 건너뜀
      }
    }
  } catch (err) {
    console.error('[Goop] 크롤링 실패:', err)
  }

  return results
}
