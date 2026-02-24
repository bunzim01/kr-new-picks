#!/usr/bin/env node
// CultBeauty 최적 URL + Poketo collections/all 서브셀렉터 확인

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

  // ── CultBeauty: 여러 best-sellers URL 후보 ──
  console.log('═══ CultBeauty URL + 서브셀렉터 ═══')
  const cultUrls = [
    'https://www.cultbeauty.com/c/bestsellers/',
    'https://www.cultbeauty.com/c/bestsellers',
    'https://www.cultbeauty.com/beauty/bestsellers',
    'https://www.cultbeauty.com/',  // 홈 (fallback)
  ]
  for (const url of cultUrls) {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null)
    const status = res?.status() ?? 0
    const finalUrl = page.url()
    const n = await page.locator('[class*="product-card"]').count()
    console.log(`[${status}] ${url} → cards:${n} (${finalUrl !== url ? finalUrl : '동일'})`)
    if (status === 200 && n > 0) {
      await page.waitForTimeout(2000)
      const card = page.locator('[class*="product-card"]').first()
      // 서브셀렉터 탐색
      const subs: Record<string, string[]> = {
        title: ['[data-test="productName"]', '[class*="product-name"]', '[class*="productName"]', 'h3', 'h2', 'a span'],
        brand: ['[data-test="productBrand"]', '[class*="brand"]', '[class*="Brand"]'],
        price: ['[data-test="currentPrice"]', '[class*="price"]', '.price', 'bdi'],
        img:   ['img'],
        link:  ['a'],
      }
      for (const [key, selList] of Object.entries(subs)) {
        for (const sel of selList) {
          const cnt = await card.locator(sel).count()
          if (cnt > 0) {
            const isImg = key === 'img'
            const isLink = key === 'link'
            const val = isImg
              ? (await card.locator(sel).first().getAttribute('src') ?? '')
              : isLink
              ? (await card.locator(sel).first().getAttribute('href') ?? '')
              : (await card.locator(sel).first().textContent() ?? '')
            console.log(`  ✅ ${key.padEnd(5)} [${sel}] = "${val.trim().slice(0, 60)}"`)
            break
          }
        }
      }
      break
    }
    await page.waitForTimeout(800)
  }

  // ── Poketo: collections/all 서브셀렉터 ──
  console.log('\n═══ Poketo collections/all 서브셀렉터 ═══')
  await page.goto('https://www.poketo.com/collections/all', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(3000)
  console.log(`타이틀: ${await page.title()}, cards: ${await page.locator('.product__card').count()}개`)
  const pCard = page.locator('.product__card').nth(0)
  const poketoSubs: Record<string, string[]> = {
    title: ['.product__card-title', 'h2', 'h3', 'a[href*="/products/"]'],
    price: ['bdi', '.money', '[class*="price-item--regular"]', '.price-item', '[class*="price"] bdi'],
    img:   ['img'],
    link:  ['a[href*="/products/"]', 'a'],
  }
  for (const [key, selList] of Object.entries(poketoSubs)) {
    for (const sel of selList) {
      const cnt = await pCard.locator(sel).count()
      if (cnt > 0) {
        const isImg = key === 'img'
        const isLink = key === 'link'
        const val = isImg
          ? (await pCard.locator(sel).first().getAttribute('src') ?? '')
          : isLink
          ? (await pCard.locator(sel).first().getAttribute('href') ?? '')
          : (await pCard.locator(sel).first().textContent() ?? '')
        console.log(`  ✅ ${key.padEnd(5)} [${sel}] = "${val.trim().slice(0, 70)}"`)
        break
      }
    }
  }

  // ── Uncommon Goods: a[href*="/product/"] 텍스트로 타이틀 추출 ──
  console.log('\n═══ Uncommon Goods 타이틀 셀렉터 재검증 ═══')
  await page.goto('https://www.uncommongoods.com/gifts/best-sellers', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(6000)
  const ugCard = page.locator('[class*="product-grid"] > *').nth(1)
  const ugSubs: Record<string, string> = {
    'a링크제목':   'a[href*="/product/"]',
    'h2':          'h2',
    'h3':          'h3',
    '[class*=name]': '[class*="name"]',
    '[class*=title]': '[class*="title"]',
  }
  for (const [key, sel] of Object.entries(ugSubs)) {
    const cnt = await ugCard.locator(sel).count()
    if (cnt > 0) {
      const txt = (await ugCard.locator(sel).first().textContent() ?? '').trim().slice(0, 80)
      console.log(`  [${sel}] → "${txt}"`)
    }
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
