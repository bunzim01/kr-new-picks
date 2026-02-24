#!/usr/bin/env node
// 수정된 크롤러 검증 — iHerb, MoMA Store, Poketo, Uncommon Goods

import { chromium } from 'playwright'
import { crawlIherb } from '../lib/crawler/iherb'
import { crawlMomaStore } from '../lib/crawler/momastore'
import { crawlPoketo } from '../lib/crawler/poketo'
import { crawlUncommonGoods } from '../lib/crawler/uncommongoods'
import { USER_AGENT } from '../lib/crawler/utils'

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  const page = await context.newPage()

  const crawlers = [
    { name: 'iHerb',         fn: crawlIherb },
    { name: 'MoMA Store',    fn: crawlMomaStore },
    { name: 'Poketo',        fn: crawlPoketo },
    { name: 'Uncommon Goods',fn: crawlUncommonGoods },
  ]

  const summary: Array<{ name: string; count: number; sample?: string }> = []

  for (const c of crawlers) {
    console.log(`\n── ${c.name} 수집 중...`)
    try {
      const products = await c.fn(page)
      console.log(`✅ ${products.length}개 수집`)
      if (products.length > 0) {
        const p = products[0]
        console.log(`   제목: "${p.title}"`)
        console.log(`   가격: "${p.price}"`)
        console.log(`   브랜드: "${p.brand}"`)
        console.log(`   이미지: "${p.image_url.slice(0, 70)}"`)
        console.log(`   URL: "${p.product_url.slice(0, 70)}"`)
      }
      summary.push({ name: c.name, count: products.length, sample: products[0]?.title })
    } catch (err) {
      console.error(`❌ 실패:`, err)
      summary.push({ name: c.name, count: 0 })
    }
  }

  console.log('\n════ 요약 ════')
  for (const s of summary) {
    const icon = s.count > 0 ? '✅' : '❌'
    console.log(`${icon} ${s.name.padEnd(20)} → ${s.count}개  ${s.sample ? `"${s.sample.slice(0, 40)}"` : ''}`)
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
