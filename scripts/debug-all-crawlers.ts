#!/usr/bin/env node
// 전체 크롤러 디버그 스크립트 — 8개 사이트 순차 점검

import { chromium, Page } from 'playwright'
import path from 'path'
import fs from 'fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
const SCREENSHOT_DIR = path.join(process.cwd(), 'scripts', 'debug-screenshots')

// ── 사이트 정의 ──────────────────────────────────────────────
interface SiteConfig {
  name: string
  url: string
  // 기존 크롤러에서 사용 중인 카드 컨테이너 셀렉터
  cardSel: string
  // 카드 내부 세부 셀렉터
  subSels: Record<string, string>
  // 대안 셀렉터 (기존이 0개일 때 시도)
  altCardSels: string[]
}

const SITES: SiteConfig[] = [
  {
    name: 'CultBeauty',
    url: 'https://www.cultbeauty.com/best-sellers/',
    cardSel: '[data-test="productList"] li',
    subSels: {
      title: '[data-test="productName"]',
      brand: '[data-test="productBrand"]',
      price: '[data-test="currentPrice"]',
    },
    altCardSels: [
      'li[class*="product"]',
      '[class*="ProductCard"]',
      '[class*="product-card"]',
      'article[class*="product"]',
      'ul[class*="product"] li',
      'a[href*="/p/"]',
    ],
  },
  {
    name: 'iHerb',
    url: 'https://www.iherb.com/c/best-sellers',
    cardSel: '.product-cell',
    subSels: {
      title: '.product-title',
      brand: '.product-brand-name',
      price: '[itemprop="price"], .price',
    },
    altCardSels: [
      '[class*="product-cell"]',
      '[class*="ProductCell"]',
      '[data-product-id]',
      '.product-item',
      '[class*="product-item"]',
      'a[href*="/pr/"]',
    ],
  },
  {
    name: 'Anthropologie',
    url: 'https://www.anthropologie.com/new-arrivals/home',
    cardSel: '[class*="ProductCard"]',
    subSels: {
      title: '[class*="productName"], h2, h3',
      price: '[class*="Price"], [class*="price"]',
    },
    altCardSels: [
      '[class*="product-card"]',
      '[class*="ProductTile"]',
      '[class*="product-tile"]',
      'article[class*="product"]',
      'li[class*="product"]',
      'a[href*="/shop/"]',
    ],
  },
  {
    name: 'Urban Outfitters',
    url: 'https://www.urbanoutfitters.com/en-kr/best-sellers',
    cardSel: '[class*="c-product-tile"]',
    subSels: {
      title: '[class*="product-tile__name"]',
      price: '[class*="price--current"]',
    },
    altCardSels: [
      '[class*="product-tile"]',
      '[class*="ProductTile"]',
      '[class*="ProductCard"]',
      'li[class*="product"]',
      '[data-test*="product"]',
      'a[href*="/products/"]',
    ],
  },
  {
    name: 'Terrain',
    url: 'https://www.shopterrain.com/collections/new-arrivals',
    cardSel: '.grid__item',
    subSels: {
      title: '.product-item__title, h3, h2',
      price: '.price__regular, .price',
    },
    altCardSels: [
      '[class*="product-item"]',
      '[class*="ProductCard"]',
      '.product-card',
      'li[class*="grid"]',
      '[class*="collection-item"]',
      'a[href*="/products/"]',
    ],
  },
  {
    name: 'MoMA Store',
    url: 'https://store.moma.org/collections/new',
    cardSel: '.product-block',
    subSels: {
      title: '.product-block__title, h3',
      price: '.product-block__price, .price',
    },
    altCardSels: [
      '[class*="product-block"]',
      '[class*="ProductCard"]',
      '.product-card',
      '.product-item',
      'li[class*="product"]',
      'a[href*="/products/"]',
    ],
  },
  {
    name: 'Uncommon Goods',
    url: 'https://www.uncommongoods.com/gifts/best-sellers',
    cardSel: '[class*="ProductCard"], .product-card',
    subSels: {
      title: 'h2, h3, [class*="productName"]',
      price: '[class*="price"]',
    },
    altCardSels: [
      '[class*="product-card"]',
      '[class*="product-tile"]',
      '[class*="ProductTile"]',
      'li[class*="product"]',
      'article[class*="product"]',
      'a[href*="/product/"]',
    ],
  },
  {
    name: 'Poketo',
    url: 'https://poketo.com/collections/new-arrivals',
    cardSel: '.grid__item, [class*="ProductCard"]',
    subSels: {
      title: '.product-item__title, h3, h2',
      price: '.price__regular, .price',
    },
    altCardSels: [
      '[class*="product-item"]',
      '[class*="product-card"]',
      '.product-card',
      'li[class*="grid"]',
      '[class*="collection"]',
      'a[href*="/products/"]',
    ],
  },
]

