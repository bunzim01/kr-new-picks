#!/usr/bin/env node
// 접근 가능 사이트 셀렉터 정밀 탐색

import { chromium, Page } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'

const TARGETS = [
  {
    name: 'POPSUGAR Beauty',
    url: 'https://www.popsugar.com/beauty',
    cardSel: '[class*="Card"]',
    skip: 3, // 처음 몇 개는 헤더 카드
  },
  {
    name: 'Real Simple Shopping',
    url: 'https://www.realsimple.com/shopping-6375141',
    cardSel: '[class*="card"]',
    skip: 0,
  },
  {
    name: 'InStyle Shopping',
    url: 'https://www.instyle.com/shopping-5341456',
    cardSel: '[class*="card"]',
    skip: 0,
  },
  {
    name: 'Design Milk',
    url: 'https://design-milk.com/',
    cardSel: '[class*="post"]',
    skip: 2,
  },
  {
    name: 'Allure',
    url: 'https://www.allure.com/',
    cardSel: 'li[class*="item"]',
    skip: 2,
  },
  {
    name: 'Beautylish',
    url: 'https://www.beautylish.com/new-arrivals',
    cardSel: '[class*="Card"]',
    skip: 5,
  },
]

async function detail(page: Page, t: typeof TARGETS[0]) {
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`${t.name}`)
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(3000)

  const total = await page.locator(t.cardSel).count()
  console.log(`카드 [${t.cardSel}]: ${total}개`)
  if (total === 0) return

  // skip 이후 카드 3개 샘플
  for (let i = t.skip; i < Math.min(t.skip + 3, total); i++) {
    const card = page.locator(t.cardSel).nth(i)
    console.log(`\n  카드 #${i}:`)

    // 제목 셀렉터들 탐색
    const titleSels = ['h1','h2','h3','h4','[class*="hed"]','[class*="title"]','[class*="name"]','[class*="label"]','a span']
    for (const sel of titleSels) {
      const n = await card.locator(sel).count()
      if (n > 0) {
        const txt = (await card.locator(sel).first().textContent())?.trim().slice(0, 80) ?? ''
        if (txt && txt.length > 3) {
          console.log(`    제목 [${sel}] = "${txt}"`)
          break
        }
      }
    }

    // img
    const imgN = await card.locator('img').count()
    if (imgN > 0) {
      const src = (await card.locator('img').first().getAttribute('src') ??
                   await card.locator('img').first().getAttribute('data-src') ?? '')
      console.log(`    img = "${src.slice(0, 80)}"`)
    }

    // 링크
    const n = await card.locator('a[href]').count()
    if (n > 0) {
      const href = (await card.locator('a[href]').first().getAttribute('href')) ?? ''
      console.log(`    href = "${href.slice(0, 80)}"`)
    }

    // 가격 (e-commerce만)
    const priceSels = ['[class*="price"]','[class*="Price"]','bdi','.money']
    for (const sel of priceSels) {
      const pn = await card.locator(sel).count()
      if (pn > 0) {
        const pt = (await card.locator(sel).first().textContent())?.trim().slice(0, 30) ?? ''
        console.log(`    가격 [${sel}] = "${pt}"`)
        break
      }
    }
  }
}

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] })
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US', viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } })
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const page = await ctx.newPage()

  for (const t of TARGETS) {
    await detail(page, t)
    await page.waitForTimeout(1500)
  }
  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
