// Dezeen 건축/디자인 뉴스 크롤러

import { Page } from 'playwright'
import { RawProduct } from '../types'
import { delay, generateDescription } from './utils'

export async function crawlDezeen(page: Page): Promise<RawProduct[]> {
  const results: RawProduct[] = []

  try {
    await page.goto('https://www.dezeen.com/products/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await delay()

    // 제품/기사 항목
    const items = await page.locator('article, [class*="item"], li[class*="listing"]').all()
    const limit = Math.min(items.length, 25)

    for (let i = 0; i < limit; i++) {
      try {
        const item = items[i]
        const titleEl = await item.locator('h2, h3, a').first()
        const title = await titleEl.textContent() ?? ''
        const href = await item.locator('a').first().getAttribute('href') ?? ''
        const imgUrl = await item.locator('img').first().getAttribute('src') ?? ''

        if (!title.trim() || !href) continue

        results.push({
          title: title.trim().substring(0, 100),
          image_url: imgUrl.startsWith('http') ? imgUrl : `https://www.dezeen.com${imgUrl}`,
          price: '',
          original_price: '',
          discount_rate: 0,
          description: generateDescription(title, '아이디어'),
          product_url: href.startsWith('http') ? href : `https://www.dezeen.com${href}`,
          brand: 'Dezeen',
          source_site: 'Dezeen 🇬🇧',
          category: '아이디어',
          is_new_arrival: true,
          is_best_seller: false,
        })
      } catch {
        // 개별 항목 실패 시 건너뜀
      }
    }
  } catch (err) {
    console.error('[Dezeen] 크롤링 실패:', err)
  }

  return results
}