// ── 헬퍼 ─────────────────────────────────────────────────────
async function checkSite(page: Page, site: SiteConfig) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`🏪 ${site.name}`)
  console.log(`🌐 ${site.url}`)

  let status = 0
  try {
    const res = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    status = res?.status() ?? 0
  } catch (e) {
    console.log(`❌ 페이지 로드 실패: ${e}`)
    return { name: site.name, status: 0, cardCount: 0, issue: 'load_failed' }
  }

  const title = await page.title()
  const finalUrl = page.url()
  console.log(`📡 HTTP: ${status}  |  타이틀: "${title}"`)
  if (finalUrl !== site.url) console.log(`🔀 리다이렉트: ${finalUrl}`)

  // 봇 차단 감지
  const blocked = title.toLowerCase().includes('access denied')
    || title.toLowerCase().includes('403')
    || title.toLowerCase().includes('robot')
    || title.toLowerCase().includes('captcha')
    || status === 403
  if (blocked) {
    console.log(`⛔ 봇 차단 감지됨`)
    await screenshot(page, site.name)
    return { name: site.name, status, cardCount: 0, issue: 'bot_blocked' }
  }

  // JS 렌더링 대기
  await page.waitForTimeout(3000)

  // 기존 카드 셀렉터 카운트
  const cardCount = await page.locator(site.cardSel).count()
  console.log(`\n📦 기존 카드 셀렉터 [${site.cardSel}]: ${cardCount}개`)

  if (cardCount > 0) {
    // 세부 셀렉터 확인
    const firstCard = page.locator(site.cardSel).first()
    console.log('   세부 셀렉터:')
    for (const [key, sel] of Object.entries(site.subSels)) {
      const count = await firstCard.locator(sel).count()
      const text = count > 0
        ? (await firstCard.locator(sel).first().textContent())?.trim().slice(0, 60) ?? ''
        : ''
      console.log(`   ${count > 0 ? '✅' : '❌'} ${key} [${sel}] → ${count}개 ${text ? `"${text}"` : ''}`)
    }
    // 이미지, 링크
    const imgCount = await firstCard.locator('img').count()
    const imgSrc = imgCount > 0 ? (await firstCard.locator('img').first().getAttribute('src') ?? '') : ''
    const hrefCount = await firstCard.locator('a').count()
    const href = hrefCount > 0 ? (await firstCard.locator('a').first().getAttribute('href') ?? '') : ''
    console.log(`   ✅ img → ${imgCount}개  src="${imgSrc.slice(0, 80)}"`)
    console.log(`   ✅ a   → ${hrefCount}개  href="${href.slice(0, 80)}"`)
  } else {
    // 대안 셀렉터 탐색
    console.log('   → 0개. 대안 셀렉터 탐색:')
    let bestAlt = ''
    let bestCount = 0
    for (const sel of site.altCardSels) {
      const count = await page.locator(sel).count()
      const mark = count > 0 ? '✅' : '❌'
      console.log(`   ${mark} ${sel.padEnd(40)} → ${count}개`)
      if (count > bestCount) { bestCount = count; bestAlt = sel }
    }

    // data-testid, class 키워드 힌트
    const classes = await page.evaluate(() => {
      const els = document.querySelectorAll('[class]')
      const words = new Set<string>()
      els.forEach(el => {
        el.className.toString().split(/\s+/).forEach(c => {
          if (c.toLowerCase().includes('product') || c.toLowerCase().includes('item') || c.toLowerCase().includes('card'))
            words.add(c)
        })
      })
      return [...words].sort().slice(0, 20)
    })
    if (classes.length > 0) {
      console.log(`\n   🔎 product/item/card 관련 클래스: ${classes.join(', ')}`)
    }

    if (bestCount > 0) {
      console.log(`\n   💡 추천 대안: [${bestAlt}] → ${bestCount}개`)
      // 샘플 HTML
      const html = await page.locator(bestAlt).first().innerHTML().catch(() => '')
      console.log(`   샘플 HTML (처음 600자):\n${html.slice(0, 600)}`)
    }
  }

  await screenshot(page, site.name)
  return { name: site.name, status, cardCount, issue: cardCount > 0 ? 'ok' : 'selector_mismatch' }
}

async function screenshot(page: Page, name: string) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  const file = path.join(SCREENSHOT_DIR, `${name.replace(/\s/g, '_')}.png`)
  await page.screenshot({ path: file, fullPage: false }).catch(() => {})
  console.log(`   📸 ${file}`)
}

// ── 메인 ─────────────────────────────────────────────────────
;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  const page = await context.newPage()
  const results: Array<{ name: string; status: number; cardCount: number; issue: string }> = []

  for (const site of SITES) {
    const r = await checkSite(page, site)
    results.push(r)
    await page.waitForTimeout(2000) // 사이트 간 딜레이
  }

  // ── 최종 요약 ──
  console.log(`\n${'═'.repeat(60)}`)
  console.log('📊 최종 요약')
  console.log('─'.repeat(60))
  for (const r of results) {
    const icon = r.issue === 'ok' ? '✅' : r.issue === 'bot_blocked' ? '⛔' : '⚠️ '
    console.log(`${icon} ${r.name.padEnd(20)} HTTP:${r.status}  카드:${r.cardCount}개  [${r.issue}]`)
  }

  await browser.close()
})().catch(err => {
  console.error('디버그 실패:', err)
  process.exit(1)
})
