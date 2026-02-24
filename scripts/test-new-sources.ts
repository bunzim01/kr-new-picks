#!/usr/bin/env tsx
import { chromium } from 'playwright'
import { USER_AGENT } from '../lib/crawler/utils'
import { crawlABeautifulMess } from '../lib/crawler/abeautifulmess'
import { crawlTheEverygirl } from '../lib/crawler/theeverygirl'
import { crawlCamilleStyles } from '../lib/crawler/camillestyles'
import { crawlDesignMilk } from '../lib/crawler/designmilk'

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const ctx = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
  })
  const page = await ctx.newPage()

  const crawlers = [
    { name: 'A Beautiful Mess', fn: crawlABeautifulMess },
    { name: 'The Everygirl',    fn: crawlTheEverygirl },
    { name: 'Camille Styles',   fn: crawlCamilleStyles },
    { name: 'Design Milk',      fn: crawlDesignMilk },
  ]

  for (const { name, fn } of crawlers) {
    try {
      const products = await fn(page)
      const withImg = products.filter(p => p.image_url).length
      console.log(`[${name}] ${products.length}개 수집, 이미지 ${withImg}개`)
      if (products[0]) console.log(`  → "${products[0].title?.slice(0, 50)}"`)
      if (products[0]?.image_url) console.log(`     img: ${products[0].image_url.slice(0, 70)}`)
    } catch (e) {
      console.error(`[${name}] 실패:`, e)
    }
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
