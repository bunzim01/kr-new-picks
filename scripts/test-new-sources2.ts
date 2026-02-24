#!/usr/bin/env tsx
import { chromium } from 'playwright'
import { USER_AGENT } from '../lib/crawler/utils'
import { crawlCupOfJo } from '../lib/crawler/cupofjo'
import { crawlOhHappyDay } from '../lib/crawler/ohhappyday'
import { crawlWitAndDelight } from '../lib/crawler/witanddelight'
import { crawlDezeen } from '../lib/crawler/dezeen'
import { crawlCoolHunting } from '../lib/crawler/coolhunting'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ userAgent: USER_AGENT, locale: 'en-US' })
  const page = await ctx.newPage()

  const crawlers = [
    { name: 'Cup of Jo',    fn: crawlCupOfJo },
    { name: 'Oh Happy Day', fn: crawlOhHappyDay },
    { name: 'Wit & Delight',fn: crawlWitAndDelight },
    { name: 'Dezeen',       fn: crawlDezeen },
    { name: 'Cool Hunting', fn: crawlCoolHunting },
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
