#!/usr/bin/env node
// 최종 탐색 — CultBeauty .list URL, iHerb kr 카테고리, Poketo 컬렉션, Uncommon Goods 서브셀렉터

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

  // ── CultBeauty: .list 형식 URL 탐색 ──
  console.log('\n═══ CultBeauty ═══')
  const cultUrls = [
    'https://www.cultbeauty.com',
    'https://www.cultbeauty.com/en-gb/bestsellers.list',
    'https://www.cultbeauty.com/en-us/bestsellers.list',
    'https://www.cultbeauty.com/en-gb/all.list',
  ]
  for (const url of cultUrls) {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null)
    const status = res?.status() ?? 0
    const title = await page.title()
    const finalUrl = page.url()
    console.log(`  [${status}] ${url}`)
    if (finalUrl !== url) console.log(`       → ${finalUrl}`)
    if (status === 200) {
      console.log(`       타이틀: "${title}"`)
      await page.waitForTimeout(2000)
      const sels = ['[data-test="productList"] li', '[class*="ProductCard"]', '[class*="product-card"]', 'li[class*="product"]', 'article']
      for (const sel of sels) {
        const n = await page.locator(sel).count()
        if (n > 0) console.log(`       ✅ [${sel}] → ${n}개`)
      }
    }
    await page.waitForTimeout(800)
  }

  // ── iHerb: 한국 사이트 카테고리 탐색 ──
  console.log('\n═══ iHerb ═══')
  const iherbUrls = [
    'https://kr.iherb.com/beauty',
    'https://kr.iherb.com/c/beauty-skin-care',
    'https://kr.iherb.com/c/bath-beauty',
    'https://kr.iherb.com/c/skin-care',
  ]
  for (const url of iherbUrls) {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null)
    const status = res?.status() ?? 0
    const title = await page.title()
    const finalUrl = page.url()
    console.log(`  [${status}] ${url}`)
    if (finalUrl !== url) console.log(`       → ${finalUrl}`)
    if (status === 200) {
      console.log(`       타이틀: "${title}"`)
      await page.waitForTimeout(3000)
      const sels = ['.product-cell', '[class*="product-cell"]', '.product-item', '[data-product-id]']
      for (const sel of sels) {
        const n = await page.locator(sel).count()
        if (n > 0) {
          const card = page.locator(sel).first()
          const titleText = (await card.locator('.product-title, [class*="title"]').first().textContent().catch(() => '')) ?? ''
          console.log(`       ✅ [${sel}] → ${n}개  예: "${titleText.trim().slice(0, 40)}"`)
        }
      }
    }
    await page.waitForTimeout(800)
  }

  // ── Poketo: 다른 컬렉션 URL 탐색 ──
  console.log('\n═══ Poketo 컬렉션 ═══')
  const poketoUrls = [
    'https://www.poketo.com/collections/all',
    'https://www.poketo.com/collections/new',
    'https://www.poketo.com/collections/whats-new',
    'https://www.poketo.com/collections/new-arrivals',
  ]
  for (const url of poketoUrls) {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null)
    const status = res?.status() ?? 0
    const finalUrl = page.url()
    const n = await page.locator('.product__card').count()
    console.log(`  [${status}] ${url}  →  .product__card: ${n}개  (최종: ${finalUrl !== url ? finalUrl : '동일'})`)
    await page.waitForTimeout(800)
  }

  // ── Uncommon Goods: 서브 셀렉터 검증 ──
  console.log('\n═══ Uncommon Goods 서브셀렉터 ═══')
  await page.goto('https://www.uncommongoods.com/gifts/best-sellers', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(6000)
  const ugCards = await page.locator('[class*="product-grid"] > *').count()
  console.log(`카드 [product-grid] > * → ${ugCards}개`)
  if (ugCards > 0) {
    const card = page.locator('[class*="product-grid"] > *').nth(1) // 0번째 건너뜀 (광고일 수 있음)
    const subSels: Record<string, string> = {
      '타이틀': 'h2, h3, [class*="title"], [class*="name"]',
      '가격':   '[class*="price"]',
      '이미지': 'img',
      '링크':   'a',
    }
    for (const [label, sel] of Object.entries(subSels)) {
      const n = await card.locator(sel).count()
      const txt = n > 0 ? (await card.locator(sel).first().textContent())?.trim().slice(0, 60) ?? '' : ''
      const src = (label === '이미지' && n > 0) ? (await card.locator(sel).first().getAttribute('src') ?? '') : ''
      const href = (label === '링크' && n > 0) ? (await card.locator(sel).first().getAttribute('href') ?? '') : ''
      console.log(`  ${n > 0 ? '✅' : '❌'} ${label}: → ${n}개  ${txt || src.slice(0, 80) || href}`)
    }
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
