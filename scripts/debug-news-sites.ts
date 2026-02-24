#!/usr/bin/env node
// 뉴스/블로그 기반 상품 소스 접근성 탐색

import { chromium, Page } from 'playwright'
import path from 'path'
import fs from 'fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
const SS_DIR = path.join(process.cwd(), 'scripts', 'debug-screenshots')
fs.mkdirSync(SS_DIR, { recursive: true })

const SITES = [
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/products',
    cardSels: ['[data-test="product-item"]', '[class*="product-item"]', 'li[class*="styles_item"]', 'section li', 'ul li'],
    titleSels: ['[data-test="product-name"]', 'h3', 'h2', '[class*="title"]', '[class*="name"]'],
  },
  {
    name: 'Allure Best Beauty',
    url: 'https://www.allure.com/gallery/best-new-beauty-products',
    cardSels: ['[class*="SummaryItemImage"]', '[class*="summary-item"]', 'article', '[data-testid*="item"]', '.summary-list__item', 'li[class*="item"]'],
    titleSels: ['h2', 'h3', '[class*="SummaryItemHed"]', '[class*="title"]'],
  },
  {
    name: 'The Strategist',
    url: 'https://nymag.com/strategist/article/best-things-to-buy',
    cardSels: ['[class*="article-body"] h2', '[class*="article-content"] h2', 'article h2', 'h2'],
    titleSels: ['h2', 'h3'],
  },
  {
    name: 'Apartment Therapy Shop',
    url: 'https://www.apartmenttherapy.com/shopping',
    cardSels: ['[class*="card"]', 'article', '[class*="item"]', 'li[class*="article"]', '.post-summary'],
    titleSels: ['h2', 'h3', '[class*="title"]', '[class*="headline"]'],
  },
  {
    name: 'Design Milk',
    url: 'https://design-milk.com/category/product-design/',
    cardSels: ['article', '.post', '[class*="article"]', '.entry'],
    titleSels: ['h2', 'h3', '.entry-title', '[class*="title"]'],
  },
  {
    name: 'Refinery29 Beauty',
    url: 'https://www.refinery29.com/en-us/beauty',
    cardSels: ['[class*="card"]', 'article', '[data-component*="card"]', 'li[class*="item"]'],
    titleSels: ['h2', 'h3', '[class*="title"]', '[class*="headline"]'],
  },
]

async function probe(page: Page, site: typeof SITES[0]) {
  console.log(`\n${'═'.repeat(55)}`)
  console.log(`🏪 ${site.name}`)
  console.log(`🌐 ${site.url}`)

  try {
    const res = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    const status = res?.status() ?? 0
    const title = await page.title()
    const finalUrl = page.url()
    console.log(`📡 HTTP: ${status}  |  "${title.slice(0, 60)}"`)
    if (finalUrl !== site.url) console.log(`🔀 → ${finalUrl}`)

    if (status >= 400 || title.toLowerCase().includes('access denied') || title.toLowerCase().includes('403')) {
      console.log('⛔ 차단 감지')
      await screenshot(page, site.name)
      return
    }

    await page.waitForTimeout(3000)

    // 카드 셀렉터 탐색
    let found = false
    for (const sel of site.cardSels) {
      const n = await page.locator(sel).count()
      if (n > 0) {
        console.log(`✅ 카드 [${sel}] → ${n}개`)
        const card = page.locator(sel).first()

        // 제목 셀렉터
        for (const titleSel of site.titleSels) {
          const tn = await card.locator(titleSel).count()
          if (tn > 0) {
            const text = (await card.locator(titleSel).first().textContent())?.trim().slice(0, 80) ?? ''
            console.log(`   제목 [${titleSel}] = "${text}"`)
            break
          }
        }

        // 이미지
        const imgN = await card.locator('img').count()
        if (imgN > 0) {
          const src = await card.locator('img').first().getAttribute('src') ?? ''
          console.log(`   img → "${src.slice(0, 80)}"`)
        }

        // 링크
        const aHref = await card.locator('a').first().getAttribute('href') ?? ''
        console.log(`   href → "${aHref.slice(0, 80)}"`)

        if (!found) {
          // 전체 텍스트 샘플
          const fullText = (await card.textContent())?.replace(/\s+/g, ' ').trim().slice(0, 150) ?? ''
          console.log(`   텍스트 = "${fullText}"`)
        }
        found = true
        break
      }
    }

    if (!found) {
      // class 힌트
      const classes = await page.evaluate(() => {
        const els = document.querySelectorAll('[class]')
        const words = new Set<string>()
        els.forEach(el => el.className.toString().split(/\s+/).forEach(c => {
          if (/card|item|article|product|post/i.test(c)) words.add(c)
        }))
        return [...words].sort().slice(0, 20)
      })
      console.log(`❌ 카드 없음. 관련 클래스: ${classes.join(', ')}`)
    }

    await screenshot(page, site.name)
  } catch (e) {
    console.log(`❌ 오류: ${e}`)
  }
}

async function screenshot(page: Page, name: string) {
  const file = path.join(SS_DIR, `news_${name.replace(/\s/g, '_')}.png`)
  await page.screenshot({ path: file }).catch(() => {})
  console.log(`📸 ${file}`)
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
    await page.waitForTimeout(2000)
  }

  await browser.close()
  console.log('\n✅ 탐색 완료')
})().catch(err => { console.error(err); process.exit(1) })
