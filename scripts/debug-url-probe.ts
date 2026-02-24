#!/usr/bin/env node
// URL/셀렉터 탐색 — CultBeauty, iHerb, Uncommon Goods

import { chromium, Page } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'

const PROBES = [
  {
    name: 'CultBeauty',
    urls: [
      'https://www.cultbeauty.com/bestsellers',
      'https://www.cultbeauty.com/top-sellers',
      'https://www.cultbeauty.com/collections/best-sellers',
      'https://www.cultbeauty.com/all-products',
    ],
    cardSels: [
      '[data-test="productList"] li',
      'li[class*="product"]',
      '[class*="ProductCard"]',
      '[class*="product-card"]',
      '[class*="productItem"]',
      'article',
    ],
  },
  {
    name: 'iHerb',
    urls: [
      'https://kr.iherb.com/c/best-sellers',
      'https://www.iherb.com/c/bestsellers',
      'https://www.iherb.com/c/0353',
      'https://www.iherb.com/c/beauty-skin-care?sort=t',
    ],
    cardSels: [
      '.product-cell',
      '[class*="product-cell"]',
      '.product-item',
      '[class*="product-item"]',
      '[data-product-id]',
      'a[href*="/pr/"]',
    ],
  },
  {
    name: 'Uncommon Goods',
    urls: [
      'https://www.uncommongoods.com/gifts/best-sellers',
    ],
    cardSels: [
      '[class*="ProductCard"]',
      '.product-card',
      '[class*="product-grid"] > *',
      '[class*="product-grid"] a',
      '[class*="ProductGrid"] > *',
      '[class*="item"]',
    ],
    extraWait: 6000, // JS 렌더링 대기
  },
]

async function probe(page: Page, name: string, urls: string[], cardSels: string[], extraWait = 3000) {
  console.log(`\n${'═'.repeat(55)}`)
  console.log(`🏪 ${name}`)

  for (const url of urls) {
    console.log(`\n  🌐 ${url}`)
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
      const status = res?.status() ?? 0
      const title = await page.title()
      const finalUrl = page.url()
      console.log(`  📡 HTTP: ${status}  |  "${title}"`)
      if (finalUrl !== url) console.log(`  🔀 → ${finalUrl}`)

      if (status >= 400) continue

      await page.waitForTimeout(extraWait)

      // 카드 셀렉터 탐색
      let found = false
      for (const sel of cardSels) {
        const count = await page.locator(sel).count()
        if (count > 0) {
          console.log(`  ✅ [${sel}] → ${count}개`)
          if (!found) {
            // 첫 번째 유효 셀렉터의 세부 정보
            const card = page.locator(sel).first()
            const text = (await card.textContent())?.trim().slice(0, 80) ?? ''
            const imgSrc = (await card.locator('img').first().getAttribute('src').catch(() => '')) ?? ''
            const href = (await card.locator('a').first().getAttribute('href').catch(() => '')) ?? ''
            console.log(`     text: "${text}"`)
            console.log(`     img:  "${imgSrc.slice(0, 80)}"`)
            console.log(`     href: "${href.slice(0, 80)}"`)
            found = true
          }
        }
      }
      if (!found) {
        // class 키워드 힌트
        const classes = await page.evaluate(() => {
          const els = document.querySelectorAll('[class]')
          const words = new Set<string>()
          els.forEach(el => {
            el.className.toString().split(/\s+/).forEach(c => {
              if (/product|item|card|grid/i.test(c)) words.add(c)
            })
          })
          return [...words].sort().slice(0, 25)
        })
        console.log(`  ⚠️  상품 셀렉터 없음. 관련 클래스: ${classes.join(', ')}`)
      }
    } catch (e) {
      console.log(`  ❌ 실패: ${e}`)
    }
    await page.waitForTimeout(1500)
  }
}

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  const page = await context.newPage()

  for (const p of PROBES) {
    await probe(page, p.name, p.urls, p.cardSels, p.extraWait)
    await page.waitForTimeout(2000)
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
