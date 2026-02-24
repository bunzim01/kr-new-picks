#!/usr/bin/env node
// 2차 뉴스/블로그 + 대안 e-commerce 탐색

import { chromium, Page } from 'playwright'
import path from 'path'
import fs from 'fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
const SS_DIR = path.join(process.cwd(), 'scripts', 'debug-screenshots')
fs.mkdirSync(SS_DIR, { recursive: true })

const SITES = [
  // 뷰티 블로그/미디어
  { name: 'Byrdie', url: 'https://www.byrdie.com/best-beauty-products-4773875', category: '뷰티' },
  { name: 'Allure (홈)', url: 'https://www.allure.com/', category: '뷰티' },
  { name: 'Into The Gloss', url: 'https://intothegloss.com/', category: '뷰티' },
  { name: 'POPSUGAR Beauty', url: 'https://www.popsugar.com/beauty', category: '뷰티' },
  { name: 'Who What Wear', url: 'https://www.whowhatwear.com/beauty', category: '뷰티' },
  // 라이프스타일 블로그/미디어
  { name: 'Real Simple Shopping', url: 'https://www.realsimple.com/shopping', category: '라이프스타일' },
  { name: 'InStyle', url: 'https://www.instyle.com/shopping', category: '라이프스타일' },
  // 아이디어/디자인
  { name: 'Design Milk (홈)', url: 'https://design-milk.com/', category: '아이디어' },
  { name: 'Dezeen Shop', url: 'https://www.dezeen.com/dezeenwatch/', category: '아이디어' },
  // 대안 e-commerce
  { name: 'Beautylish New', url: 'https://www.beautylish.com/shop/new-arrivals', category: '뷰티' },
  { name: 'Free People New', url: 'https://www.freepeople.com/new-arrivals/', category: '라이프스타일' },
  { name: 'Society6 New', url: 'https://society6.com/new', category: '아이디어' },
]

async function probe(page: Page, site: { name: string; url: string; category: string }) {
  console.log(`\n── ${site.name} (${site.category})`)
  try {
    const res = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    const status = res?.status() ?? 0
    const title = await page.title()
    const finalUrl = page.url()
    const blocked = title.toLowerCase().includes('access denied') || title.toLowerCase().includes('403') ||
                    title.toLowerCase().includes('cloudflare') || title.toLowerCase().includes('moment') ||
                    status >= 400

    if (blocked) {
      console.log(`   ⛔ [${status}] 차단/없음 — "${title.slice(0, 50)}"`)
      return
    }

    console.log(`   ✅ [${status}] "${title.slice(0, 60)}"`)
    if (finalUrl !== site.url) console.log(`   → ${finalUrl}`)

    await page.waitForTimeout(2500)

    // 아이템 카드 탐색
    const cardSels = [
      'article', '[class*="card"]', '[class*="Card"]', 'li[class*="item"]',
      '[class*="product"]', '[class*="post"]', '.entry', '.item',
    ]
    for (const sel of cardSels) {
      const n = await page.locator(sel).count()
      if (n >= 3) {
        const card = page.locator(sel).nth(1)
        const titleText = (await card.locator('h1,h2,h3,h4,[class*="title"],[class*="name"]').first()
          .textContent().catch(() => ''))?.trim().slice(0, 70) ?? ''
        const imgSrc = (await card.locator('img').first().getAttribute('src').catch(() => ''))?.slice(0, 70) ?? ''
        const href = (await card.locator('a').first().getAttribute('href').catch(() => '')) ?? ''
        console.log(`   카드 [${sel}] → ${n}개`)
        console.log(`     제목: "${titleText}"`)
        console.log(`     img: "${imgSrc}"`)
        console.log(`     href: "${href.slice(0, 70)}"`)
        break
      }
    }

    // 스크린샷
    const file = path.join(SS_DIR, `news2_${site.name.replace(/[\s\/]/g, '_')}.png`)
    await page.screenshot({ path: file }).catch(() => {})

  } catch (e) {
    console.log(`   ❌ 오류: ${String(e).slice(0, 80)}`)
  }
}

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent: UA, locale: 'en-US', viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  const page = await context.newPage()

  for (const site of SITES) {
    await probe(page, site)
    await page.waitForTimeout(1500)
  }

  await browser.close()
  console.log('\n탐색 완료')
})().catch(err => { console.error(err); process.exit(1) })
