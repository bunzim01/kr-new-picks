// 크롤러 오케스트레이터 — 에디토리얼 사이트 기반 신상품 수집

import { chromium } from 'playwright'
import { RawProduct } from '../types'
import { USER_AGENT, delay } from './utils'

// 크롤러 임포트
import { crawlGoop } from './goop'
import { crawlDesignMilk } from './designmilk'
import { crawlDezeen } from './dezeen'
import { crawlBeautylish } from './beautylish'

// 사이트별 크롤러 목록
const CRAWLERS = [
  { name: 'Beautylish',    fn: crawlBeautylish },
  { name: 'Goop',          fn: crawlGoop },
  { name: 'Design Milk',   fn: crawlDesignMilk },
  { name: 'Dezeen',        fn: crawlDezeen },
]

export async function runAllCrawlers(): Promise<RawProduct[]> {
  console.log('🚀 크롤링 시작...')

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  })

  const context = await browser.newContext({
    userAgent: USER_AGENT,
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
  const allProducts: RawProduct[] = []

  for (const crawler of CRAWLERS) {
    console.log(`  📦 ${crawler.name} 수집 중...`)
    try {
      const products = await crawler.fn(page)
      console.log(`  ✅ ${crawler.name}: ${products.length}개 수집`)
      allProducts.push(...products)
      await delay(2000, 4000)
    } catch (err) {
      console.error(`  ❌ ${crawler.name} 실패 (건너뜀):`, err)
    }
  }

  await browser.close()
  console.log(`✅ 크롤링 완료: 총 ${allProducts.length}개`)
  return allProducts
}
