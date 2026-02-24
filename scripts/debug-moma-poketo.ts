#!/usr/bin/env node
// MoMA Store, Poketo 셀렉터 정밀 검증

import { chromium } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] })
  const context = await browser.newContext({
    userAgent: UA, locale: 'en-US', viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const page = await context.newPage()

  // ── MoMA Store ──────────────────────────────────────────────
  console.log('\n═══ MoMA Store ═══')
  await page.goto('https://store.moma.org/collections/new', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3000)
  console.log(`타이틀: ${await page.title()}`)
  console.log(`URL: ${page.url()}`)

  const momaCardSels = [
    '.collection-grid-item',
    'li.collection-grid-item',
    '[class*="collection-grid-item"]',
    'li[class*="product"]',
  ]
  for (const sel of momaCardSels) {
    const n = await page.locator(sel).count()
    if (n > 0) {
      const card = page.locator(sel).first()
      const subSels = {
        '타이틀': '.collection-grid-item__product-name',
        '가격':   '.collection-grid-item__product-price',
        '링크':   '.collection-grid-item__link-wrapper',
        '이미지': '.collection-grid-item__featured-image img, img',
      }
      console.log(`\n✅ 카드 [${sel}] → ${n}개`)
      for (const [label, sub] of Object.entries(subSels)) {
        const cnt = await card.locator(sub).count()
        const txt = cnt > 0 ? (await card.locator(sub).first().textContent())?.trim().slice(0, 60) : ''
        const src = (sub.includes('img') && cnt > 0) ? (await card.locator(sub).first().getAttribute('src') ?? '') : ''
        const href = (sub.includes('wrapper') && cnt > 0) ? (await card.locator(sub).first().getAttribute('href') ?? '') : ''
        console.log(`  ${cnt > 0 ? '✅' : '❌'} ${label}: [${sub}] → ${cnt}개  ${txt || src || href}`)
      }
      break
    }
  }

  // ── Poketo ──────────────────────────────────────────────────
  console.log('\n\n═══ Poketo ═══')
  await page.goto('https://www.poketo.com/collections/new-arrivals', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3000)
  console.log(`타이틀: ${await page.title()}`)
  console.log(`URL: ${page.url()}`)

  const poketoCardSels = [
    '.product__card',
    '[class*="product__card"]',
    '.grid__item',
    '[class*="product-item"]',
    'li[class*="product"]',
  ]
  for (const sel of poketoCardSels) {
    const n = await page.locator(sel).count()
    console.log(`${n > 0 ? '✅' : '❌'} [${sel}] → ${n}개`)
    if (n > 0) {
      const card = page.locator(sel).first()
      const subSels = {
        '타이틀': '.product__card-title, h3, h2, [class*="title"]',
        '가격':   '.product__card-price, [class*="price"], .price',
        '링크':   'a',
        '이미지': 'img',
      }
      for (const [label, sub] of Object.entries(subSels)) {
        const cnt = await card.locator(sub).count()
        const txt = cnt > 0 ? (await card.locator(sub).first().textContent())?.trim().slice(0, 60) ?? '' : ''
        const src = (label === '이미지' && cnt > 0) ? (await card.locator(sub).first().getAttribute('src') ?? '') : ''
        const href = (label === '링크' && cnt > 0) ? (await card.locator(sub).first().getAttribute('href') ?? '') : ''
        console.log(`  ${cnt > 0 ? '✅' : '❌'} ${label}: [${sub}] → ${cnt}개  ${txt || src.slice(0, 80) || href}`)
      }
    }
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
